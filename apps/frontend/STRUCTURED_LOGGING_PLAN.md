# Implementation Plan: Structured Logging for the Next.js Frontend

## Goal

Evolve the existing `UnifiedLogger` to emit **structured, machine-readable log objects** with stable event names, correlation context, and GDPR-safe field selection — while remaining a zero-dependency, `console`-based logger that works identically on the server (Node.js / Edge) and in the browser.

---

## Current State

| Area                      | Current behaviour                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Logger implementation** | `UnifiedLogger` class in `src/infrastructure/logging/logger.ts` (312 lines). Wraps `console.trace/debug/info/warn/error`. Returns a `FormattedLogMessage` object (timestamp, prefix, method, message). |
| **LoggerPort**            | 4-method interface (`info`, `warn`, `error`, `debug`) in `src/application/ports/logger.port.ts`. No `child()`, no structured context.                                                                  |
| **Production filtering**  | `trace`, `debug`, and `info` are silenced in production via `process.env.NODE_ENV !== 'production'` checks. Only `warn` and `error` reach production logs.                                             |
| **Adoption**              | ~25 call sites across all DDD layers use `createLogger({ prefix })`. 2 application actions import `UnifiedLogger` directly.                                                                            |
| **Raw `console.*` leaks** | `middleware.ts` (`console.error`), `useAIAdminPage.ts` (`console.log`), `useAIChat.ts` (`console.error` via `.catch(console.error)`).                                                                  |
| **Log shape**             | `FormattedLogMessage` is a flat object with `timestamp`, `prefix`, `method`, `message`. No `event` field, no correlation ID, no `service`/`env`/`version` metadata.                                    |
| **Context propagation**   | None. Each logger instance has a static `prefix` string only. No per-request or per-session context.                                                                                                   |
| **Env vars for logging**  | None (`LOG_LEVEL`, `LOG_FORMAT` not defined). The logger defaults to `debug` min level.                                                                                                                |

---

## Design Constraints

| Constraint                      | Rationale                                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No external logging library** | Next.js bundles server and client code together; conditionally importing a Node-only library (Pino, Winston) causes build-time errors or inflated client bundles. The `UnifiedLogger` approach avoids this entirely.   |
| **Synchronous logging only**    | Because the logger must work in both server (Node/Edge) and client (browser) runtimes, async transports, file writes, or network calls are out of scope. `console.*` delegates to the runtime's built-in log handling. |
| **Production performance**      | `trace`, `info`, and `debug` are no-ops in production. Only `warn` and `error` execute, and these should fire rarely. The overhead of building a structured object per warn/error call is negligible.                  |
| **GDPR compliance**             | Same rules as the backend: never log email, IP, name, phone, tokens, or cookies. Only log opaque UUIDs (`userId`, `sessionId`).                                                                                        |

---

## Target Log Shape

### Server-side structured log (Server Action / API Route / Middleware)

```json
{
  "level": "error",
  "timestamp": "2026-03-06T12:00:00.000Z",
  "event": "server-action.backend-request.failed",
  "message": "Backend returned 502",
  "service": "norberts-spark-frontend",
  "env": "production",
  "version": "1.2.0",
  "context": "backendRequest",
  "statusCode": 502,
  "endpoint": "/api/v1/ai/chats",
  "durationMs": 1200,
  "err": {
    "name": "Error",
    "message": "Bad Gateway"
  }
}
```

### Client-side structured log (React hook / component)

```json
{
  "level": "error",
  "timestamp": "2026-03-06T12:00:05.000Z",
  "event": "chat.transport.error",
  "message": "Chat transport error",
  "service": "norberts-spark-frontend",
  "env": "production",
  "context": "useAIChat",
  "err": {
    "name": "Error",
    "message": "Network request failed"
  }
}
```

---

## Fields Reference

### Group 1 — Core fields (every log line)

| Field       | Source                                                                | Notes                                                                     |
| ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `level`     | The log method called (`trace` / `debug` / `info` / `warn` / `error`) | Lowercase string, matches `LogLevel` enum                                 |
| `timestamp` | `new Date().toISOString()`                                            | ISO 8601, already present                                                 |
| `event`     | Caller-supplied via `context` parameter                               | Stable, dot-separated machine-readable event name (see Event Names below) |
| `message`   | First argument to every log method                                    | Human-readable description                                                |

