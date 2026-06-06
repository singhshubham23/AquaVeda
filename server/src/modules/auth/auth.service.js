import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../users/user.model.js";
import Membership from "../organizations/membership.model.js";
import logger from "../../config/logger.js";
import { AuthenticationError, ConflictError } from "../../utils/AppError.js";
import {
  ROLES,
  getPermissionsForRole,
  normalizeRole,
} from "../../constants/rbac.js";

const resolveLegacyTenantUserByEmail = async (normalizedEmail, tenantId) => {
  const user = await User.findOne({ email: normalizedEmail, tenantId }).select(
    "+password +refreshToken",
  );
  if (user) {
    return user;
  }

  const legacyUser = await User.findOne({
    email: normalizedEmail,
    tenantId: { $exists: false },
  }).select("+password +refreshToken");
  if (legacyUser) {
    legacyUser.tenantId = tenantId;
    await legacyUser.save({ validateBeforeSave: false });
    return legacyUser;
  }

  // Fallback: if this email exists in exactly one tenant, use that tenant account.
  // This avoids false "invalid credentials" when a stale tenant header is sent.
  const tenantMatches = await User.find({ email: normalizedEmail }).select(
    "+password +refreshToken",
  );
  if (tenantMatches.length === 1) {
    return tenantMatches[0];
  }

  return null;
};

/**
 * Sanitize user document to DTO — strips all sensitive fields.
 */
const sanitizeUser = (user) => ({
  id: user._id,
  tenantId: user.tenantId,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role || ROLES.MEMBER),
  permissions: getPermissionsForRole(user.role || ROLES.MEMBER),
  bio: user.bio,
  reputation: user.reputation,
  badges: user.badges,
  verified: user.verified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const resolveEffectiveRole = async (user, tenantId, orgId = null) => {
  const currentRole = normalizeRole(user.role || ROLES.MEMBER);
  if (currentRole && currentRole !== ROLES.VIEWER) {
    return currentRole;
  }

  const membershipQuery = {
    userId: user._id,
    tenantId,
    status: "ACTIVE",
  };

  if (orgId) {
    membershipQuery.orgId = orgId;
  }

  const membership = await Membership.findOne(membershipQuery).select("role");
  if (membership?.role) {
    return normalizeRole(membership.role);
  }

  return currentRole || ROLES.MEMBER;
};

/**
 * Generate short-lived access token.
 */
const generateAccessToken = (user, orgId = null) => {
  const payload = { id: user._id, tenantId: user.tenantId };
  if (orgId) payload.orgId = orgId;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "15m",
  });
};

/**
 * Generate long-lived refresh token.
 */
const generateRefreshToken = (user, orgId = null) => {
  const payload = { id: user._id, tenantId: user.tenantId };
  if (orgId) payload.orgId = orgId;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  });
};

export const registerUser = async ({ name, email, password }, tenantId) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({
    email: normalizedEmail,
    $or: [{ tenantId }, { tenantId: { $exists: false } }],
  });
  if (existing) {
    throw new ConflictError("User already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    tenantId,
    name,
    email: normalizedEmail,
    password: hashed,
    role: ROLES.MEMBER,
  });

  logger.info(`User registered: ${normalizedEmail} (${tenantId})`);

  return sanitizeUser(user);
};

export const loginUser = async ({ email, password, orgId }, tenantId) => {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await resolveLegacyTenantUserByEmail(normalizedEmail, tenantId);
  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password);

  // active organization can be provided by the client during login
  // e.g. { email, password, orgId }
  const activeOrgId = orgId || null;

  if (!match) throw new AuthenticationError("Invalid credentials");

  const accessToken = generateAccessToken(user, activeOrgId);
  const refreshToken = generateRefreshToken(user, activeOrgId);

  user.role = await resolveEffectiveRole(user, tenantId, activeOrgId);
  user.permissions = getPermissionsForRole(user.role);

  // Store hashed refresh token
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  logger.info(`User logged in: ${normalizedEmail} (${tenantId})`);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken, tenantId) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  if (decoded.tenantId && decoded.tenantId !== tenantId) {
    throw new AuthenticationError("Refresh token tenant mismatch");
  }

  let user = await User.findOne({ _id: decoded.id, tenantId }).select(
    "+refreshToken",
  );
  if (!user) {
    user = await User.findOne({
      _id: decoded.id,
      tenantId: { $exists: false },
    }).select("+refreshToken");
    if (user) {
      user.tenantId = tenantId;
      await user.save({ validateBeforeSave: false });
    }
  }
  if (!user || !user.refreshToken) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!valid) {
    throw new AuthenticationError("Invalid refresh token");
  }

  // Rotate tokens — preserve orgId if present on the refresh token
  const newAccessToken = generateAccessToken(user, decoded.orgId || null);
  const newRefreshToken = generateRefreshToken(user, decoded.orgId || null);

  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  logger.info(`User logged out: ${userId}`);
};

import { sendPasswordResetEmail } from "../../utils/email.service.js";

export const forgotPassword = async (email, tenantId) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await resolveLegacyTenantUserByEmail(normalizedEmail, tenantId);

  if (!user) {
    // Don't reveal whether the user exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested for: ${normalizedEmail}`);

  // Send the email (mocked for now)
  await sendPasswordResetEmail(normalizedEmail, resetToken);
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new AuthenticationError("Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshToken = null; // Invalidate all sessions
  await user.save();

  logger.info(`Password reset completed for: ${user.email}`);
};
