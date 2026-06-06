# Aquaveda Context

## Product Definition

Aquaveda is a geo-intelligent water conservation platform combining knowledge sharing, AI recommendations, and community collaboration.

---

## Core Pillars

1. Knowledge (Wiki)
2. Geo Intelligence (Maps + Issues)
3. Community (Discussions)
4. AI Recommendations
5. Impact (Projects)

---

## Modules

### Auth

- JWT-based authentication
- Roles: USER, EXPERT, ADMIN

### Wiki System

- Articles with verification system
- Region-based tagging
- Expert validation

### Water Issues

- Geo-tagged issues
- Severity classification
- Image + description support

### Community

- Feed-first community posts, questions, and discussions
- Linked to issues and articles

### AI Engine

- Rule-based recommendations
- Upgrade-ready for ML

### Projects

- Collaborative real-world solutions
- Contribution tracking

### Dashboard

- Member/user activity snapshot
- Admin-only analytics and moderation controls
- Regional insights

## Implementation Status

- Phase 1 foundation started
- Backend bootstrap added with health route and DB connector
- Frontend bootstrap added with Vite shell and basic routes
- Env example files added for server, client, and AI service
- Server runtime validated with local MongoDB URI and successful connection
- Auth foundation started: user model added, register and login endpoints live under /api/v1/auth
- Access control hardened with JWT verification, role guards, and protected me endpoint
- Default registration now creates MEMBER accounts, with legacy VIEWER accounts treated as members
- Seed system added for baseline ADMIN and MEMBER users
- Shared API response contract introduced with centralized error and not-found shapes
- Wiki module started with article model, protected creation, expert approval, and approved-only public listing
- Wiki moderation lifecycle completed with author-only draft edits, expert or admin reject flow, and per-user article listing
- Geo issues module started with geospatial issue model, authenticated issue reporting, issue listing, and nearby issue queries
- Geo visualization layer added with issue filtering API and Leaflet map rendering for marker-based issue exploration
- AI layer added with rule-based recommendations per issue context and map popup suggestion retrieval
- Community layer added with comments and one-level threaded replies for issue discussions
- Community layer now includes a feed-first workspace with Quora-style questions, contribution posts, and issue threads while keeping the issue desk available as a separate tab
- Projects layer added to convert issues into collaborative projects with contributors and basic progress tracking
- API hardening layer added with centralized Zod validation, pagination standards, env-driven CORS allowlist, and route-rate limiting
- Dashboard layer added with protected user metrics and admin analytics endpoints plus frontend stats cards view
- Dashboard analytics upgraded with three chart visualizations (role distribution, issue status, project status) powered by backend aggregate datasets
- Dashboard charts refined with compact legends and stable status ordering for clearer, consistent admin analytics
- Frontend performance improved by lazy-loading the dashboard route to defer Recharts payload until needed
- Product-first Phase A started with IA top-level areas, shared navigation layout, auth pages, and protected dashboard flow via centralized auth context
- Explore UX redesigned into a persistent workspace using FilterPanel + MapCanvas + IssuePanel architecture with marker-click panel updates and responsive layout
- Explore UX refinement layer added with progressive AI disclosure, live comments preview snippets, contextual action CTAs, marker hover or selection feedback, active filter chips, and map empty-state recovery actions
- Visual consistency layer applied in Explore with typography scale, 8px spacing rhythm, reusable card/button styles, utility top-nav controls, marker pulse identity for critical issues, and subtle panel/accordion motion
- Precision polish pass completed with tighter spacing rhythm, readability calibration, interaction press feedback, map focus presence, and Dashboard visual parity with Explore
- Framer Motion layer added for state-change transitions in Explore (issue selection panel animation, AI section expand/collapse, and filter chip micro-interactions)
- Motion layer tightened to avoid over-animation by removing redundant CSS keyframe effects and keeping animations scoped to meaningful state changes
- Frontend bundle profile improved by lazy-loading primary routes and splitting vendor libraries (React, map, charts, motion) into dedicated chunks for faster initial payload delivery
- Dashboard analytics rendering optimized by deferring chart component module loading until the analytics section enters viewport
- Dashboard analytics now also prefetches chart modules during idle time after the first admin dashboard paint for faster expansion
- Release-readiness docs added for deployment and runbook guidance

## Current State Summary

- Core product loop is implemented: auth, wiki, issues, map visualization, AI recommendations, community discussion, projects, and dashboards.
- Community now presents a friendlier member-facing feed for questions, contributions, and issue conversations instead of only workflow controls.
- New sign-ups now default to MEMBER, legacy VIEWER accounts can contribute, and ADMIN keeps the full control surface.
- Explore is the main product workspace and is now the preferred map-first entry path.
- Frontend performance work has removed the oversized initial bundle warning and shifted heavy analytics code off the first paint.

## Suggested Next Path

- API/UI tests for critical flows still need to be added.
- Deployment checklist and runbook/environment documentation are now available and should be kept current.
- Decide whether to add engagement mechanics next, or hold the line on polish and release readiness.

---

## Architecture

Frontend -> Backend -> DB -> AI Layer -> Map Layer

---

## Design Philosophy

- Modular architecture
- Upgrade-ready systems
- Documentation-first development
- Real-world impact focus

---

## Feature Transfer Checklist (from CyberShield)

### Adopted for Phase 1

- Backend auth and RBAC skeleton
- Middleware layering for JWT and role protection
- Env-driven configuration and example env workflow
- Documentation-first flow using context, todo, logs, and bugs

### Planned to Adopt Next

- Frontend route and layout shell
- Centralized API service wrapper
- Input sanitization helpers and global security middleware layering
- Error boundary and API error middleware alignment

### Explicitly Not Transferred

- Phishing game and cyber-threat specific product logic
- CyberShield report, meme, and video moderation domain workflows
- Wallet or coin economy rules unless Aquaveda later enables gamification

---

## Non-Goals (for now)

- Real-time IoT integration
- Blockchain
- Paid monetization

---

## Deferred AI Strategy Note

- Gemini LLM integration is planned as a secondary intelligence layer, not a replacement for rule-based recommendations.
- Preferred architecture for later:
  - Rule engine returns deterministic guidance first.
  - LLM returns contextual explanation and additional suggestions.
- Call policy for cost and latency control:
  - Trigger only when user explicitly asks for AI suggestions.
  - Avoid automatic LLM calls during issue list or map loads.
