# AquaVeda Current State and Next Path

## Current State

AquaVeda is now in a product-complete core state: authenticated users can move through the main IA, explore issues on a map-first workspace, read and contribute to moderated wiki content, discuss issues through comments, organize collaborative projects, and view both user and admin dashboards.

The frontend has also been refined for perceived quality and performance:

- Explore uses a persistent FilterPanel | MapCanvas | IssuePanel layout instead of popup-heavy interactions.
- Framer Motion is used only for meaningful state changes in Explore.
- The client bundle is split with route-level lazy loading and vendor chunks.
- Dashboard charts are deferred until the analytics section is actually reached.

The backend already includes auth, RBAC, validation, rate limiting, CORS allowlisting, geo queries, comments, projects, recommendation endpoints, and dashboard aggregates.

## Suggested Next Path

1. Add idle-time prefetch for dashboard chart chunks after the first dashboard paint.
2. Finish the remaining Sprint 5 items: API/UI tests, deployment checklist, and environment/runbook docs.
3. Decide whether the product should move next into engagement mechanics such as XP, contribution score, and badges.
4. If product scope expands, add the next missing UX shell piece: contextual sidebars by section.

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



## Notes

- The roadmap intentionally keeps AI hybrid expansion deferred until explicitly needed.
- The current focus should stay on polish, reliability, and release readiness rather than new feature breadth.
