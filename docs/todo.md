# Aquaveda TODO

## 🔥 PHASE 1 — FOUNDATION

- [x] Backend setup
- [x] Frontend setup
- [x] Auth system
- [x] Role system (middleware)

## 🌊 PHASE 2 — WIKI SYSTEM

- [x] Article model
- [x] Create or edit article
- [x] Approval system
- [x] Expert verification
- [x] Ownership checks
- [x] User article view

## 🌍 PHASE 3 — GEO ISSUES

- [x] Issue model
- [x] Add issue
- [x] Geo queries (nearby)
- [x] Leaflet integration
- [x] Map filters

## 🤝 PHASE 4 — COMMUNITY

- [x] Comments system
- [x] Discussion threads

## 🧠 PHASE 5 — AI ENGINE

- [x] Rule-based recommendation engine
- [x] API endpoint

## 📊 PHASE 6 — DASHBOARD

- [x] User dashboard
- [x] Admin dashboard

## 🏗️ PHASE 7 — PROJECTS

- [x] Project model
- [x] Join project
- [x] Progress tracking (basic)

## 🎮 PHASE 8 — ENGAGEMENT

- [ ] XP system
- [ ] Contribution score
- [ ] Badges

---

## 🧪 FINAL

- [ ] Testing
- [ ] Deployment
- [ ] Documentation updates

---

## 🔐 PHASE 1.5 — HARDENING

- [x] Zod-based centralized validation middleware
- [x] Reusable pagination helper and paginated list endpoints
- [x] Global and auth-specific rate limiting
- [x] CORS tightening using env-driven ALLOWED_ORIGINS
- [x] Safety checks for geo numeric parsing and progress bounds

---

## Execution Plan (April 2026)

### Sprint 1 (Current) - Access + Data Foundations

Goal: unlock secure user flows and stable data models so feature work can proceed safely.

- [ ] Auth API (register, login, me, logout)
- [x] Auth API (register, login)
- [x] Auth API (me)
- [ ] Auth API (logout)
- [x] JWT middleware + protected route guard
- [x] Role middleware (USER, EXPERT, ADMIN)
- [ ] User model with role and profile basics
- [x] Shared API response + error shape
- [x] Seed script for admin and expert test users
- [x] Request validation middleware (phase 1.5)
- [x] Pagination standardization (phase 1.5)
- [x] Rate limiting (phase 1.5)
- [x] CORS hardening with ALLOWED_ORIGINS (phase 1.5)

Exit criteria:

- [ ] User can sign up and log in from client
- [ ] Protected endpoint blocks unauthenticated requests
- [ ] Role-restricted endpoint blocks wrong role
- [ ] Postman collection (or equivalent) covers auth happy-path and failures

### Sprint 2 - Wiki MVP

Goal: ship first useful knowledge workflow with moderation hooks.

- [ ] Article model (title, body, tags, region, status, author)
- [x] Create draft article endpoint
- [x] Edit draft article endpoint
- [ ] Submit for review endpoint
- [x] Approve endpoint (EXPERT/ADMIN)
- [x] Reject endpoint (EXPERT/ADMIN)
- [ ] Client pages for article list, detail, create/edit
- [x] User article view endpoint (/mine)

Exit criteria:

- [x] USER can create and edit own draft
- [x] EXPERT/ADMIN can approve or reject
- [x] Only approved articles appear publicly

### Sprint 3 - Geo Issues MVP

Goal: enable issue reporting and map visualization.

- [x] Issue model (location, severity, images, status, owner)
- [x] Add issue endpoint with validation
- [x] List issues endpoint
- [x] Filter issues endpoint (region, severity, status)
- [x] Leaflet map view with markers and filters

Exit criteria:

- [x] Authenticated user can report an issue with coordinates
- [x] Map renders issues and supports basic filters

### Sprint 4 - Community + AI v1

Goal: bring collaboration and first recommendation value.

- [x] Comments on articles/issues
- [x] Thread replies (single depth initially)
- [x] Rule-based recommendation service
- [x] Recommendation endpoint by issue/article context

