# Campus Resource Manager - Frontend (The Interaction Layer)

The **Campus Resource Manager** is a comprehensive solution designed to streamline the management and booking of campus resources. This frontend application provides an intuitive and responsive user interface for efficiently tracking and utilizing halls, classrooms, and event spaces.

## ✨ Key Features

### 1. Unified Dashboards
- **Admin Dashboard**: Real-time overview of system activity and critical booking conflicts.
- **Coordinator Dashboard**: Command center for managing requests and reallocation suggestions.
- **Faculty View**: Read-only access to campus schedules.

### 2. Smart Booking Experience (`NewBooking.jsx`)
- **Guided Suggestions**: Recommends rooms based on capacity fit and least-booked history.
- **Conflict Awareness**: Immediate prompts for a "Priority Override" if a room is already occupied.
- **Dynamic Ranking**: Suggestions shift to ensure campus-wide resource fairness.

### 3. Real-Time Resource Tracker (`HallAvailability.jsx`)
- **Live Status Grid**: Instantly see which halls are Green (Free) or Yellow (Occupied).
- **Quick Check Tool**: Rapidly verify time slots without completing a full form.
- **Direct Link**: Seamlessly transition from checking availability to creating a booking.

### 4. Interactive Analytics (`Reports.jsx`)
- **Visual Insights**: Area and Bar charts transforming booking data into trends via Recharts.
- **ML Demand Forecasting**: Visualized timeline of expected volume for the upcoming week.
- **AI Analytics**: Integration with Google Gemini for department monopolization alerts and space efficiency scoring.

### 5. Natural-Language Booking Assistant (`NewBooking.jsx`)
- Type a booking in plain English ("Book Hall A for 60 people this Friday 2-4pm for a seminar") and the form pre-fills itself via `POST /api/bookings/parse`.
- Always shows an "auto-filled — please review" confirmation before submission.

## 🎨 UI & Animation

- **Framer Motion**: route transitions (`App.jsx`), staggered dashboard card entrances, animated dialogs.
- **Dark mode**: toggle in the header, powered by `next-themes` (theme tokens already existed in `index.css` — just wasn't reachable before).
- **Skeleton loading states** and a shared `EmptyState` component replace repeated ad-hoc spinner/"no data" markup.
- **Responsive**: header collapses to a mobile menu; the login/register split-panel layout stacks to single-column below `sm`.
- **Error boundary**: a render crash now shows a recoverable fallback screen instead of a blank page.

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS (theme tokens + dark mode via CSS variables)
- **Components**: Shadcn UI (Radix UI) & Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Security**: Session-based authentication (Express-session, MongoDB-backed store)
- **Testing**: Vitest & React Testing Library
- **CI/CD**: GitHub Actions (frontend-ci.yml) — test, build, Docker build

## ⚙️ Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:** copy `.env.example` to `.env` (only needed if your backend isn't at the Vite dev-proxy default — see `vite.config.js`).

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Or run with Docker:**
   ```bash
   docker build -t campus-resource-manager-frontend --build-arg VITE_API_URL=https://your-backend/api .
   docker run -p 8080:80 campus-resource-manager-frontend
   ```

## 👥 Authors
*   Aravind R K
*   Kanishka D
*   Sandheep G S
*   Radha Krishna
*   Sujith Kumar A
