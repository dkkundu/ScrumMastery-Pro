# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install native build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

# Install all dependencies (dev + prod)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build React frontend
# VITE_API_BASE_URL is empty so the browser uses same-origin /api/* paths
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Prune dev dependencies, keeping only production deps
RUN npm prune --omit=dev


# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production node_modules (includes compiled better-sqlite3 for alpine)
COPY --from=builder /app/node_modules ./node_modules

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy backend source only
COPY server.js .
COPY package.json .

# Create volume mount point for SQLite database
RUN mkdir -p /data

EXPOSE 6002

ENV NODE_ENV=production \
    BACKEND_PORT=6002 \
    DB_PATH=/data/database.sqlite

CMD ["node", "server.js"]
