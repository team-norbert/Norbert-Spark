FROM node:22-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

# Copy workspace configuration from monorepo root
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

# Copy the packages needed
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared package first, then backend
RUN pnpm --filter @norberts-spark/shared build && \
    pnpm --filter @norbets-spark/backend build

# Copy certs to the expected location for the compiled app
RUN mkdir -p /app/apps/backend/dist/apps/backend/certs && \
    cp -r /app/apps/backend/certs/* /app/apps/backend/dist/apps/backend/certs/ 2>/dev/null || true

# Security: Run as non-root user
# The node:22-slim image provides a built-in 'node' user (uid 1000)
# Change ownership of app files to the node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["pnpm", "start"]