# Multi-stage build: install deps in a full image, run in a slim one, as a
# non-root user. Prophet/pandas are intentionally NOT installed here — the
# prophet Python stack pulls in a C++ toolchain (cmdstan) that makes for a
# slow, fragile Docker build; the forecasting endpoint already degrades to a
# statistical fallback when Prophet isn't available (see forecastingController.js),
# so this image ships fast and reliable, and Prophet can be added later with a
# `pip install -r src/scripts/requirements.txt` layer if truly needed in prod.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER app
EXPOSE 8000
CMD ["node", "src/server.js"]
