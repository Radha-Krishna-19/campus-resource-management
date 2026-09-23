# Campus Resource Manager

A full-stack campus hall-booking platform with priority-aware conflict resolution, a self-healing reallocation engine, ML-based demand forecasting, and a natural-language booking assistant. Built as a team project (5 engineers) and hardened here into a deployment-ready product.

**Live components:** [`frontend/`](./frontend) (React 18 + Vite) · [`backend/`](./backend) (Node.js + Express 5 + MongoDB)

## What it does

- **Coordinators** submit hall booking requests — either through a normal form or by describing the booking in plain English (e.g. *"Book Hall A for 60 people this Friday 2 to 4pm for a seminar"*), which the **NLP booking assistant** parses into the form automatically.
- **Admins** review requests. A higher-priority event can override an existing approved booking; when that happens, the **reallocation engine** automatically scores every other active hall (40% capacity fit, 30% floor proximity, 30% utilization fairness) and offers the displaced coordinator the best alternatives.
- The **Reports** dashboard shows booking trends, a 7-day demand forecast (Facebook Prophet, with a statistical fallback), and AI-generated insights (Google Gemini) — monopolization alerts, space-efficiency scoring, and optimization recommendations.
- Every action is captured in an **audit log**, and admins get automated email alerts for underused rooms via a daily cron job.

## Architecture

```
┌─────────────┐        HTTPS/cookies        ┌──────────────┐        ┌─────────────┐
│  Frontend   │ ───────────────────────────▶ │   Backend    │ ─────▶ │   MongoDB   │
│  React/Vite │ ◀─────────────────────────── │ Express 5    │        │ (sessions + │
│  (nginx in  │        JSON over /api        │ session auth │        │  app data)  │
│  production)│                              │ + RBAC       │        └─────────────┘
└─────────────┘                              └──────┬───────┘
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    ▼                 ▼                 ▼
                            Prophet (Python,    Google Gemini      Reallocation
                            child_process)      (forecasting        engine
                                                 insights +         (weighted
                                                 NLP parsing)        scoring)
```

## Tech stack & why

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, small production bundle, the team's existing skill set |
| UI | Tailwind + Radix (shadcn pattern) + Framer Motion | Accessible primitives (focus-trapped dialogs) with real, previously-unused animation instead of hand-rolled CSS |
| Backend | Node.js + Express 5 | Express 5 auto-forwards rejected async handlers to error middleware — closes a whole class of unhandled-promise bugs found in the original codebase |
| Database | MongoDB + Mongoose | Document model fits variable booking/room metadata; existing team familiarity |
| Sessions | express-session + connect-mongo | Persistent, restart-safe sessions — previously declared as a dependency but never actually wired in (silently in-memory) |
| Validation | Zod | Schema validation at the route boundary instead of ad-hoc per-controller truthiness checks |
| Security | Helmet + express-rate-limit | Baseline OWASP headers and brute-force protection with near-zero config |
| Logging | Pino / pino-http | Structured JSON logs, replacing raw `console.log` |
| ML forecasting | Facebook Prophet (Python) with a statistical fallback | Time-series forecasting; degrades gracefully when Python/Prophet isn't available |
| AI insights + NLP | Google Gemini, JSON mode | Reused for both demand insights and the booking-text parser — one integration, two features |
| NLP fallback | chrono-node + regex | Deterministic date/time/entity extraction that works with zero API key — a genuine second NLP technique, not just an LLM wrapper |
| Containerization | Docker (multi-stage builds) + docker-compose | Portable, works on any host; nginx serves the frontend's static build rather than a Node process |

## Quick start (Docker Compose — recommended)

```bash
docker compose up --build
```

This starts MongoDB, the backend (`:8000`), and the frontend (`:5173`). Open `http://localhost:5173`.

To enable Gemini-powered insights and NLP parsing, set `GEMINI_API_KEY` in your shell before running compose (it's optional — both features fall back gracefully without it).

## Manual setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI, SESSION_SECRET at minimum
npm install
npm run create-admin   # creates the first admin account
npm run dev            # http://localhost:8000, API docs at /api/docs

# Frontend (separate terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

## Security & production hardening

This pass fixed several real issues found during the audit, not just cosmetic ones:

- **`POST /api/rooms/seed` was unauthenticated** and could wipe the entire room inventory — now admin-only.
- **Coordinators could create/edit/delete rooms** (route said "(admin)" in a comment but wasn't actually enforced) — now correctly admin-only.
- **Frontend admin routes silently had no role check** — `ProtectedRoute` reads an `allowedRoles` array, but 9 admin routes passed a `requiredRole` string prop that the component never read, so the gate was a no-op.
- **Sessions were in-memory** despite `connect-mongo` being a dependency and the README claiming persistence — now actually MongoDB-backed.
- **Session secret and cookie flags were hardcoded** — now environment-driven, with `secure` cookies enforced in production.
- **No rate limiting anywhere** — login and admin-signup are now throttled.
- A free-text search field built an **unescaped MongoDB regex from user input** (ReDoS/injection risk) — now escaped.
- **The frontend's API base URL was hardcoded to `localhost:8000`** globally via axios defaults — meaning the app could never reach a deployed backend. All requests now go through one configurable client.

⚠️ **Known, deliberately-not-fixed issue:** both source repos have a `.env` file in their git history (added, then later deleted). Deleting from HEAD doesn't remove it from history. If you're the project owner, rotate any Mongo URI / session secret / API key that was ever in those files — this repo's history was NOT rewritten to scrub it, since that would rewrite shared history for four other contributors without their sign-off.

## Testing

```bash
cd backend && npm test    # Jest — 50+ tests
cd frontend && npm test   # Vitest — 16 tests
```

## Team

Aravind R K · Kanishka D · Sandheep G S · Radha Krishna · Sujith Kumar A

## License

MIT — see [LICENSE](./LICENSE).
