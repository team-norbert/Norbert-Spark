# Build stage
FROM node:22-slim AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

# Copy workspace configuration from monorepo root
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

# Copy the packages needed
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/

# Build shared package first, then backend
RUN pnpm --filter @norberts-spark/shared build && \
    pnpm --filter @norberts-spark/backend build

# Runtime stage
FROM node:22-slim

# Install curl for healthchecks and enable pnpm
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* && \
    corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for installing production dependencies
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy certificates for runtime
COPY apps/backend/certs ./apps/backend/certs

# Security: Run as non-root user
# The node:22-slim image provides a built-in 'node' user (uid 1000)
# Change ownership of app files to the node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["pnpm", "start"]