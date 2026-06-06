/**
 * Centralized environment variable validation.
 * Called at startup before any other module touches process.env.
 */

const required = ["MONGO_URI", "JWT_SECRET"];

const optional = {
  PORT: "5000",
  CLIENT_URL: "http://localhost:3000",
  JWT_EXPIRES: "3d",
  REFRESH_TOKEN_EXPIRES: "7d",
  ALLOWED_ORIGINS: "",
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX: "200",
  AUTH_RATE_LIMIT_WINDOW_MS: "900000",
  AUTH_RATE_LIMIT_MAX: "20",
  DEFAULT_TENANT_ID: "public",
  ADMIN_SEED_EMAIL: "admin@aquaveda.com",
  MEMBER_SEED_EMAIL: "member@aquaveda.com"
};

export const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if ((process.env.JWT_SECRET || "").length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters for production-grade security");
  }

  // Set defaults for optional vars that are missing
  for (const [key, defaultValue] of Object.entries(optional)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
};
