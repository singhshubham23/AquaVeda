import { ValidationError } from "../utils/AppError.js";
import { DEFAULT_TENANT_ID, TENANT_HEADER } from "../constants/tenant.js";

const normalizeTenant = (tenantId) => String(tenantId || "").trim().toLowerCase();

export const resolveTenant = (req, _res, next) => {
  const tenantFromHeader = req.headers[TENANT_HEADER];
  const tenantFromAuth = req.user?.tenantId;
  const tenantId = normalizeTenant(tenantFromHeader || tenantFromAuth || DEFAULT_TENANT_ID);

  if (!tenantId) {
    return next(new ValidationError("Tenant id is required"));
  }

  req.tenantId = tenantId;
  return next();
};

export const enforceTenantAccess = (req, _res, next) => {
  const tenantFromHeader = req.headers[TENANT_HEADER];
  if (!req.user) {
    return next();
  }

  if (tenantFromHeader && normalizeTenant(tenantFromHeader) !== req.user.tenantId) {
    return next(new ValidationError("Tenant mismatch between token and request header"));
  }

  return next();
};
