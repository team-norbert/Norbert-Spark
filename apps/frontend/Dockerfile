# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# This Dockerfile uses Node.js 24.13.0-slim, which was the latest LTS version at the time of writing.
# To ensure security and compatibility, regularly update the NODE_VERSION ARG to the latest LTS version.
ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} AS dependencies

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Set working directory
WORKDIR /app

# Copy workspace config and all package.json files for dependency resolution
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM node:${NODE_VERSION} AS builder

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy workspace config and source code
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Pass required NEXT_PUBLIC_* vars as build args so they are inlined into the
# client bundle at build time (runtime env vars cannot replace baked-in values).
# These must be supplied when running `docker build` or via compose build.args.
ARG NEXT_PUBLIC_POST_AI_CALLBACK_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_POST_AI_CALLBACK_URL=${NEXT_PUBLIC_POST_AI_CALLBACK_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# Build shared package first, then the frontend
RUN pnpm --filter @norberts-spark/shared build

WORKDIR /app/apps/frontend

# Remove eslint config - not needed for production build and it imports the root
# eslint.config.ts which would require copying all ESLint plugin dependencies
RUN rm -f eslint.config.ts

RUN pnpm exec next build && \
    pnpm exec shx cp -R .next/static .next/standalone/apps/frontend/.next/static

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM node:${NODE_VERSION} AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Set the correct permission for prerender cache
RUN mkdir -p apps/frontend/.next
RUN chown node:node apps/frontend/.next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static

# If you want to persist the fetch cache generated during the build so that
# cached responses are available immediately on startup, uncomment this line:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "apps/frontend/server.js"]