### Group 2 — Service metadata (injected automatically)

| Field     | Source                                                                | Notes                                                |
| --------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| `service` | `process.env.NEXT_PUBLIC_SERVICE_NAME \|\| 'norberts-spark-frontend'` | Identifies the app in a multi-service log aggregator |
| `env`     | `process.env.NEXT_PUBLIC_NODE_ENV \|\| process.env.NODE_ENV`          | `production` / `development`                         |
| `version` | `process.env.NEXT_PUBLIC_APP_VERSION \|\| 'unknown'`                  | Correlates log spikes with deployments               |

### Group 3 — Logger identity

| Field     | Source                                              | Notes                                                                                                         |
| --------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `context` | The `prefix` option from `createLogger({ prefix })` | Identifies the module/component that emitted the log. Renamed from `prefix` for consistency with the backend. |

### Group 4 — Error details (when applicable)

| Field       | Source                                              | Notes                                                                                                                               |
| ----------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `err`       | Serialised `Error` object                           | Extract `name`, `message`, and `stack` (stack only in non-production). Never log the raw Error — it may contain PII in its message. |
| `errorCode` | Application-specific code from custom error classes | e.g. `UNAUTHORIZED`, `NETWORK_ERROR`, `VALIDATION_FAILED`                                                                           |

### Group 5 — Request context (server-side only, optional)

| Field        | Source                                                 | Notes                                          |
| ------------ | ------------------------------------------------------ | ---------------------------------------------- |
| `statusCode` | HTTP status from backend response or Next.js API route | Only for server actions / API routes           |
| `endpoint`   | The backend endpoint called                            | Parameterised path preferred over resolved URL |
| `durationMs` | `Date.now() - startTime`                               | Round to integer                               |

---

## Event Names

Use dot-separated namespacing. The first segment identifies the domain area; the last segment is the outcome.

### Server Actions (`src/infrastructure/serverActions/`)

| Event                                     | When                                    |
| ----------------------------------------- | --------------------------------------- |
| `server-action.backend-request.completed` | Successful backend fetch (2xx)          |
| `server-action.backend-request.failed`    | Backend returned non-2xx or fetch threw |
| `server-action.backend-request.timeout`   | Request exceeded `timeoutMs`            |
| `server-action.backend-request.retry`     | 401 retry triggered                     |
| `server-action.login.success`             | Login server action succeeded           |
| `server-action.login.failed`              | Login server action failed              |
| `server-action.logout.completed`          | Logout server action completed          |

### API Routes (`src/app/api/`)

| Event                              | When                              |
| ---------------------------------- | --------------------------------- |
| `api-route.register.completed`     | User registration route succeeded |
| `api-route.register.failed`        | User registration route failed    |
| `api-route.users.fetched`          | Users list fetched                |
| `api-route.extract-data.completed` | Data extraction route succeeded   |
| `api-route.extract-data.failed`    | Data extraction route failed      |

### Auth & Middleware (`src/middleware.ts`, `src/lib/auth/`)

| Event                            | When                                        |
| -------------------------------- | ------------------------------------------- |
| `middleware.auth-token.failed`   | `getToken()` threw in middleware            |
| `middleware.rate-limit.exceeded` | Rate limiter blocked request (when enabled) |
| `auth.session.created`           | NextAuth session callback fired             |
| `auth.session.error`             | NextAuth error callback fired               |

### Client Hooks (`src/view/hooks/`)

| Event                    | When                                          |
| ------------------------ | --------------------------------------------- |
| `chat.transport.error`   | AI chat stream error                          |
| `chat.stream.aborted`    | User cancelled AI stream                      |
| `chat.message.sent`      | User sent a message                           |
| `file-upload.started`    | File upload initiated                         |
| `file-upload.completed`  | File upload succeeded                         |
| `file-upload.failed`     | File upload failed                            |
| `session-guard.redirect` | Session guard redirected unauthenticated user |
| `signin.submitted`       | Sign-in form submitted                        |
| `signin.failed`          | Sign-in attempt failed                        |
| `registration.submitted` | Registration form submitted                   |
| `registration.failed`    | Registration attempt failed                   |

