# @norberts-spark/shared

Shared types and schemas for the monorepo.

This package provides Zod schemas and TypeScript types that are intended to be
imported by both the frontend and backend so they share a single source of
truth for DTOs, validation and common types.

Current exports:

- `LoginSchema`, `RegisterSchema`, `AuthResponseSchema`
- `UserSchema`, `PublicUserSchema`
- `LoginDTO`, `RegisterDTO`, `AuthResponse`, `User`

Usage (frontend or backend):

```ts
import { LoginSchema, LoginDTO } from '@norberts-spark/shared'
```

to import generated OpenAPI types:

```ts
import type { components } from '@norberts-spark/shared/openapi-types'
type UserResponse = components['schemas']['UserResponse']
```

Notes:

- This package already includes a `build` script and `exports` in `package.json`.
- This scaffold expects `zod` to be installed in the workspace.

# Shared Package Testing

This package includes unit tests that run in both Node.js and browser (jsdom) environments to ensure cross-platform compatibility.

## Test Structure

Tests are located in the `tests/` directory and mirror the structure of the `src/` directory:

```
tests/
├── guards/
│   └── type.guards.test.ts
└── schemas/
    └── auth.test.ts
```

## Running Tests

### Run all tests (both environments)

```bash
pnpm test
```

### Run tests in Node.js environment only

```bash
pnpm run test:node
```

### Run tests in browser (jsdom) environment only

```bash
pnpm run test:browser
```

### Run tests in watch mode

```bash
pnpm run test:watch
```

### Run tests with coverage

```bash
pnpm run test:coverage
```

## Test Configurations

- **Node Environment**: `vitest.config.node.ts` - Tests run in Node.js environment
- **Browser Environment**: `vitest.config.browser.ts` - Tests run in jsdom (simulated browser) environment

Both configurations use the same test files, ensuring that the code works correctly in both environments.

## Writing Tests

When writing tests, import directly from the source files using relative paths:

```typescript
import { describe, it, expect } from 'vitest'
import { LoginSchema } from '../../src/schemas/auth.js'

describe('Auth Schemas', () => {
  it('should validate login data', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
})
```

## Current Test Coverage

- **Type Guards**: 25 tests covering all type guard utilities
- **Auth Schemas**: 9 tests covering LoginSchema and RegisterSchema validation

All tests pass in both Node.js and browser environments.
