import jwt from "jsonwebtoken";
import { error } from "../utils/response.js";
import { normalizeRole, getPermissionsForRole, ROLES } from "../constants/rbac.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.accessToken || req.headers["x-access-token"] || null;
};

export const authenticate = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return error(res, "Authentication required.", 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const role = normalizeRole(payload.role || ROLES.MEMBER);
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions
      : getPermissionsForRole(role);

    req.user = {
      id: payload.sub || payload.id || payload._id,
      email: payload.email,
      name: payload.name,
      role,
      permissions,
      tenantId: payload.tenantId,
    };

    if (!req.user.id) {
      return error(res, "Invalid authentication token.", 401);
    }

    return next();
  } catch (_err) {
    return error(res, "Invalid or expired authentication token.", 401);
  }
};

export const verifyJWT = authenticate;

export const optionalAuth = (req, _res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const role = normalizeRole(payload.role || ROLES.MEMBER);
    req.user = {
      id: payload.sub || payload.id || payload._id,
      email: payload.email,
      name: payload.name,
      role,
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions
        : getPermissionsForRole(role),
      tenantId: payload.tenantId,
    };
  } catch {
    req.user = undefined;
  }

  return next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return error(res, "Authentication required.", 401);
  }

  if (!req.user.permissions?.includes(permission)) {
    return error(res, "You do not have permission to perform this action.", 403);
  }

  return next();
};

export const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return error(res, "Authentication required.", 401);
  }

  const allowed = permissions.flat().some((permission) =>
    req.user.permissions?.includes(permission),
  );

  if (!allowed) {
    return error(res, "You do not have permission to perform this action.", 403);
  }

  return next();
};
