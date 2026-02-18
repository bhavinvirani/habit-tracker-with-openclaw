# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time metadata
ARG GIT_SHA=unknown
ARG BUILD_TIMESTAMP=unknown

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm install --legacy-peer-deps

# Copy source code
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG GIT_SHA=unknown
ARG BUILD_TIMESTAMP=unknown
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy necessary files from builder
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/package*.json ./
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma

USER expressjs

EXPOSE 8080

CMD ["node", "dist/server.js"]