### Application Actions (`src/application/actions/`)

| Event                             | When                            |
| --------------------------------- | ------------------------------- |
| `action.register-user.completed`  | `registerUser` action succeeded |
| `action.register-user.failed`     | `registerUser` action failed    |
| `action.find-all-users.completed` | `findAllUsers` action succeeded |
| `action.find-all-users.failed`    | `findAllUsers` action failed    |

---

## Implementation Steps

### Step 1 — Add logging environment variables

**File:** `apps/frontend/.env` (and `.env.example` if it exists)

```dotenv
NEXT_PUBLIC_SERVICE_NAME=norberts-spark-frontend
NEXT_PUBLIC_APP_VERSION=0.0.0
# NEXT_PUBLIC_ prefix so these are available in both server and client bundles
```

`NEXT_PUBLIC_APP_VERSION` can be injected at deploy time from the git SHA or `package.json` version.

---

### Step 2 — Define a `StructuredLogEntry` type

**File:** `apps/frontend/src/infrastructure/logging/logger.ts`

Replace the existing `FormattedLogMessage` interface with a richer structured type:

```typescript
/**
 * A structured log entry emitted by UnifiedLogger.
 * Designed for machine-readability in log aggregators.
 */
export interface StructuredLogEntry {
  /** Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error' */
  level: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Human-readable log message */
  message: string
  /** Service identifier */
  service: string
  /** Runtime environment */
  env: string
  /** Application version */
  version: string
  /** Logger context/module name (formerly 'prefix') */
  context?: string
  /** Stable, dot-separated event name for machine filtering */
  event?: string
  /** Serialised error details */
  err?: { name: string; message: string; stack?: string }
  /** Application-specific error code */
  errorCode?: string
  /** Additional structured fields */
  [key: string]: unknown
}
```

Keep `FormattedLogMessage` as a deprecated type alias for backward compatibility during migration, or remove it if no external consumers depend on it.

---

### Step 3 — Update `LoggerPort` to accept structured context

**File:** `apps/frontend/src/application/ports/logger.port.ts`

The current signature uses `context?: Record<string, unknown>` — this is already flexible enough. No change to the port interface is required. The structured fields (including `event`) are passed via the existing `context` parameter.

If you want a `child()` method for binding persistent context (e.g. a `requestId` from middleware):

```typescript
export interface LoggerPort {
  trace(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
  /** Return a new logger with the given fields pre-merged into every log line. */
  child(bindings: Record<string, unknown>): LoggerPort
}
```

Adding `trace` to the port brings it in line with the `UnifiedLogger` implementation which already has `trace()`.

---

### Step 4 — Refactor `UnifiedLogger.formatMessage()` to emit `StructuredLogEntry`

**File:** `apps/frontend/src/infrastructure/logging/logger.ts`

The core change: `formatMessage` builds a `StructuredLogEntry` instead of a `FormattedLogMessage`.

```typescript
private static readonly SERVICE_NAME =
  process.env.NEXT_PUBLIC_SERVICE_NAME || 'norberts-spark-frontend'
private static readonly ENV =
  process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || 'development'
private static readonly VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'

private formatMessage(
  logLevel: LogLevelType,
  message: string,
  context?: Record<string, unknown>,
): StructuredLogEntry {
  const entry: StructuredLogEntry = {
    level: logLevel,
    timestamp: new Date().toISOString(),
    message,
    service: UnifiedLogger.SERVICE_NAME,
    env: UnifiedLogger.ENV,
    version: UnifiedLogger.VERSION,
  }

  if (this.prefix) {
    entry.context = this.prefix
  }

  // Merge bound context from child() loggers
  if (this.bindings) {
    Object.assign(entry, this.bindings)
  }

  // Merge per-call context
  if (context) {
    Object.assign(entry, context)
  }

  return entry
}
```

---

### Step 5 — Update log methods to pass structured context and serialise errors

**File:** `apps/frontend/src/infrastructure/logging/logger.ts`

Update each method signature and body. The key changes:

1. Replace `...args: unknown[]` with an optional `context?: Record<string, unknown>` parameter (aligning with `LoggerPort`).
2. For `error()`, accept an `Error` as the second argument and serialise it into `err: { name, message, stack? }`.
3. Strip `stack` from error serialisation in production to reduce log volume.

