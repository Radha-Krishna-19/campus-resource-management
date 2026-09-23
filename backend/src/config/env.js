// Fails fast with a clear message instead of the app silently half-starting
// (e.g. Mongo connection rejected but the process never exits).
const REQUIRED = ["MONGO_URI", "SESSION_SECRET"];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[env] Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill these in before starting the server."
    );
    process.exit(1);
  }
}

module.exports = { validateEnv };
