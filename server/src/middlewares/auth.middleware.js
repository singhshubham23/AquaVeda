import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import Membership from "../modules/organizations/membership.model.js";
import logger from "../config/logger.js";
import { AuthenticationError, ForbiddenError } from "../utils/AppError.js";
import { TENANT_HEADER } from "../constants/tenant.js";
import {
  PERMISSIONS,
  ROLES,
  getPermissionsForRole,
  hasPermission,
  normalizeRole,
} from "../constants/rbac.js";

/**
 * Verify JWT and attach the full user object (minus password) to req.user.
 */
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AuthenticationError("Unauthorized"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tenantFromHeader = String(req.headers[TENANT_HEADER] || "")
      .trim()
      .toLowerCase();

    // Fetch full user from DB (without password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new AuthenticationError("User no longer exists"));
    }

    if (decoded.tenantId && decoded.tenantId !== user.tenantId) {
      return next(new AuthenticationError("Token tenant mismatch"));
    }

    if (tenantFromHeader && decoded.tenantId && tenantFromHeader !== decoded.tenantId) {
      return next(
        new AuthenticationError("Tenant mismatch between token and request header"),
      );
    }

    // Resolve role via Memberships (org-scoped). If token contains orgId, prefer that membership.
    let resolvedRole = null;
    const activeOrgId = decoded.orgId || null;
    if (activeOrgId) {
      const membership = await Membership.findOne({
        userId: user._id,
        orgId: activeOrgId,
        tenantId: decoded.tenantId || user.tenantId,
      });
      if (membership) resolvedRole = normalizeRole(membership.role);
    }

    // If no org-scoped membership, attempt to find any active membership for this user in the tenant
    if (!resolvedRole) {
      const membership = await Membership.findOne({
        userId: user._id,
        tenantId: decoded.tenantId || user.tenantId,
        status: "ACTIVE",
      });
      if (membership) resolvedRole = normalizeRole(membership.role);
    }

    // Normalize the effective role on every request so stale documents or legacy
    // aliases cannot widen access.
    user.role = normalizeRole(resolvedRole || user.role || ROLES.MEMBER);
    user.permissions = getPermissionsForRole(user.role);

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AuthenticationError("Token expired"));
    }

    if (err.name === "JsonWebTokenError") {
      return next(new AuthenticationError("Invalid token"));
    }

    logger.error("Auth middleware error:", err);
    return next(new AuthenticationError("Authentication error"));
  }
};

/**
 * Role-based access control.
 * Replaces the old allowRoles from role.middleware.js.
 *
 * Usage: authorize("ADMIN", "MEMBER")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("Unauthorized"));
    }

    const role = normalizeRole(req.user.role);
    const permissions = Array.isArray(req.user.permissions)
      ? req.user.permissions
      : getPermissionsForRole(role);

    if (roles.length === 0) {
      return next();
    }

    const hasAccess = roles.some((item) => {
      if (Object.values(PERMISSIONS).includes(item)) {
        return hasPermission({ role, permissions }, item);
      }

      return normalizeRole(item) === role;
    });

    if (!hasAccess) {
      return next(new ForbiddenError("Forbidden: insufficient permissions"));
    }

    return next();
  };
};

// Backward-compatible alias
export const allowRoles = authorize;
