# Multi-stage build: compile the Vite app, then serve the static bundle with
# nginx — smaller and faster than shipping a Node server just to host static
# files. VITE_API_URL is a build arg because Vite inlines env vars at build
# time, not runtime; pass it at build time to point the bundle at your
# deployed backend.
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