```typescript
private serializeError(error: Error): { name: string; message: string; stack?: string } {
  const serialized: { name: string; message: string; stack?: string } = {
    name: error.name,
    message: error.message,
  }
  if (process.env.NODE_ENV !== 'production') {
    serialized.stack = error.stack
  }
  return serialized
}

warn(message: string, context?: Record<string, unknown>): void {
  if (this.shouldLog(LogLevel.WARN)) {
    const entry = this.formatMessage(LogLevel.WARN, message, context)
    console.warn(entry)
  }
}

error(message: string, error?: Error, context?: Record<string, unknown>): void {
  if (this.shouldLog(LogLevel.ERROR)) {
    const errorContext = error
      ? { ...context, err: this.serializeError(error) }
      : context
    const entry = this.formatMessage(LogLevel.ERROR, message, errorContext)
    console.error(entry)
  }
}

info(message: string, context?: Record<string, unknown>): void {
  if (this.shouldLog(LogLevel.INFO) && process.env.NODE_ENV !== 'production') {
    const entry = this.formatMessage(LogLevel.INFO, message, context)
    console.info(entry)
  }
}

debug(message: string, context?: Record<string, unknown>): void {
  if (this.shouldLog(LogLevel.DEBUG) && process.env.NODE_ENV !== 'production') {
    const entry = this.formatMessage(LogLevel.DEBUG, message, context)
    console.debug(entry)
  }
}

trace(message: string, context?: Record<string, unknown>): void {
  if (this.shouldLog(LogLevel.TRACE) && process.env.NODE_ENV !== 'production') {
    const entry = this.formatMessage(LogLevel.TRACE, message, context)
    console.trace(entry)
  }
}
```

---

### Step 6 — Implement `child()` method

**File:** `apps/frontend/src/infrastructure/logging/logger.ts`

`child()` returns a new `UnifiedLogger` with pre-bound fields merged into every log entry. This is useful for per-request context in server actions or API routes.

```typescript
private bindings?: Record<string, unknown>

child(bindings: Record<string, unknown>): UnifiedLogger {
  const childLogger = new UnifiedLogger({
    minLevel: this.minLevel,
    prefix: this.prefix,
    level: this.level,
  })
  // Merge parent bindings with new bindings
  childLogger.bindings = { ...this.bindings, ...bindings }
  return childLogger
}
```

---

### Step 7 — Replace raw `console.*` calls with `UnifiedLogger`

**Files to update:**

| File                                          | Current                                                                | Replacement                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/middleware.ts` (line ~275)               | `console.error('Failed to retrieve auth token in middleware:', error)` | `logger.error('Failed to retrieve auth token in middleware', error instanceof Error ? error : new Error(String(error)), { event: 'middleware.auth-token.failed' })` |
| `src/view/hooks/useAIAdminPage.ts` (line ~35) | `console.log('chatTypes in useAIAdminPage', chatTypes)`                | `logger.debug('Chat types loaded', { event: 'admin.chat-types.loaded', count: chatTypes?.length })` — or remove entirely (debug logging)                            |
| `src/view/hooks/useAIChat.ts` (line ~119)     | `void stop().catch(console.error)`                                     | `void stop().catch((err: Error) => logger.error('Failed to stop chat stream', err, { event: 'chat.stream.stop-failed' }))`                                          |

---

### Step 8 — Add `event` fields to existing log call sites

Audit all ~25 call sites and add an `event` field to the `context` parameter. Group by DDD layer:

#### Infrastructure — Server Actions

The `baseServerAction.ts` is the central backend HTTP client. This is the highest-value target because all server actions flow through it.

```typescript
// On success
logger.info('Backend request completed', {
  event: 'server-action.backend-request.completed',
  endpoint,
  statusCode: response.status,
  durationMs: Math.round(Date.now() - startTime),
})

// On failure
logger.error('Backend request failed', error, {
  event: 'server-action.backend-request.failed',
  endpoint,
  statusCode: response?.status,
  durationMs: Math.round(Date.now() - startTime),
})
```

Individual server actions (`loginUser.server.ts`, `logoutUser.server.ts`, etc.) should add domain-specific events when they add value beyond the base request log.

#### View — Hooks

```typescript
// useAIChat.ts — onError
logger.error('Chat transport error', error, {
  event: 'chat.transport.error',
})

