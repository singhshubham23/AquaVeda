# AquaVeda Refactor Plan (Execution Order)

---

# PHASE 1 — CRITICAL (DO FIRST, NO EXCEPTIONS)

## 1. `server/src/modules/users/user.model.js`

* Add:

  ```js
  password: { select: false, minlength: 8 }
  ```
* Add `toJSON` transform to remove:

  * password
  * __v
* Add:

  * bio max length
* Ensure:

  * email lowercase (already done)
* Move hashing to model OR keep centralized (choose one, not both)

---

## 2. `server/src/modules/auth/auth.controller.js`

* Replace all responses:

  ```js
  res.json({ token, user })
  ```

  → with sanitized DTO

* Add:

  * input validation (Zod)
  * email normalization before query

* Extract:

  ```js
  generateToken()
  sanitizeUser()
  ```

* Remove:

  * raw Mongoose object returns

---

## 3. `server/src/middlewares/auth.middleware.js`

* Update:

  ```js
  User.findById(...).select("-password")
  ```

* Improve error handling:

  * TokenExpiredError
  * Invalid token

* Add:

  ```js
  authorize(...roles)
  ```

---

## 4. `server/src/modules/issues/issue.model.js`

* Add:

  ```js
  issueSchema.index({ location: "2dsphere" });
  ```

* Add:

  * status enum (open, in-progress, resolved)
  * category enum

* Add:

  * description max length

* Remove:

  * dependency on comments array (prepare for removal)

---

## 5. `server/src/modules/comments/comments.controller.js`

* REMOVE:

  ```js
  issue.comments.push(...)
  await issue.save()
  ```

* Keep:

  * Comment → Issue relation only

* Add:

  * validation (Zod)
  * pagination
  * sorting

---

## 6. `server/src/modules/comments/comment.model.js`

* Add:

  * text min/max length
  * trim

* Add indexes:

  ```js
  { issue: 1, createdAt: -1 }
  { createdBy: 1 }
  ```

---

## 7. Global Security Layer (`app.js` likely)

* Add:

  * Helmet
  * request body limit
  * auth rate limiter

---

# PHASE 2 — CORE FUNCTIONALITY (HIGH IMPACT)

## 8. `server/src/modules/issues/issues.controller.js`

Add:

* Pagination:

  ```js
  limit + skip
  ```

* Filtering:

  * category
  * status

* Geo queries:

  ```js
  $near
  ```

* Response shaping

* Ownership validation (future updates)

---

## 9. `server/src/modules/auth/auth.routes.js`

Expand:

```js
/logout
/refresh
/forgot-password
/reset-password
```

Add:

* authLimiter on login/register

---

## 10. Auth System Upgrade

* Add:

  * refresh token flow
  * short-lived access token
* Optional:

  * HttpOnly cookies

---

# PHASE 3 — STRUCTURE & STABILITY

## 11. `server/src/config/db.js`

* Add:

  * try/catch
  * connection options
  * connection event listeners
  * structured logging

---

## 12. `server/src/server.js`

* Add:

  * graceful shutdown (SIGINT, SIGTERM)
  * mongoose connection close
  * better error logging

---

## 13. Logging Layer

* Replace:

  ```js
  console.log
  ```
* With:

  * structured logger (Winston / Pino)

---

## 14. Validation Layer

* Centralize:

  * Zod schemas
* Apply consistently:

  * auth
  * issues
  * comments

---

# PHASE 4 — PERFORMANCE & SCALE

## 15. Query Optimization

* Avoid:

  * full collection queries
* Add:

  * projections
  * pagination everywhere

---

## 16. Population Control

* Limit:

  * comments population
* Avoid deep nesting

---

## 17. Indexing

Ensure indexes on:

* issues.location (2dsphere)
* issues.createdBy
* comments.issue
* users.email (unique)

---

# PHASE 5 — ADVANCED (OPTIONAL BUT STRONG)

## 18. Product Features

* Issue lifecycle tracking
* Moderation tools
* Admin controls
* User activity metrics

---

## 19. Infrastructure

* Add:

  * test suite
  * CI/CD
  * environment validation
  * monitoring/logging

---

# EXECUTION ORDER (STRICT)

```text
1. User model
2. Auth controller
3. Auth middleware
4. Issue model
5. Comment controller
6. Comment model
7. Security layer (app.js)
8. Issues controller
9. Auth routes expansion
10. Auth system upgrade
11. DB config
12. Server lifecycle
13. Logging
14. Validation layer
15. Query optimization
16. Indexing
17. Advanced features
```

---

# FINAL STATE TARGET

After this:

* No data leaks
* No redundant storage
* Scalable queries
* Proper auth lifecycle
* Clean API contracts
* Production-ready backend

---

# Brutally Simple Truth

Right now your project is:

> Architecturally strong, operationally naive

This plan turns it into:

> Production-capable system

Follow the order. Don’t improvise. That’s how people end up rewriting everything at 3 AM.
