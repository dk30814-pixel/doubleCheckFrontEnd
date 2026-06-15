# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle.
COPY . .
RUN npm run build -- --configuration production

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS final

# Default backend location. Overridable at runtime (see docker-compose.yml).
ENV API_UPSTREAM=http://host.docker.internal:8080

# nginx entrypoint runs envsubst over templates -> /etc/nginx/conf.d/*.conf
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Static SPA files (Angular application builder emits to dist/<project>/browser).
COPY --from=build /app/dist/dcfe/browser /usr/share/nginx/html

EXPOSE 80
