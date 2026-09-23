# Technical Project Report: Campus Resource Management System

## 1. Executive Summary
The Campus Resource Management System is a dual-tier (Backend/Frontend) solution designed to modernize the hall booking and resource allocation infrastructure of a university campus. It addresses the inefficiencies of manual scheduling through priority-aware logic, ML-based forecasting, and "Self-Healing" reallocation.

## 2. Core Innovations

### A. Intelligent Reallocation Engine
Unlike traditional booking systems that simply reject a booking upon conflict, this system implements a **Self-Healing reallocation algorithm**. When a high-priority event overrides an existing one, the engine analyzes all 88+ campus halls and calculates a weighted score (40% Capacity, 30% Proximity, 30% Fairness) to suggest the best possible alternative for the displaced user.

### B. Predictive Demand Forecasting
Integration with **Facebook Prophet** allows the system to analyze historical booking patterns and predict demand for the upcoming week. This enables proactive resource management and helps admins identify peak periods before they occur.

### C. Generative AI (Gemini) Insights
The system leverages **Google Gemini AI** to provide qualitative analysis. It identifies:
- **Optimization Opportunities**: Highlighting rooms that are consistently under-utilized.
- **Space Efficiency**: Scoring bookings based on how well the requested room capacity matches the intended attendance.
- **Fairness Alerts**: Monitoring for "Department Monopolization" where a single entity over-reserves campus resources.

## 3. System Architecture

### Backend (Node.js/Express/MongoDB)
- **Engine Layer**: Hosts the Reallocation and Forecasting logic.
- **ML Integration**: Spawns Python processes for Prophet forecasting with a statistical fallback.
- **Auth Layer**: Secure JWT-based identity management with strict Role-Based Access Control (RBAC).

### Frontend (React/Vite/Tailwind)
- **Design System**: A premium, "Amrita-themed" UI built with Framer Motion for smooth transitions.
- **Data Viz**: Real-time charts via Recharts showing live demand and booking distributions.
- **Guided UX**: Intelligent forms that rank room suggestions as the user types.

## 4. Technical Achievements
- **Test Coverage**: Robust unit and integration tests across both layers (Jest for Backend, Vitest for Frontend).
- **CI/CD**: Automated pipelines for independent repository testing and building.
- **Robustness**: Fallback mechanisms for all external dependencies (Prophet, Gemini).

## 5. Production-Readiness Pass
A follow-up hardening pass closed several real gaps found in review: an unauthenticated destructive room-seed endpoint, an in-memory (non-persistent) session store despite `connect-mongo` being installed, a hardcoded frontend API URL that blocked any real deployment, and a frontend role-check prop that was silently ignored on every admin route. It also added a natural-language booking assistant (hybrid Gemini + chrono-node/regex pipeline), Docker images for both services, OpenAPI docs, and wired in the previously-unused Framer Motion/dark-mode dependencies. See the root `README.md` for the full list.

---
*Generated: March 2024 · Hardening pass: 2026*
*Project Team: Aravind R K, Kanishka D, Sandheep G S, Radha Krishna, Sujith Kumar A*