Exit criteria:

- [x] Users can discuss content via comments
- [x] Recommendation API returns deterministic suggestions from rule set

### Sprint 5 - Dashboards + Projects + Quality

Goal: complete impact loops and harden for release.

- [x] User dashboard metrics
- [x] Admin dashboard analytics
- [ ] Project model + join/leave + progress updates
- [ ] XP/badges basics tied to contributions
- [ ] API and UI tests for critical paths
- [x] Deployment checklist and environment docs

Exit criteria:

- [ ] Core flows covered by tests
- [ ] Staging deployment passes smoke checks
- [ ] Docs updated for onboarding and runbooks

## Immediate Build Order

1. Auth and role middleware
2. User model + seed data
3. API standards (errors/responses/validation)
4. Wiki model and endpoints
5. Geo issue model and endpoints
6. Frontend integration for auth, wiki, and map

## Risks to Track

- Scope creep across phases without sprint cut-lines
- Missing validation and auth checks causing rework
- Map UX complexity (cluster/filter performance)
- Documentation drift if logs/context are not updated per feature

---

## Deferred Later (Not In Current Scope)

- [ ] Hybrid AI layer: keep rule-based engine as primary and add optional Gemini-powered contextual suggestions
- [ ] Add endpoint design for smart recommendations: ruleBased + aiGenerated response contract
- [ ] Trigger policy: call LLM only on explicit user action (never on every issue fetch)
- [ ] Add safeguards before rollout: rate limiting, caching, fallback behavior when LLM is unavailable

---

## Product UI System Roadmap (Active)

Core loop to optimize in every feature slice:

Problem -> Insight -> Collaboration -> Action -> Impact -> Trust

### Current Focus (Mandatory First)

- [x] Build `ExplorePage` as primary hero screen
- [x] Replace map popup-heavy flow with structured `IssuePanel`
- [x] Deliver 3-column desktop layout: FilterPanel | MapCanvas | IssuePanel
- [x] Deliver mobile behavior: map + bottom-sheet issue details
- [x] Refine IssuePanel into action hub (context -> insight -> community -> action)
- [x] Improve marker UX (hover feedback, selected marker emphasis, severity styling)
- [x] Upgrade filter UX with active chips and reset
- [x] Add Explore-level empty and loading states with recovery CTA
- [x] Enforce typography and spacing hierarchy in Explore workspace
- [x] Standardize card and button system usage in Explore interaction surfaces
- [x] Add marker visual identity polish including critical pulse and tooltip guidance
- [x] Add subtle motion for panel updates, AI disclosure, and interactive controls
- [x] Precision spacing and typography rhythm audit for Explore and Dashboard
- [x] Content density calibration for issue description, comments preview, and AI list readability
- [x] Map presence refinement with panel-focus overlay and stronger marker orientation cues
- [x] Top navigation utility layer: search, notifications, profile controls
- [x] Framer Motion interaction layer (IssuePanel transition, AI expand or collapse, filter chip motion)
- [x] Motion anti-overuse tuning (removed redundant CSS animations and constrained motion emphasis)
- [x] Route-level lazy loading and vendor manual chunking to eliminate oversized initial bundle warning
- [x] Dashboard chart payload defer: load chart modules only when analytics section enters viewport

### Global UI Architecture

- [x] Top-level IA routes: Explore, Learn, Act, Community, Dashboard
- [x] Shared top navigation shell
- [ ] Add contextual sidebar system by section
	- Explore: filters
	- Learn: categories
	- Act: project navigation
	- Dashboard: stat links
- [ ] Add top-nav utility actions: search, notifications, profile menu
- [x] Dashboard idle-time prefetch for chart chunks after first dashboard paint

### Explore (Map-First UX) — Step 1

- [x] Create page and layout containers
	- `pages/ExplorePage.jsx`
	- `components/layout/TopNav.jsx`
	- `components/layout/Sidebar.jsx`
- [x] Create map system components
	- `components/map/MapCanvas.jsx`
	- `components/map/MarkerLayer.jsx`
	- `components/map/IssueMarker.jsx`