// useSignInForm.ts
logger.warn('Sign-in failed', {
  event: 'signin.failed',
  // email intentionally omitted — PII
})

// useFileUpload.ts
logger.info('File upload started', {
  event: 'file-upload.started',
  fileCount: files.length,
})
```

#### Application — Actions

```typescript
// registerUser.ts
logger.info('User registered', {
  event: 'action.register-user.completed',
  userId: user.id,
})
```

#### Lib — Auth config

```typescript
// auth-config.ts
logger.error('Auth callback error', error, {
  event: 'auth.session.error',
})
```

---

### Step 9 — Standardise `createLogger` prefix naming convention

Currently prefixes are inconsistent — some use brackets `[prefix]`, some don't, some use colons.

**Convention:** Use unbracketed `PascalCase:layer` format matching the backend's approach:

| Current prefix                  | New prefix                          |
| ------------------------------- | ----------------------------------- |
| `backendRequest`                | `BackendRequest`                    |
| `[updateCompanyDetails:action]` | `UpdateCompanyDetails:ServerAction` |
| `[login:action]`                | `Login:ServerAction`                |
| `[useAIChat]`                   | `UseAIChat:Hook`                    |
| `[auth-config]`                 | `AuthConfig`                        |
| `UsersAPI`                      | `Users:ApiRoute`                    |
| `[register:route]`              | `Register:ApiRoute`                 |

This is a **low-priority** cosmetic change. It can be done incrementally alongside Step 8 without a dedicated pass.

---

### Step 10 — Standardise application actions to use `createLogger`

**Files:** `src/application/actions/registerUser.ts`, `src/application/actions/findAllUsers.ts`

These two files import `UnifiedLogger` directly and use `new UnifiedLogger(...)`. Change them to use the `createLogger` factory for consistency:

```typescript
// Before
import { UnifiedLogger } from '@/infrastructure/logging/logger.js'
const logger = new UnifiedLogger({ prefix: '[registerUser]' })

