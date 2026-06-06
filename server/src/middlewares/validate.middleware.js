import { ZodError } from "zod";
import { ValidationError } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    // Build normalized copies to avoid mutating read-only request properties
    const normalizedQuery = { ...(req.query || {}) };
    if (normalizedQuery.refType)
      normalizedQuery.refType = String(normalizedQuery.refType).toUpperCase();

    const normalizedBody = { ...(req.body || {}) };
    if (normalizedBody.refType)
      normalizedBody.refType = String(normalizedBody.refType).toUpperCase();

    const parsed = schema.parse({
      body: normalizedBody,
      query: normalizedQuery,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) req.params = parsed.params;
    if (parsed.query && req.query) {
      for (const key of Object.keys(req.query)) {
        delete req.query[key];
      }
      Object.assign(req.query, parsed.query);
    }

    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(
        new ValidationError(
          err.issues.map((item) => item.message).join(", "),
          err.issues.map((item) => ({
            path: item.path.join("."),
            message: item.message,
          })),
        ),
      );
    }

    return next(err);
  }
};