- [x] Create issue panel system
	- `components/issues/IssuePanel.jsx`
	- `components/issues/IssueHeader.jsx`
	- `components/issues/IssueDetails.jsx`
	- `components/issues/IssueAISection.jsx`
	- `components/issues/IssueCommentsPreview.jsx`
	- `components/issues/IssueActions.jsx`
- [x] Create filter components
	- `components/filters/FilterPanel.jsx`
	- `components/filters/SeverityFilter.jsx`
	- `components/filters/StatusFilter.jsx`
	- `components/filters/RegionFilter.jsx`
- [x] Issue panel content rules
	- title + severity badge
	- description
	- AI suggestions accordion
	- latest 3 comments + view all entry point
	- actions: Start Project, Add Comment

### Dashboard (Refactor) — Step 2

- [ ] Keep stat cards + 3-chart row clarity
- [ ] Extract and reuse `StatCard` component
- [ ] Reduce controls to role-appropriate actions only
- [ ] Keep progressive disclosure for advanced analytics

### Learn and Act Consistency — Step 3

- [ ] Learn section UI composition
	- `pages/WikiPage.jsx`
	- `components/wiki/WikiList.jsx`
	- `components/wiki/WikiCard.jsx`
	- `components/wiki/WikiArticle.jsx`
	- `components/wiki/WikiEditor.jsx`
- [ ] Projects section UI composition
	- `pages/ProjectsPage.jsx`
	- `components/projects/ProjectCard.jsx`
	- `components/projects/ProjectList.jsx`
	- `components/projects/ProjectDetails.jsx`
	- `components/projects/ProgressBar.jsx`
	- `components/projects/MilestoneList.jsx`

### Community Structure

- [ ] Build dedicated community thread page
	- `pages/CommunityPage.jsx`
	- `components/comments/CommentList.jsx`
	- `components/comments/CommentItem.jsx`
	- `components/comments/ReplyThread.jsx`
	- `components/comments/CommentInput.jsx`

### Design System Baseline (Apply Across All)

- [ ] Color tokens
	- Primary `#2563eb`
	- Success `#16a34a`
	- Warning `#f59e0b`
	- Danger `#dc2626`
	- Neutral `#f8fafc` and `#1e293b`
- [ ] Spacing system: 8px grid
- [ ] Card system
	- radius: 12px
	- soft shadow
	- padding: 16-20px
- [ ] States in every major view
	- loading: skeletons
	- empty: friendly message + CTA
	- error: recoverable action

### Product UX Guardrails

- [ ] One-screen clarity: what is happening, what user can do, impact result
- [ ] No clutter: max 3 primary actions per screen
- [ ] Progressive disclosure: complex details behind expandable sections

### Next Build Order

1. ExplorePage + IssuePanel redesign (mandatory)
2. Dashboard UI clarity refactor
3. Learn + Projects consistency styling and component parity

---

## Phase Checkpoint Summary (Tracking Anchors)

Keep this summary in sync with the detailed roadmap above.

### Phase A — UX & Interaction

- [x] IA shell with clear top-level routes: Explore, Learn, Act, Community, Dashboard
- [x] Shared top navigation and app layout shell
- [x] Auth UI flow started: login/register pages wired and dashboard route protected
- [x] Map-first detail panel redesign (desktop side panel and mobile bottom sheet)
- [ ] Unified loading, empty, and error states across all top-level views
- [x] Visual system baseline pass (severity tokens, spacing scale, cards and interactions)

### Phase B — Feature Depth

- [ ] Issue confirmations or affected-too workflow
- [ ] Issue status history timeline
- [ ] Project milestones
- [ ] Project progress update log
- [ ] Dashboard impact counters tied to lifecycle outputs

### Phase C — Intelligence & Trust

- [ ] Reputation scoring rules linked to meaningful actions
- [ ] Moderation queue with report and resolution actions
- [ ] Comment helpful sorting and basic mentions
- [ ] Context-aware AI inputs (issue state, region, trust signals) while keeping deterministic rule-first behavior
