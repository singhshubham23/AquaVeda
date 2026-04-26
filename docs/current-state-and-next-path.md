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

## Notes

- The roadmap intentionally keeps AI hybrid expansion deferred until explicitly needed.
- The current focus should stay on polish, reliability, and release readiness rather than new feature breadth.
