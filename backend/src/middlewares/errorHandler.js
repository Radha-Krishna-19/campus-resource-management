const logger = require("../config/logger");

// Catches anything a route/controller throws or passes to next(err) —
// previously several authController handlers had no try/catch at all,
// so an unhandled rejection would leak a raw stack trace to the client.
// Express 5 auto-forwards rejected async handlers here, so this alone
// closes that gap for every route, not just the ones we touch by hand.
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  logger.error({ err, path: req.originalUrl, method: req.method }, err.message);

  res.status(status).json({
    message: status === 500 ? "Server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && status === 500 ? { stack: err.stack } : {})
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: "Not found" });
}

module.exports = { errorHandler, notFoundHandler };
