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

# OpenAPI Integration Setup Guide

### 1. OpenAPI Specification (`openapi.json`)

- **Version**: OpenAPI 3.1.0
- **Endpoints**: Root, health check, user registration, get user by ID
- **Schemas**: RegisterUserRequest, RegisterUserResponse, User, Error
- **Documentation**: Full descriptions, examples, and validation rules

### 2. Spectral API Linting (`.spectral.yaml`)

- **Rulesets**: Extended from `spectral:oas` and `spectral:asyncapi`
- **Custom Rules**:
  - Operations must have success responses (2xx)
  - No HTTP verbs in paths
  - Error responses must have schemas
  - POST/PUT/PATCH require request body validation
  - Security requirements for non-GET operations
  - Schema descriptions required
  - Parameter descriptions required

### 3. Fastify Integration

- **@fastify/swagger**: Loads OpenAPI spec
- **@fastify/swagger-ui**: Interactive documentation at `/docs`
- **JSON Parser**: Parses `openapi.json` at startup

### 4. NPM Scripts

```bash
pnpm run api:lint       # Validate OpenAPI spec
pnpm run api:lint:json  # JSON output for CI/CD
pnpm run api:docs       # Show docs URL
```

### 5. Documentation

- **API_FIRST_WORKFLOW.md**: Complete guide to API-first development
- **Backend README**: Updated with OpenAPI info
- **Hexagonal Architecture**: Integration guide with DDD layers

## Usage

### 1. Start Development Server

```bash
cd apps/backend
pnpm dev
```

Server starts on: https://localhost:3000 (or http if HTTPS disabled)  
API Docs available at: https://localhost:3000/docs

### 2. Validate API Design

```bash
pnpm run api:lint
```

Current validation: ✅ Passing (1 warning about security on public endpoint)

### 3. View Interactive Documentation

Open browser to: `https://localhost:3000/docs`

Features:

- Browse all endpoints
- Try API calls interactively
- View request/response schemas
- Test authentication
- Copy curl commands

### 4. API-First Workflow

**Design → Validate → Document → Implement**

1. **Edit `openapi.json`** to design new endpoints
2. **Run `pnpm run api:lint`** to validate spec
3. **Review at `/docs`** in browser
4. **Implement** in hexagonal layers:
   - Domain → Application → Adapters → Infrastructure

## Example: Adding New Endpoint

### 1. Add to `openapi.json`

```yaml
"paths": {
 "/users/register": {
  "post": {
    "summary": "Register a new user",
    "description": "Creates a new user account",
    "operationId": "registerUser",
    "tags": ["users"],
    "security": [],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/RegisterUserRequest"
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "User successfully registered",
```

### 2. Validate

```bash
pnpm run api:lint
```

### 3. Implement Following Hexagonal Architecture

**API route and adaptor** (`apps/backend/src/adapters/primary/http/user.controller.ts`):

```typescript
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly deleteUsersUseCase: DeleteUsersUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/users/register', this.register.bind(this))
  }

  async deleteUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = DeleteUsersDto.validate(request.body)

      // Extract audit context from request
      const auditContext = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Convert UserIdType
      const userIds = dto.userIds.map((id) => new UserId(id).getValue())
      const result = await this.deleteUsersUseCase.execute(userIds, auditContext)

      if (result) {
        reply.code(200).send({
          success: true,
          data: 'Users have been successfully deleted',
        })
        return
      }
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
```

**Data Transfer Objects** (`apps/backend/src/application/dtos/delete-users.dto.ts`):

```typescript
export class DeleteUsersDto {
  constructor(public readonly userIds: UserIdType[]) {}
  static validate(data: any): DeleteUsersDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid array of user IDs')
    }

    if (!Array.isArray(data.userIds) || !data.userIds.every((id: any) => typeof id === 'string')) {
      throw new TypeException('userIds must be an array of strings')
    }

    // Validate each userId is a valid UUIDv7
    for (const id of data.userIds) {
      const version = Uuid7Util.uuidVersionValidation(id)
      if (version !== 'v7') {
        throw new TypeException(`Invalid UUIDv7 format for userId: ${id}`)
      }
    }

    return new DeleteUsersDto(data.userIds)
  }
}
```

**Use cases** (`apps/backend/src/application/use-cases/delete-users.use-case.ts`):

```typescript
export class DeleteUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(
    userIds: UserIdType[],
    auditContext: { ipAddress: string; userAgent: string | null }
  ): Promise<boolean> {
    this.logger.info('Deleting users', { userIds })

    try {
      // Chat records are deleted by a database cascade constraint on the chats table.
      // We intentionally do not call a separate chat history deletion here to avoid
      // redundant operations and potential race conditions with the cascade.
      await this.userRepository.deleteUsers(userIds)
    } catch (error) {
      this.logger.error('Error deleting users', error as Error, { userIds })
      throw error
    }

    try {
      await this.auditLog.log({
        userId: null,
        entityType: EntityType.USER,
        entityId: userIds.join(','),
        action: AuditAction.DELETE,
        changes: { reason: 'deleted_users' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for user deletion', error as Error, { userIds })
    }

    return true
  }
}
```

**Secondary adaptors** (`apps/backend/src/application/use-cases/delete-users.use-case.ts`):

```typescript
export class PostgresUserRepository implements UserRepositoryPort {
  async deleteUsers(userIds: UserIdType[]): Promise<void> {
    try {
      if (userIds.length === 0) {
        return
      }
      await db.delete(user).where(inArray(user.userId, userIds))
    } catch (error) {
      throw new DatabaseException('Failed to delete users', { userIds, error })
    }
  }
}
```

## Benefits Achieved

✅ **Contract-First**: API design before implementation  
✅ **Auto Documentation**: Always up-to-date via `/docs`  
✅ **Validation**: Spectral catches API design issues early  
✅ **Team Collaboration**: Frontend can start work immediately  
✅ **Type Safety**: OpenAPI schemas → TypeScript types (optional)  
✅ **Testing**: Contract testing against spec

## CI/CD Integration

Add to `.github/workflows/ci-cd.yml`:

```yaml
- name: Validate API Specification
  run: cd apps/backend && pnpm run api:lint
```

## Next Steps

1. **Add more endpoints** to `openapi.json`
2. **Enable authentication** in Swagger UI (JWT bearer tokens)
3. **Generate TypeScript types** from OpenAPI (optional):
   ```bash
   pnpm add -D openapi-typescript
   openapi-typescript openapi.json -o src/types/api.ts
   ```
4. **Implement endpoints** following hexagonal architecture
5. **Add contract tests** using OpenAPI spec

## Resources

- OpenAPI Spec: `backend/openapi.json`
- Spectral Config: `backend/.spectral.yaml`
- Workflow Guide: `backend/API_FIRST_WORKFLOW.md`
- Architecture: `backend/src/HEXAGONAL_ARCHITECTURE.txt`
- Interactive Docs: `https://localhost:3000/docs` (when running)
