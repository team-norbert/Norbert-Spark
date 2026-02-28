# Norbert's Spark - AI Agent Instructions

## Architecture Overview

This is a **Turborepo monorepo** with PNPM workspaces containing:

- **apps/frontend/**: Next.js 16 with React 19, Material UI 7, Drizzle ORM, AI SDK v5 integration, **Domain-Driven Design (DDD) architecture**
- **apps/backend/**: Fastify TypeScript API server (port 3001)
- **packages/shared/**: Shared types, schemas and OpenAPI definitions
- **PostgreSQL**: Docker-based PostgreSQL database (port 5432)

Key architectural decisions:

- Next.js 16 App Router with Server/Client Components
- **Domain-Driven Design** with clear separation of concerns across 4 layers
- React components use `'use client'` directive for client-side interactivity
- Database logic in `apps/frontend/src/infrastructure/` following DDD principles
- PostgreSQL accessed via Drizzle ORM with `postgres` driver

## Monorepo Structure

```
Norbert-Spark/
├── apps/
│   ├── frontend/          # @norberts-spark/frontend (Next.js 16)
│   └── backend/           # @norberts-spark/backend (Fastify, port 3001)
├── packages/
│   └── shared/            # @norberts-spark/shared (types, schemas, OpenAPI)
├── pnpm-workspace.yaml    # packages: [apps/*, packages/*]
├── turbo.json
└── tsconfig.json
```

## Domain-Driven Design Architecture

The frontend follows a **4-layer DDD architecture**. Always organize code into these layers:

### 1. Domain Layer (`src/domain/`)

**Purpose**: Core business logic (pure functions, entities, value objects)

**Contains**:

- **Entities**: Objects with identity (e.g., User)
- **Value Objects**: Self-contained types with validation (e.g., Email)
- **Schemas**: Defined using Zod for typing and validation

**Example structure**:

```
src/domain/
  ├── user/
  │   ├── user.ts          # UserSchema, NewUserSchema, types
  │   └── valueObjects/
  │       └── email.ts      # EmailSchema, validateEmail()
```

**Rules**:

- Must be framework-agnostic (no React, Next.js, or UI imports)
- Use Zod schemas for validation and type inference
- Pure functions only, no side effects
- Value objects encapsulate validation logic

### 2. Application Layer (`src/application/`)

**Purpose**: Application-level use cases and orchestration

**Contains**:

- **Use Cases**: Specific operations (e.g., createUser, getAllUsers)
- **Services**: Business logic that doesn't belong to a single entity

**Rules**:

- Coordinates domain and infrastructure layers
- No knowledge of UI or HTTP details
- Orchestrates business flows
- Calls infrastructure for I/O operations

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: External I/O (API, database, third-party services)

**Contains**:

- **API clients**: Axios instances, HTTP requests
- **Repositories**: Data access abstractions
- **Database**: Drizzle schema and client configuration

**Rules**:

- No business logic, only I/O operations
- Implements interfaces expected by application layer
- Handles API calls, database queries, external services

### 4. View Layer (`src/view/`)

**Purpose**: Presentation logic and UI components

**Contains**:

- **Components** (`components/`): "Dumb" presentational components
- **Hooks** (`hooks/`): Custom React hooks for UI logic
- **Pages** (`app/`): Next.js App Router pages (orchestration only)

**Rules**:

- Components are presentation-only (no logic)
- All behavior comes from hooks
- Hooks use `@tanstack/react-query` for data fetching
- Components must have `'use client'` directive if using hooks/state
- Next.js pages in `src/app/` are minimal and declarative

### DDD Layer Dependencies

```
Domain ← Application ← Infrastructure
   ↑         ↑
   └─────────┴──── View
```

## Development Workflows

### Package Manager

**Always use `pnpm`**, never npm/yarn. This is enforced by `"packageManager": "pnpm@10.29.3"`.

### Running Commands

```bash
# From root - runs across all workspaces via Turborepo
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm lint         # Lint all workspaces
pnpm test         # Run all tests
pnpm typecheck    # TypeScript type checking (no emit)
pnpm format       # Format code with Prettier

# Frontend-specific
pnpm --filter @norberts-spark/frontend dev      # Next.js dev server
pnpm --filter @norberts-spark/frontend build    # Next.js production build
pnpm --filter @norberts-spark/frontend test     # Vitest unit tests

# Backend-specific
pnpm --filter @norberts-spark/backend dev       # Fastify server with tsx watch on :3001
pnpm --filter @norberts-spark/backend build     # Compile TypeScript to dist/
pnpm --filter @norberts-spark/backend start     # Run compiled server from dist/
pnpm --filter @norberts-spark/backend test:unit # Vitest unit tests

# Shared package
pnpm --filter @norberts-spark/shared build      # Build shared types/schemas
```

### Docker

The Dockerfile is **for production use only**. In development, use `pnpm dev` instead.

```bash
# Build production Docker image
pnpm run docker:build

# Run production Docker image
docker run --rm -p 3001:3001 --env-file apps/backend/.env norberts-spark-backend
```

The Dockerfile is located at `apps/backend/Dockerfile` and is built from the monorepo root for workspace context.

### Git Hooks (Husky)

**Commit-msg hook** (validates commit message format):

- Enforces Conventional Commits specification
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Format: `type(scope): subject` or `type: subject`

**Pre-commit hook**:

- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint all workspaces
- `pnpm run typecheck` - TypeScript type checking

**Pre-push hook**:

- `pnpm run format`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`

### Testing Strategy

- **Frontend Unit tests (Vitest)**: Located in `apps/frontend/src/test/`
- **Frontend E2E tests (Playwright)**: Located in `apps/frontend/e2e/`
- **Backend Unit tests (Vitest)**: Located in `apps/backend/test/`
- **Backend AI evals (evalite)**: Located in `apps/backend/evals/`

### Database Workflows

```bash
# Generate migration from schema changes
pnpm --filter @norberts-spark/frontend drizzle-kit generate:pg

# Apply migrations
pnpm --filter @norberts-spark/frontend drizzle-kit push:pg

# Open Drizzle Studio GUI
pnpm --filter @norberts-spark/backend db:studio
```

## Project-Specific Conventions

### File Organisation

**Frontend (DDD Architecture):**

- **Domain**: `apps/frontend/src/domain/`
- **Application**: `apps/frontend/src/application/`
- **Infrastructure**: `apps/frontend/src/infrastructure/`
- **View**:
  - Components: `apps/frontend/src/view/components/*.tsx`
  - Hooks: `apps/frontend/src/view/hooks/*.ts`
  - Pages: `apps/frontend/src/app/`

**Backend:**

- **Entry point**: `apps/backend/src/infrastructure/di/container/index.ts`
- **Source**: `apps/backend/src/`
- **Tests**: `apps/backend/test/`
- **Compiled output**: `apps/backend/dist/`

**Shared:**

- **Source**: `packages/shared/src/`
- **Entry point**: `packages/shared/src/index.ts`
- **Compiled output**: `packages/shared/dist/`

### ESLint & Prettier

- **Prettier**: 100 char line length, single quotes, 2 space tabs, trailing commas (ES5), LF endings, **no semicolons**
- **ESLint 9**: Unified flat config at root `eslint.config.ts` extended by frontend and backend
- Uses new flat config format (not legacy `.eslintrc.*`)
- React imports not required (`'react/react-in-jsx-scope': 'off'`)

### Environment Variables

- Backend env vars in `apps/backend/.env`
- Frontend env vars in `apps/frontend/.env`
- Public vars: `NEXT_PUBLIC_*` (exposed to browser)

### AI SDK Integration

Google Gemini via `@ai-sdk/google` and `ai` packages:

```typescript
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

const { text } = await generateText({
  model: google('models/gemini-pro'),
  prompt: 'Your prompt',
})
```

### Next.js + React Integration

- Next.js 16 App Router with TypeScript
- Use `'use client'` directive for components with state, hooks, or event handlers
- Server Components are default (no directive needed)
- Material UI components require `'use client'`
- React Query (`@tanstack/react-query`) for data fetching in hooks

### Turborepo Task Pipeline

Defined in `turbo.json`:

- `build` depends on `^build` (topological order), outputs to `dist/`, `.next/`
- `dev` is persistent (doesn't exit), no caching

## Common Pitfalls

1. **Don't use npm/yarn** - PNPM `10.29.3` workspace required for monorepo
2. **Paths use `apps/`** - All apps are under `apps/backend/` and `apps/frontend/`, not at root
3. **Backend port is 3001** - Not 3000
4. **Backend uses tsx for dev** - Runs TypeScript directly via `tsx watch`, compiles to `dist/` for production only
5. **Follow DDD layers strictly** - Don't mix concerns across domain/application/infrastructure/view
6. **Next.js env vars** - Use `process.env`, not `import.meta.env`
7. **Client components** - Must add `'use client'` directive for hooks, state, or event handlers
8. **ESLint 9 flat config** - Root `eslint.config.ts` is base, frontend/backend extend it
9. **ESM configs** - All config files use ESM exports (`export default`) since root has `"type": "module"`
10. **No .eslintignore** - ESLint 9 uses `ignores` property in config file
11. **Zod for validation** - Always use Zod schemas in domain layer, infer types with `z.infer<>`
12. **Docker is production only** - Never use Docker for local development
13. **NODE_ENV in Docker** - Always set `NODE_ENV=production` in Dockerfile for production builds
14. **pino-pretty is dev only** - Logger automatically uses plain JSON in production when `NODE_ENV=production`

## Key Files Reference

- `turbo.json` - Build orchestration and caching config
- `pnpm-workspace.yaml` - Workspace packages definition (`apps/*`, `packages/*`)
- `tsconfig.json` - Root TypeScript config
- `eslint.config.ts` - Root ESLint 9 flat config (base rules)
- `apps/frontend/next.config.ts` - Next.js framework configuration
- `apps/frontend/eslint.config.ts` - Frontend linting
- `apps/backend/eslint.config.ts` - Backend linting
- `apps/backend/tsconfig.json` - Backend TypeScript config
- `apps/backend/Dockerfile` - Production Docker image (build from monorepo root)
- `apps/backend/src/infrastructure/di/container/index.ts` - Backend entry point
- `packages/shared/src/index.ts` - Shared package entry point
- `.prettierrc` - Code formatting rules (no semicolons)
