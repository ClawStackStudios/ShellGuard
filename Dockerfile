# ShellGuard Combined API + UI Server
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build for a single-image setup serving both frontend and backend.
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (delta #10: npm ci against the committed lockfile —
# the lockfile is deliberately NOT in .dockerignore)
COPY package.json package-lock.json ./
RUN npm ci

# Copy ONLY source files needed for build (exclude dist/)
# This ensures we never use stale local dist/ files
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

# Build fresh from source
RUN npm run build

# Stage 2: Production environment for Express API
FROM node:20-alpine

# Install build tools needed for native modules (better-sqlite3-multiple-ciphers),
# su-exec to drop privileges, and shadow for usermod/groupmod (PUID/PGID)
RUN apk add --no-cache python3 make g++ su-exec shadow

WORKDIR /app

# Copy only the server + package files first (layer cache optimisation)
COPY package.json package-lock.json ./
# tsx must remain a runtime "dependency" (as in ClawChives) so --omit=dev still ships it
RUN npm ci --omit=dev

COPY server.ts ./
COPY src ./src
COPY skills ./skills
COPY migrations ./migrations

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Data volume mount point
RUN mkdir -p /app/data

# Copy and prepare the entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Expose the API/UI port
EXPOSE 6464

# Health check (run as the node user inside the container).
# TLS-aware: when TLS_ENABLED=true the server speaks HTTPS with a self-signed
# cert, so the probe must skip verification (busybox wget --no-check-certificate).
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=5 \
  CMD sh -c 'if [ "$TLS_ENABLED" = "true" ]; then wget -qO- --no-check-certificate https://localhost:6464/api/health || exit 1; else wget -qO- http://localhost:6464/api/health || exit 1; fi'

ENV NODE_ENV=production
ENV PORT=6464
ENV DATA_DIR=/app/data
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npx", "tsx", "server.ts"]
