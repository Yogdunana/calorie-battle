# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY calorie-battle-server/package.json calorie-battle-server/package-lock.json ./

# Install ALL dependencies (including devDependencies for native build)
RUN npm ci

# ---- Stage 2: Production image ----
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for native modules and netcat for health checks
RUN apk add --no-cache python3 make g++ netcat-openbsd

ENV NODE_ENV=production

# Copy package files
COPY calorie-battle-server/package.json calorie-battle-server/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy server source code
COPY calorie-battle-server/ ./

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3001

# Wait for MySQL to be ready before starting, then run server
CMD ["sh", "-c", "for i in $(seq 1 30); do nc -z db 3306 && echo 'MySQL is ready' && break || echo 'Waiting for MySQL...' && sleep 2; done; node server.js"]
