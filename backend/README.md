# Campus Resource Manager - Backend (The Intelligence Layer)

This is the backend server for the Campus Resource Management system, designed to handle hall bookings, faculty information, and user authentication for a university environment. This service handles priority logic, AI-driven forecasting, and automated reallocation.

## 🚀 Key Features

### 1. Priority-Based Booking & Conflict Resolution
- **User Authentication**: Session-based authentication with MongoDB persistent store.
- **Priority Levels**: Bookings categorized as `Normal`, `High`, or `Critical`.
- **Intelligent Overrides**: Admin can approve "Critical" events by overriding existing "Normal" bookings.
- **Automated Displacement**: Displaced bookings are automatically rejected with a notification, triggering the Reallocation Engine.

### 2. AI-Powered Demand Forecasting
Located in `src/controllers/forecastingController.js`:
- **Prophet ML (Facebook)**: Python script (`predict_demand.py`) predicts booking trends for the next 7 days based on 90-day history.
- **Statistical Fallback**: Day-of-week weighted averaging ensures forecasting works even without Python.
- **Google Gemini AI Integration**: (Requires `GEMINI_API_KEY`)
  - **Optimization Recommendations**: Qualitative analysis of resource usage.
  - **Monopolization Alerts**: Detects if a department is over-booking resources.
  - **Space Efficiency Score**: Matches intended attendees to actual room capacity (0-100 scale).

### 3. Smart Reallocation Engine
The "Self-Healing" logic found in `src/services/reallocationEngine.js`:
- **Weighted Scoring Algorithm (40/30/30)**:
  - **40% Capacity Fit**: Minimizes wasted space by finding the closest capacity match.
  - **30% Floor Proximity**: Suggests rooms near the original location (block/floor matching).
  - **30% Utilization Fairness**: Prioritizes less-used rooms to distribute wear-and-tear.
- **Workflow**: One-click reallocation suggestions on the Coordinator's dashboard.

### 4. Natural-Language Booking Assistant
`POST /api/bookings/parse` (`src/services/nlpBookingParser.js`) turns free text like *"Book Hall A for 60 people this Friday 2 to 4pm for a seminar"* into a structured draft (hall, capacity, date, start/end time, event type):
- **Primary**: Google Gemini (LLM-based extraction, JSON mode).
- **Fallback**: a deterministic parser using `chrono-node` for date/time expressions plus regex/keyword matching — works with no API key configured.

### 5. Audit & Transparency
- **Audit Logs**: Complete history of every creation, approval, and override.
- **Nodemailer Integration**: Automated email notifications for status updates.

## 🔒 Security & Production Hardening

- **Helmet** for baseline security headers, **express-rate-limit** globally and (tightly) on `/api/auth/login` and `/api/auth/admin/request`.
- CORS origin is env-driven (`CLIENT_URL`), not hardcoded to localhost.
- Sessions are backed by **MongoDB** via `connect-mongo` (previously declared as a dependency but never wired in — now actually persistent across restarts), with an env-provided `SESSION_SECRET` and `secure`/`httpOnly`/`sameSite` cookies.
- Centralized Express error-handling middleware; required env vars are validated at boot (fails fast instead of half-starting).
- Request bodies are validated with **zod** before they reach a controller.
- `POST /api/rooms`, `PATCH/DELETE /api/rooms/:id` and `POST /api/rooms/seed` are admin-only (previously reachable by any authenticated coordinator, and `/seed` had no auth at all).
- Structured JSON logging via **pino** (`pino-http` for per-request logs) instead of raw `console.log`.

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Task Scheduling**: Node-cron (Automated alerts)
- **Session Management**: Express-session & Connect-mongo (MongoDB-backed store)
- **Validation**: Zod
- **Logging**: Pino / pino-http
- **API Docs**: OpenAPI spec served at `/api/docs` (swagger-jsdoc + swagger-ui-express)
- **CI/CD**: GitHub Actions (backend-ci.yml) — test, build, Docker build

## ⚙️ How it Works (The Flow)

1. **Request**: A Coordinator submits a booking (or describes it in plain English via the NLP assistant, which pre-fills the form).
2. **Analysis**: System checks for time overlaps (`Booking.exists()`).
3. **Approval**: Admin reviews. If it's a priority override, the `reallocationController` is spawned.
4. **Insight**: `forecastingController` periodicity runs the Prophet script via `child_process.spawn`.

## ⚙️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:** copy `.env.example` to `.env` and fill in real values — see that file for the full list (`MONGO_URI`, `SESSION_SECRET`, `GEMINI_API_KEY`, etc.).

3. **Run the Server:**
   ```bash
   npm run dev
   ```

4. **Or run with Docker:**
   ```bash
   docker build -t campus-resource-manager-backend .
   docker run --env-file .env -p 8000:8000 campus-resource-manager-backend
   ```

API reference: once running, visit `/api/docs` for the OpenAPI/Swagger UI.

## 👥 Authors
*   Aravind R K
*   Kanishka D
*   Sandheep G S
*   Radha Krishna
*   Sujith Kumar A


