# Backend - Fastify API Server

A TypeScript-based Fastify API server with integrated PostgreSQL database, following hexagonal architecture and API-first development principles.

## Tech Stack

- **Framework**: [Fastify](https://fastify.dev/) with OpenAPI/Swagger
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 18.1 (via Docker)
- **Testing**: Vitest
- **API Design**: OpenAPI 3.1 + Spectral linting
- **Architecture**: Hexagonal (Ports and Adapters)

## Prerequisites

- Node.js >= 22
- PNPM >= 10
- Docker and Docker Compose

## Getting Started

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Set Up PostgreSQL Database

Copy the environment file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` to customize your database credentials if needed.

Start the PostgreSQL database:

```bash
docker compose up -d
```

Verify the database is running:

```bash
docker compose ps
```

### 3. Development

Start the development server:

```bash
pnpm dev
```

The server will start on `http://localhost:3000` (or `https://localhost:3000` if HTTPS is enabled).

**API Documentation**: Visit `http://localhost:3000/docs` for interactive Swagger UI.

### 4. API-First Workflow

This project follows API-first development:

1. **Design API** in `openapi.json`
2. **Validate** with Spectral: `pnpm run api:lint`
3. **Review** at `http://localhost:3000/docs`
4. **Implement** following the spec

#### HTTPS in Development

To enable HTTPS in development:

1. SSL certificates have already been generated in `backend/certs/`
2. Set `USE_HTTPS=true` in your `.env` file
3. Restart the dev server

The server will then run on https://localhost:3000

**Note**: Since this is a self-signed certificate, your browser will show a security warning. This is expected in development. You can safely proceed by accepting the certificate.

To regenerate certificates if needed:

```bash
cd backend/certs
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```
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
cd backend
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

### 1. Add to `packages/shared/src/openapi.json`

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
cd ..
pnpm run lint:api
```

### 3. Implement Following Hexagonal Architecture

**API route and adaptor** (`src/adapters/primary/http/user.controller.ts`):

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

**Data Transfer Objects** (`src/application/dtos/delete-users.dto.ts`):

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

**Use cases** (`src/application/use-cases/delete-users.use-case.ts`):

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

**Secondary adaptors** (`src/application/use-cases/delete-users.use-case.ts`):

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
  run: cd backend && pnpm run api:lint
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

## Available Scripts

- `pnpm dev` - Start development server with hot reloading
- `pnpm build` - Compile TypeScript to `dist/`
- `pnpm start` - Run compiled server from `dist/`
- `pnpm test` - Run unit tests with Vitest
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm mermaid` - Serve Mermaid diagrams (see [MERMAID_VIEWER.md](./MERMAID_VIEWER.md))
- `pnpm mermaid:di` - View DI container diagram at http://localhost:3001

## Viewing Diagrams

The backend includes a built-in Mermaid diagram viewer for visualizing architecture and documentation:

```bash
# View the DI container diagram
pnpm mermaid:di

# View any Mermaid file
pnpm mermaid docs/architecture-flow.md
```

See [MERMAID_VIEWER.md](./MERMAID_VIEWER.md) for full documentation.

## Database Management

### Docker Commands

All Docker commands should be run from the `backend` directory:

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs postgres

# Access PostgreSQL CLI
docker compose exec postgres psql -U postgres -d norbertsSpark

# Restart database
docker compose restart postgres
```

### Initialization Scripts

Place SQL scripts in `backend/init-scripts/` to run them automatically when the database is first created.

Example: `init-scripts/001-create-tables.sql`

Scripts run in alphabetical order. Prefix with numbers (001-, 002-, etc.) to control execution.

**Note**: Scripts only run on first database creation. To re-run:

```bash
docker compose down -v
docker compose up -d
```

### Connection String

The database connection string is configured in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/norbertsSpark
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Server entry point with HTTPS support
│   └── app.ts            # Fastify app factory
├── test/
│   └── *.test.ts         # Vitest unit tests
├── certs/                # SSL certificates (git-ignored)
│   ├── key.pem           # Private key
│   └── cert.pem          # Certificate
├── init-scripts/         # PostgreSQL initialization scripts
├── docker-compose.yml    # PostgreSQL Docker configuration
├── .env.example          # Environment variables template
├── .env                  # Your local environment (git-ignored)
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /` - Health check endpoint
- `GET /health` - Server health status

## Testing

Run unit tests:

```bash
pnpm test
```

Tests use Fastify's built-in testing utilities (`app.inject()`) for route testing.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=norbertsSpark

# Database connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/norbertsSpark

# OAuth Sync Shared Secret
# Shared secret for authenticating frontend OAuth sync requests
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
OAUTH_SYNC_SECRET=your-oauth-sync-shared-secret-here

# Server Configuration
USE_HTTPS=true  # Enable HTTPS in development
# PORT=3000     # Optional: Change server port
```

### Security

#### OAuth Sync Endpoint Authentication

The backend provides an OAuth sync endpoint (`/auth/oauth-sync`) that allows the frontend to synchronize OAuth-authenticated users (Google, GitHub, etc.) with the backend database. To prevent unauthorized access, this endpoint is protected by a shared secret authentication mechanism.

**Setup:**

1. Generate a secure random secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Add the secret to both backend and frontend environment variables:
   - Backend: `OAUTH_SYNC_SECRET=your-secret-here` in `apps/backend/.env`
   - Frontend: `OAUTH_SYNC_SECRET=your-secret-here` in `apps/frontend/.env.local`

3. The frontend automatically sends this secret in the `X-OAuth-Sync-Secret` header when calling the OAuth sync endpoint.

**Security Features:**

- Constant-time string comparison to prevent timing attacks
- Shared secret validation before processing any OAuth sync requests
- Generic error messages to prevent information disclosure
- Comprehensive logging for security monitoring

**Note:** The `OAUTH_SYNC_SECRET` must match exactly between frontend and backend configurations.

### Port 3000 already in use

The backend runs on port 3000 by default. Change it by setting the `PORT` environment variable in `.env`:

```env
PORT=3001
```

### HTTPS certificate issues

If you see HTTPS-related errors:

1. Verify certificates exist: `ls -la backend/certs/`
2. Regenerate certificates if needed (see HTTPS section above)
3. Or disable HTTPS by setting `USE_HTTPS=false` in `.env`

### Browser security warnings with HTTPS

When using HTTPS in development, browsers will show a security warning because the certificate is self-signed. This is expected and safe in development:

- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

### Database connection issues

1. Verify PostgreSQL is running: `docker compose ps`
2. Check logs: `docker compose logs postgres`
3. Verify connection string in `.env` matches your configuration

### Docker volume issues

To reset the database completely:

```bash
docker compose down -v
docker volume rm backend_postgres_data
docker compose up -d
```

## Additional Resources

- See root `DOCKER_POSTGRES.md` for detailed PostgreSQL setup instructions
- See root `DEVELOPMENT.md` for overall project development guidelines
