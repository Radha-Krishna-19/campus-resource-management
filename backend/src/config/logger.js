// Structured JSON logging (pino) instead of raw console.log — cheap to ship
// to a real aggregator (Datadog/CloudWatch/etc.) later, and pino-http gives
// us per-request logs (method/path/status/duration) for free, replacing the
// hand-rolled apiMonitor middleware.
const pino = require("pino");

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" }
      }
});

module.exports = logger;
