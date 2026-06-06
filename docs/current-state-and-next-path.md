# AquaVeda Current State and Next Path

## Current State

AquaVeda is now in a product-complete core state: authenticated users can move through the main IA, explore issues on a map-first workspace, read and contribute to moderated wiki content, discuss issues through comments, organize collaborative projects, and view both user and admin dashboards.

The frontend has also been refined for perceived quality and performance:

- Explore uses a persistent FilterPanel | MapCanvas | IssuePanel layout instead of popup-heavy interactions.
- Framer Motion is used only for meaningful state changes in Explore.
- The client bundle is split with route-level lazy loading and vendor chunks.
- Dashboard charts are deferred until the analytics section is actually reached.
- Dashboard chart chunks now also prefetch during idle time after the first admin dashboard paint.

The backend already includes auth, RBAC, validation, rate limiting, CORS allowlisting, geo queries, comments, projects, recommendation endpoints, and dashboard aggregates.

## Suggested Next Path

1. Finish the remaining Sprint 5 item: API/UI tests for critical flows.
2. Decide whether the product should move next into engagement mechanics such as XP, contribution score, and badges.
3. If product scope expands, add the next missing UX shell piece: contextual sidebars by section.

server/src/modules/auth/auth.routes.js
6. Better Modern Design
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

Real systems need lifecycle, not just entrance doors.
Renew

Expand auth capabilities:

password reset
refresh tokens
logout
email verification
auth limiter

server/src/modules/auth/auth.controller.js
Fix:
const safeUser = {
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
};
No checks for:

valid email
password length
empty strings
malicious payloads

Need schema validation (Zod/Joi/express-validator).

Better Modern Version
const sanitizeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
});

const generateToken = (u) =>
  jwt.sign(
    { id: u._id, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

Use refresh token separately.

Remove

Returning raw Mongoose document.

Renew
DTO response objects
validation layer
token helper
refresh token flow
email normalization

🔴 TIER 1 — CRITICAL (Fix Immediately)
Security
 Add select: false to user password
 Remove password from all API responses
 Add input validation (Zod) to auth & comments
 Sanitize user input (prevent XSS)
 Add auth rate limiter (login/register)
 Validate JWT_SECRET at startup
Data Integrity
 Remove Issue.comments[] array (double storage)
 Normalize comment retrieval via query only
 Add email normalization in login
Database
 Add 2dsphere index to issues.location
 Add index on comments.issue
 Add index on issues.createdBy
API Safety
 Add request body size limits
 Add Helmet security middleware
🟠 TIER 2 — HIGH IMPACT
Auth System
 Create token helper (remove duplication)
 Add refresh token system
 Add logout endpoint
 Add forgot/reset password flow
 Add role-based middleware (authorize)
Issues Module
 Add pagination
 Add filtering (category, status, location)
 Add geospatial queries ($near)
 Add issue status field
 Convert category → enum
Comments Module
 Add pagination
 Add sorting (latest first)
 Add validation for comment text
 Remove redundant issue updates
🟡 TIER 3 — STRUCTURE & CLEANUP
Backend Architecture
 Add graceful shutdown (SIGINT/SIGTERM)
 Add structured logger (replace console.log)
 Add error classification (dev vs prod)
 Extract token logic into utility
Models
 Add toJSON sanitization for User
 Add max length constraints (bio, description)
 Add soft delete fields (future-proofing)
Performance
 Avoid over-population of comments
 Optimize queries with projections
 Add caching layer (optional future)
🟢 TIER 4 — ADVANCED / SCALE
Product Features
 Issue lifecycle (open → resolved)
 Moderation tools
 User activity tracking
 Admin dashboards refinement
Infrastructure
 Add test suite (Jest / integration tests)
 Add CI/CD pipeline
 Add environment validation layer
 Add monitoring/logging (Winston / Pino)

server/src/config/db.js
  Add try/catch
  Add logger
  Add shutdown close
  Add connection events
  Add timeout/pool config

server/src/server.js
  . Better Modern Version
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import { app } from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down...");
  server?.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();

server/src/modules/users/user.model.js
  password select:false
  toJSON sanitize
  stronger password rules
  bio max length
  explicit index handling
  move hashing into model or service layer

server/src/middlewares/auth.middleware.js
Better Version
export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

Missing Advanced Layer (Important)
Role Middleware
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

Add .select("-password")
Add select:false in schema
Add role-based middleware
Improve token error handling
Add refresh token system (later phase)

server/src/modules/issues/issues.controller.js

Better Modern Version (Concept)
Pagination
const page = Number(req.query.page) || 1;
const limit = 10;
const skip = (page - 1) * limit;

const issues = await Issue.find()
  .skip(skip)
  .limit(limit);

  What Should Be Removed / Renewed
Keep
Zod usage
clean controller separation
population (with limits later)
Renew
pagination
filtering
geo queries
status system
stricter validation
response shaping

Add pagination immediately
Add geo-based querying
Add issue status field
Add filtering
Limit population depth
Add ownership checks

## Notes

- The roadmap intentionally keeps AI hybrid expansion deferred until explicitly needed.
- The current focus should stay on polish, reliability, and release readiness rather than new feature breadth.
