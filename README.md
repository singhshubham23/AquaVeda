# AquaVeda

AquaVeda is a geo-intelligent, AI-assisted, community-driven platform for water conservation. It combines moderated knowledge sharing, map-based issue reporting, collaborative projects, and rule-based recommendations into one product system.

## Overview

AquaVeda is designed to help communities report water problems, learn from verified knowledge, discuss solutions, and organize action around real-world issues.

The current implementation includes:

- JWT auth and role-based access control
- Moderated wiki system with draft, approve, reject, and ownership rules
- Geo-tagged issues with map-ready data and filters
- Leaflet map visualization in the client
- Rule-based AI recommendations
- Comment threads for issue discussions
- Collaborative projects with contributors and progress tracking
- User and admin dashboards for product visibility with clean chart-based analytics
- Route-level lazy loading, vendor chunking, and deferred dashboard chart loading for better initial performance

## Architecture

Frontend -> Backend API -> MongoDB -> AI Layer -> Map Layer

### Modules

- Auth: register, login, protected profile access, and role guards
- Wiki: knowledge articles with moderation workflow
- Issues: geo-tagged water issues, filtering, and nearby queries
- Maps: Leaflet-based visualization with filter controls
- AI: rule-based recommendation engine for issue guidance
- Community: comments and threaded replies
- Projects: collaboration layer for turning issues into action
- Dashboard: user impact metrics and admin-wide analytics with role and status visualizations
- Performance: split bundles for routes and vendors, with dashboard charts loaded only when needed

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, React Router, Vite, Leaflet, react-leaflet |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| AI | Rule-based engine, prepared for Gemini/LLM expansion |

## Project Structure

```text
AquaVeda/
  client/
  server/
  docs/
  ai-service/
```

- `client`: React app with map UI and issue interactions
- `server`: Express API with auth, wiki, issues, comments, AI, and projects
- `docs`: context, logs, todo, bugs, and planning notes
- `ai-service`: reserved for future external AI/service experiments

## Core Features

### Auth and Access Control

- Register and login endpoints
- JWT-protected routes
- USER, EXPERT, and ADMIN roles
- Seeded admin and expert accounts for testing

### Knowledge System

- Draft article creation
- Author-only edits while pending
- Expert/admin approval and reject flow
- Public visibility only for approved content

### Geo Issues

- Issue reporting with coordinates
- 2dsphere geospatial indexing
- Nearby lookup and filter endpoints
- Map-ready response formatting

### Map Layer

- Leaflet visualization
- Severity and status filters
- Popup actions for AI suggestions and comments

### AI Layer

- Deterministic recommendation rules
- Issue-specific guidance endpoint
- Hybrid AI strategy documented for later LLM integration

### Community Layer

- Issue comments
- Single-level threaded replies
- Validation for discussion queries and writes

### Projects Layer

- Create projects from real issues
- Join collaborative projects
- Track contributor lists and progress
- Creator-controlled progress updates

## API Highlights

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Wiki

- `POST /api/v1/wiki`
- `GET /api/v1/wiki`
- `GET /api/v1/wiki/mine`
- `PATCH /api/v1/wiki/:id`
- `POST /api/v1/wiki/:id/approve`
- `POST /api/v1/wiki/:id/reject`

### Issues

- `POST /api/v1/issues`
- `GET /api/v1/issues`
- `GET /api/v1/issues/filter`
- `GET /api/v1/issues/map`
- `GET /api/v1/issues/nearby`

### Comments

- `GET /api/v1/comments?refType=ISSUE|WIKI&refId=...`
- `POST /api/v1/comments`

### AI

- `GET /api/v1/ai/recommend/:id`

### Projects

- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `POST /api/v1/projects/:id/join`
- `PATCH /api/v1/projects/:id/progress`

### Dashboard

- `GET /api/v1/dashboard/user`
- `GET /api/v1/dashboard/admin`

## Setup

### Prerequisites

- Node.js 18+ recommended
- MongoDB running locally or Atlas connection string

### Server Runtime

```bash
cd server
npm install
npm run dev
```

### Client Runtime

```bash
cd client
npm install
npm run dev
```

### Seed Users

```bash
cd server
npm run seed:users
```

## Environment Variables

### Server Environment

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET=change_me_in_dev
JWT_EXPIRES=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
```

### Client Environment

```env
VITE_API_URL=http://localhost:5000/api
```

### Optional Future AI

```env
GEMINI_API_KEY=your_api_key_here
```

## Available Scripts

### Server

- `npm run dev`
- `npm start`
- `npm run seed:users`

### Client

- `npm run dev`
- `npm run build`
- `npm run preview`

## Documentation Rules

- Every feature must update `docs/context.md`
- Every change must be logged in `docs/logs.md`
- Every bug must be recorded in `docs/bugs.md`
- No undocumented feature is allowed

## Hardening Notes

- Route validation is centralized with Zod-based middleware
- List APIs use standardized pagination (`page`, `limit`)
- Rate limiting is enabled globally and stricter for auth endpoints
- CORS allowlist is controlled through `ALLOWED_ORIGINS` for deployment flexibility

## Future Scope

- Gemini/LLM hybrid recommendation layer
- NGO or government collaboration modules
- Real-time water data integration
- Mobile application

## Status

AquaVeda currently includes the complete core system with hardening, map-first explore UX, and dashboard visibility: auth, moderated wiki, geo issues, map visualization, AI suggestions, community discussions, projects, and user/admin dashboards with clean chart analytics. The client bundle has been optimized with route lazy loading, vendor chunking, and deferred dashboard chart rendering.

## Next Path

The next recommended work is release-readiness polish: idle-time prefetch for dashboard charts, API/UI tests for critical flows, deployment checklist completion, and environment/runbook cleanup. After that, the product can decide whether to add engagement mechanics such as XP, contribution score, and badges.

## Author

Built as a national-level project and extended into a full product architecture.
