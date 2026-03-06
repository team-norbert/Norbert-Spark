FROM node:24-slim AS builder

ARG APP_VERSION=unknown
ENV APP_VERSION=${APP_VERSION}

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY eslint-plugin-types.d.ts ./
COPY eslint.config.ts ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/eslint.config.ts ./apps/backend/

RUN pnpm --filter @norberts-spark/shared build && \
    pnpm --filter @norberts-spark/backend build && \
    ls -la /app/apps/backend/dist

# Runtime stage
FROM node:24-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* && \
    corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

ENV HUSKY=0
ENV CI=1
ENV APP_VERSION=${APP_VERSION}

# Note: The way you’re using APP_VERSION in the Dockerfile is a common pitfall.
# APP_VERSION is declared as an ARG only in the builder stage,
# but you set ENV APP_VERSION=${APP_VERSION} in the runtime stage.
# Build args don’t automatically carry over between stages,
# so ${APP_VERSION} will expand to empty here and the runtime container
# won’t actually have APP_VERSION set. Re-declare ARG APP_VERSION=unknown
# in the runtime stage (or declare it globally before the first FROM)
# before using it in ENV, and remove any redundant ENV APP_VERSION
#assignments if not needed.

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN mkdir -p ./apps/backend/certs
RUN chown -R node:node /app

USER node

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/infrastructure/di/container/index.js"]
