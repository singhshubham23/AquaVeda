import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import healthRoutes from "./routes/healthRoutes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import commentRoutes from "./modules/comments/comment.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import issueRoutes from "./modules/issues/issue.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import wikiRoutes from "./modules/wiki/wiki.routes.js";
import moderationRoutes from "./modules/moderation/moderation.routes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { resolveTenant } from "./middlewares/tenant.middleware.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";
import { error, success } from "./utils/response.js";

const app = express();

// Render runs behind a proxy; trust first hop for correct client IP handling.
app.set("trust proxy", 1);
app.disable("x-powered-by");

const parseAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (envOrigins && envOrigins.length > 0) {
    return envOrigins;
  }

  return [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
};

const allowedOrigins = parseAllowedOrigins();

const globalLimiter = rateLimit({
  windowMs:
    Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    error(res, "Too many requests, please try again later.", 429),
});

const authLimiter = rateLimit({
  windowMs:
    Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) ||
    15 * 60 * 1000,
  max: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) =>
    error(
      res,
      "Too many authentication attempts, please try again later.",
      429,
    ),
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const corsError = new Error("CORS origin not allowed");
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(globalLimiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use("/uploads", express.static("uploads"));

const sanitizeMongoKeys = (value) => {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    value.forEach(sanitizeMongoKeys);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (key.includes("$") || key.includes(".")) {
      delete value[key];
      continue;
    }
    sanitizeMongoKeys(value[key]);
  }

  return value;
};

app.use((req, _res, next) => {
  sanitizeMongoKeys(req.body);
  sanitizeMongoKeys(req.query);
  sanitizeMongoKeys(req.params);
  next();
});

app.use(morgan("dev"));
app.use(resolveTenant);

app.use("/api/health", healthRoutes);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use(verifyJWT);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/issues", issueRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/wiki", wikiRoutes);
app.use("/api/v1/moderation", moderationRoutes);

app.get("/", (req, res) => {
  return success(res, { service: "Aquaveda API" }, "API is running");
});

app.use(notFound);
app.use(errorHandler);

export default app;
