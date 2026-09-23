require("dotenv").config(); // Load environment variables

const { validateEnv } = require("./config/env");
validateEnv(); // fail fast with a clear message if MONGO_URI/SESSION_SECRET are missing

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const pinoHttp = require("pino-http");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const logger = require("./config/logger");
const swaggerSpec = require("./config/swagger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth.js");
const bookingRoutes = require("./routes/booking.js");
const auditLogRoutes = require("./routes/auditLog.js");

const app = express();
const port = process.env.PORT || 8000;
const isProd = process.env.NODE_ENV === "production";

// Security headers (CSP, HSTS, X-Frame-Options, etc.) — zero-config OWASP baseline.
app.use(helmet());

// CORS is env-driven so the same build works against any deployed frontend,
// instead of being hardcoded to localhost.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Structured, per-request logs (replaces the hand-rolled console.log apiMonitor).
app.use(pinoHttp({ logger }));

// Blanket rate limit for the whole API, plus a much tighter one on auth
// endpoints below — login/admin-request had no throttling at all before.
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." }
});
app.use(["/api/auth/login", "/api/auth/admin/request"], authLimiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      secure: isProd, // only require HTTPS in production, so local http dev still works
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8 // 8h
    }
  })
);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/forecasting", require("./routes/forecasting"));
app.use("/api/reallocation", require("./routes/reallocation"));

// Initialize cron jobs
require("./services/alertService").initAlertService();

app.get("/", (req, res) => {
  res.send("backend running");
});

app.use(notFoundHandler);
app.use(errorHandler);

let server;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    server = app.listen(port, () => {
      logger.info(`Server running at port ${port}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, "MongoDB connection failed");
    process.exit(1); // fail fast instead of half-starting with no listener
  });

// Graceful shutdown so in-flight requests drain and the Mongo connection
// closes cleanly on SIGTERM/SIGINT (container stop, Ctrl+C, orchestrator restart).
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(async () => {
      await mongoose.connection.close();
      logger.info("Shutdown complete");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