// After
import { createLogger } from '@/infrastructure/logging/logger.js'
const logger = createLogger({ prefix: 'RegisterUser:Action' })
```

---

### Step 11 — Audit existing log call sites for PII

Do a project-wide search in `apps/frontend/src/` for the following patterns:

| Pattern to search for                  | Risk                                       |
| -------------------------------------- | ------------------------------------------ |
| `email` inside a `logger.` call        | Email is PII — remove or never log         |
| `password` inside a `logger.` call     | Critical — must never be logged            |
| `token` inside a `logger.` call        | Access/refresh tokens must never be logged |
| `cookie` inside a `logger.` call       | Session cookies must never be logged       |
| `ip` or `remoteAddress` in log context | IP is PII under UK GDPR                    |
| `req.headers` in log context           | May leak auth tokens or cookies            |

The backend has a `SENSITIVE_FIELDS` constant in `src/domain/audit/redact-sensitive-data.ts`. Consider importing or mirroring this list for client-side awareness, though the primary defence is to never pass PII to the logger in the first place.

---

### Step 12 — Add unit tests

**File:** `apps/frontend/test/infrastructure/logging/logger.test.ts` (new or update existing)

| Test case                                          | Assertion                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `formatMessage` returns `StructuredLogEntry` shape | Check all required fields: `level`, `timestamp`, `message`, `service`, `env`, `version`        |
| `prefix` maps to `context` field                   | `createLogger({ prefix: 'Foo' })` → entry has `context: 'Foo'`                                 |
| `error()` serialises Error into `err`              | `logger.error('msg', new Error('boom'))` → entry has `err: { name: 'Error', message: 'boom' }` |
| `child()` merges bindings                          | `logger.child({ requestId: 'abc' }).warn('msg')` → entry has `requestId: 'abc'`                |
| `child()` bindings don't mutate parent             | Parent logger entries must not contain child bindings                                          |
| `event` field passes through                       | `logger.warn('msg', { event: 'foo.bar' })` → entry has `event: 'foo.bar'`                      |
| Production filtering                               | With `NODE_ENV=production`, `info/debug/trace` do not call `console.*`                         |
| `warn` and `error` log in production               | With `NODE_ENV=production`, `warn` and `error` still emit                                      |
| Error stack excluded in production                 | With `NODE_ENV=production`, `err.stack` is undefined                                           |

---

## Files Changed (Summary)

| #   | File                                                       | Action                                                                                                                                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/frontend/.env`                                       | Add `NEXT_PUBLIC_SERVICE_NAME`, `NEXT_PUBLIC_APP_VERSION`                                                                                                                       |
| 2   | `apps/frontend/src/infrastructure/logging/logger.ts`       | Replace `FormattedLogMessage` with `StructuredLogEntry`; refactor `formatMessage`; update method signatures; add `child()`; add `serializeError()`; add static service metadata |
| 3   | `apps/frontend/src/application/ports/logger.port.ts`       | Add `trace()` and `child()` to `LoggerPort` interface                                                                                                                           |
| 4   | `apps/frontend/src/middleware.ts`                          | Replace `console.error` with structured logger call                                                                                                                             |
| 5   | `apps/frontend/src/view/hooks/useAIAdminPage.ts`           | Replace `console.log` with structured logger or remove                                                                                                                          |
| 6   | `apps/frontend/src/view/hooks/useAIChat.ts`                | Replace `.catch(console.error)` with structured logger                                                                                                                          |
| 7   | `apps/frontend/src/application/actions/registerUser.ts`    | Switch from `new UnifiedLogger()` to `createLogger()`                                                                                                                           |
| 8   | `apps/frontend/src/application/actions/findAllUsers.ts`    | Switch from `new UnifiedLogger()` to `createLogger()`                                                                                                                           |
| 9   | All server actions in `src/infrastructure/serverActions/`  | Add `event` fields to existing log calls                                                                                                                                        |
| 10  | All hooks in `src/view/hooks/` that use the logger         | Add `event` fields to existing log calls                                                                                                                                        |
| 11  | `src/lib/auth/auth-config.ts`                              | Add `event` fields to existing log calls                                                                                                                                        |
| 12  | `src/app/api/*/route.ts`                                   | Add `event` fields to existing log calls                                                                                                                                        |
| 13  | `apps/frontend/test/infrastructure/logging/logger.test.ts` | New or updated test file                                                                                                                                                        |

---

## Suggested Implementation Order

1. **Add env vars** (Step 1) — zero risk, needed by everything else
2. **Define `StructuredLogEntry` type** (Step 2) — type-only change
3. **Update `LoggerPort`** (Step 3) — add `trace()` and `child()` to interface
4. **Refactor `UnifiedLogger` internals** (Steps 4, 5, 6) — core change, update `formatMessage`, method signatures, add `child()` and `serializeError()`
5. **Add unit tests** (Step 12) — validate the refactored logger before updating call sites
6. **Replace raw `console.*` calls** (Step 7) — fix the 3 unstructured leaks
7. **Standardise application actions** (Step 10) — 2-file change
8. **Add `event` fields to call sites** (Step 8) — largest step, can be done incrementally per DDD layer
9. **Standardise prefix naming** (Step 9) — cosmetic, do alongside Step 8
10. **PII audit** (Step 11) — final pass, verify no sensitive data leaks

---

## Non-Goals (Explicitly Out of Scope)

| Item                                               | Reason                                                                                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Async log transport**                            | Incompatible with the dual server/client runtime constraint. `console.*` delegates to the platform.                                                                                                         |
| **Log shipping from the browser**                  | Would require a network transport (e.g. `fetch` to a log endpoint). Out of scope for this plan; can be added later as a separate feature.                                                                   |
| **Request-scoped context via `AsyncLocalStorage`** | Next.js App Router's server component model makes `AsyncLocalStorage` usage complex. The `child()` method provides an explicit alternative for server actions and API routes that need per-request context. |
| **Replacing `console.*` in third-party code**      | Only application code is in scope. Framework-level logs (Next.js, React) are left as-is.                                                                                                                    |
| **Log levels via env var**                         | The current `minLevel` default of `debug` with the production guard (`NODE_ENV !== 'production'`) is sufficient. A `LOG_LEVEL` env var can be added later if finer control is needed.                       |
