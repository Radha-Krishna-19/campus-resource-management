// Generates an OpenAPI spec from JSDoc @swagger comments on the route files,
// served at /api/docs — gives reviewers a clickable API reference without a
// hand-maintained spec file that drifts from the actual routes.
const swaggerJsdoc = require("swagger-jsdoc");

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Campus Resource Manager API",
      version: "1.0.0",
      description:
        "Hall booking, priority-based reallocation, and AI-assisted demand forecasting for campus resource management."
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        sessionCookie: { type: "apiKey", in: "cookie", name: "connect.sid" }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});

module.exports = spec;
