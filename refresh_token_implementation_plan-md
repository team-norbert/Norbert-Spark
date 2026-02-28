# Implementation Plan: Refresh Tokens with Silent Renewal

## Problem Statement

The backend JWT access token expires after 1 hour (`JWT_EXPIRATION=3600`), but the NextAuth session cookie lives for 30 days. Once the backend token expires, every server action and client-side API call receives a 401, and `backendRequest()` redirects to `/signin?error=session_expired` — forcing a full re-login even though the user's NextAuth session is still valid.

---

## Current Token Architecture

There are **two independent JWTs** in the system — a "token-in-a-token" pattern:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NextAuth JWT Cookie (30 days)                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  token.id         = userId                                       │  │
│  │  token.email       = user email                                  │  │
│  │  token.roles       = ['user'] | ['admin', ...]                   │  │
│  │  token.accessToken = "eyJhbGciOiJIUzI1NiIs..."  ← backend JWT   │  │
│  │                      (expires after 1 hour)                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### What exists today

| Component | File | Current state |
|-----------|------|---------------|
| Token generation | `apps/backend/src/infrastructure/security/jwt.util.ts` | Single `generateToken()` using `jsonwebtoken`, signed with `JWT_SECRET`, expiry from `JWT_EXPIRATION` (default 3600s) |
| Token port | `apps/backend/src/application/ports/token-generator.port.ts` | `generateToken(claims: JwtUserClaims): string` — single method |
| Token adapter | `apps/backend/src/adapters/secondary/services/jwt-token-generator.service.ts` | Thin wrapper around `JwtUtil.generateToken()` |
| Auth middleware | `apps/backend/src/infrastructure/http/middleware/auth.middleware.ts` | Validates `Authorization: Bearer <token>`, checks format + signature + expiry + claims |
| Login use case | `apps/backend/src/application/use-cases/login-user.use-case.ts` | Returns `{ userId, email, accessToken, roles }` — no refresh token |
| OAuth sync use case | `apps/backend/src/application/use-cases/register-user-with-provider.use-case.ts` | Returns `{ userId, access_token, token_type, expires_in }` — no refresh token |
| Auth controller | `apps/backend/src/adapters/primary/http/auth.controller.ts` | Routes: `POST /auth/login`, `POST /auth/oauth-sync` — no refresh endpoint |
| DI container | `apps/backend/src/infrastructure/di/container/index.ts` | Wires `JwtTokenGeneratorService` → use cases → controller |
| DB schema | `apps/backend/src/infrastructure/database/schema.ts` | No refresh token table, no session table |
| Frontend NextAuth config | `apps/frontend/src/lib/auth/auth-config.ts` | Stores backend `accessToken` inside NextAuth JWT; 30-day session/JWT maxAge |
| Frontend middleware | `apps/frontend/src/middleware.ts` | `getToken()` from NextAuth JWT cookie; no backend call |
| Frontend auth utilities | `apps/frontend/src/lib/auth/auth.ts` | `getAuthToken()` reads `session.accessToken`; `withAuth()`/`withRole()` HOFs |
| Frontend base server action | `apps/frontend/src/infrastructure/serverActions/baseServerAction.ts` | On 401 → `redirect('/signin?error=session_expired')` |
| Frontend client-side auth | `apps/frontend/src/view/hooks/useAIChat.ts` | Reads `session.accessToken` from `useSession()` and attaches `Authorization` header |
| Next-Auth types | `apps/frontend/src/shared/types/next-auth.d.ts` | Augments `Session`, `User`, `JWT` with `accessToken`, `id`, `roles` |
| Error codes | `apps/backend/src/shared/constants/error-codes.ts` | `TOKEN_EXPIRED` error code exists |
| Env vars | `apps/backend/.env.example` | `JWT_SECRET`, `JWT_EXPIRATION=3600`, `JWT_ISSUER` |

### What does NOT exist

- No `refreshToken` field anywhere in auth responses
- No refresh token table in the database
- No `POST /auth/refresh` endpoint
- No `generateRefreshToken()` or `verifyRefreshToken()` methods
- No cookie handling in the backend
- No token rotation or revocation logic
- No silent renewal mechanism on the frontend
- OAuth users get `accessToken = 'oauth-provider'` (a string literal, not a real JWT) — they likely cannot call protected backend endpoints at all today

---

## Target Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LOGIN / OAUTH-SYNC                                                              │
│                                                                                  │
│  Backend returns:                                                                │
│    { accessToken (short-lived), refreshToken (long-lived), expiresIn }           │
│                                                                                  │
│  NextAuth JWT callback stores:                                                   │
│    token.accessToken    = backend access JWT                                     │
│    token.refreshToken   = backend refresh token (opaque or JWT)                  │
│    token.accessTokenExp = Date.now() + expiresIn * 1000                          │
└──────────────────────────┬───────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────────┐
│  NextAuth JWT callback (on every session read)                                   │
│                                                                                  │
│  if (Date.now() < token.accessTokenExp - BUFFER) → return token as-is           │
│  else → call POST /auth/refresh with token.refreshToken                         │
│       → on success: update token.accessToken, token.refreshToken,               │
│                     token.accessTokenExp                                         │
│       → on failure: set token.error = 'RefreshTokenExpired'                     │
└──────────────────────────┬───────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────────┐
│  Session callback                                                                │
│                                                                                  │
│  session.accessToken = token.accessToken                                         │
│  session.error       = token.error  (if refresh failed)                         │
│                                                                                  │
│  Frontend checks session.error → if 'RefreshTokenExpired' → signOut()           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Database — New `refresh_tokens` Table

Add a new table to `apps/backend/src/infrastructure/database/schema.ts`.

**Columns:**

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | UUIDv7 |
| `user_id` | `uuid` (FK → users) | NOT NULL |
| `token_hash` | `text` | SHA-256 hash of the refresh token — never store the raw token |
| `token_family` | `uuid` | Rotation family ID — all tokens in a rotation chain share this. Used for replay detection |
| `expires_at` | `timestamp with time zone` | NOT NULL |
| `revoked_at` | `timestamp with time zone` | NULL until explicitly revoked |
| `created_at` | `timestamp with time zone` | NOT NULL, default `now()` |
| `last_used_at` | `timestamp with time zone` | Updated on each use |
| `ip_address` | `text` | Optional — IP at creation time for auditing |
| `user_agent` | `text` | Optional — user-agent at creation time for auditing |

**Why hash the token?** If the database is compromised, raw refresh tokens would let attackers impersonate users. Storing only the SHA-256 hash means a breach exposes nothing usable.

**Why `token_family`?** On each refresh, the old token is revoked and a new one is issued with the same `token_family`. If an already-revoked token is presented (replay attack), you know the entire family has been compromised and can revoke all tokens in that family.

**Indexes:**

- Unique index on `token_hash` (lookup by hash on every refresh)
- Index on `user_id` (revoke all tokens for a user on logout)
- Index on `token_family` (revoke entire family on replay detection)
- Partial index on `expires_at WHERE revoked_at IS NULL` (efficient cleanup of expired tokens)

**Example Drizzle definition:**

```typescript
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.userId, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    tokenFamily: uuid('token_family').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
    tokenFamilyIdx: index('refresh_tokens_token_family_idx').on(table.tokenFamily),
  })
)
```

---

### 2. Backend — New Environment Variables

Add to `EnvConfig` in `apps/backend/src/infrastructure/config/env.config.ts`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `REFRESH_TOKEN_EXPIRATION` | `604800` (7 days) | Refresh token lifetime in seconds |
| `REFRESH_TOKEN_SECRET` | (required) | Separate signing secret for refresh tokens — or use a random opaque token with DB-only validation |
| `ACCESS_TOKEN_BUFFER` | `300` (5 minutes) | Frontend should refresh this many seconds before actual expiry |

**Design decision: Opaque vs JWT refresh tokens**

| Approach | Pros | Cons |
|----------|------|------|
| **Opaque token** (random bytes, stored hashed in DB) | Simpler, inherently revocable, no crypto verification needed — DB is the source of truth | Every refresh requires a DB lookup (but this is infrequent) |
| **JWT refresh token** (signed, with DB record for revocation) | Self-contained claims reduce DB reads; can carry metadata | Requires a second secret; revocation still needs DB; more complex |

**Recommendation: Opaque tokens.** Refresh operations happen infrequently (every ~55 minutes), so the DB lookup cost is negligible. Opaque tokens are simpler and inherently immune to signature-bypass vulnerabilities.

---

### 3. Backend — Domain Layer

#### 3a. New value object: `RefreshToken`

Location: `apps/backend/src/domain/value-objects/refresh-token.ts`

Responsibilities:
- Generate a cryptographically random opaque token (`crypto.randomBytes(32).toString('hex')`)
- Compute the SHA-256 hash for storage
- Validate token format (64 hex characters)

```typescript
// Conceptual structure
class RefreshToken {
  private constructor(
    private readonly rawToken: string,
    private readonly hash: string
  ) {}

  static generate(): RefreshToken {
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    return new RefreshToken(raw, hash)
  }

  static fromRaw(raw: string): RefreshToken {
    // Validate format, compute hash
  }

  getRawToken(): string   // Only exposed at creation time — sent to client
  getHash(): string        // Stored in database
}
```

#### 3b. New entity: `RefreshTokenRecord`

Location: `apps/backend/src/domain/entities/refresh-token-record.ts`

Represents a stored refresh token row: `id`, `userId`, `tokenHash`, `tokenFamily`, `expiresAt`, `revokedAt`, `createdAt`, `lastUsedAt`.

Methods:
- `isExpired(): boolean`
- `isRevoked(): boolean`
- `isValid(): boolean` (not expired AND not revoked)
- `revoke(): void` (sets `revokedAt`)

---

### 4. Backend — Application Layer

#### 4a. New port: `RefreshTokenRepositoryPort`

Location: `apps/backend/src/application/ports/refresh-token.repository.port.ts`

```typescript
interface RefreshTokenRepositoryPort {
  /** Store a new refresh token record */
  create(record: {
    userId: UserIdType
    tokenHash: string
    tokenFamily: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }): Promise<void>

  /** Find a valid (non-expired, non-revoked) token by its hash */
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>

  /** Revoke a single token by its hash */
  revokeByHash(tokenHash: string): Promise<void>

  /** Revoke ALL tokens in a token family (replay attack response) */
  revokeFamily(tokenFamily: string): Promise<void>

  /** Revoke ALL tokens for a user (logout from all devices) */
  revokeAllForUser(userId: UserIdType): Promise<void>

  /** Delete expired tokens older than a given date (cleanup job) */
  deleteExpiredBefore(date: Date): Promise<number>
}
```

#### 4b. Update existing port: `TokenGeneratorPort`

Location: `apps/backend/src/application/ports/token-generator.port.ts`

The existing `generateToken(claims)` stays. No changes needed — access token generation is unchanged. The refresh token is opaque, not a JWT, so it doesn't use this port.

#### 4c. New use case: `RefreshAccessTokenUseCase`

Location: `apps/backend/src/application/use-cases/refresh-access-token.use-case.ts`

**Flow:**

```
Input: rawRefreshToken (string from request body)

1. Hash the incoming token → SHA-256
2. Look up the hash in DB via RefreshTokenRepositoryPort.findByHash()
3. If not found → throw UnauthorizedException('Invalid refresh token')
4. If found but revoked → REPLAY ATTACK detected
   → revokeFamily(record.tokenFamily)  // Revoke ALL in the family
   → audit log: 'REFRESH_TOKEN_REPLAY_DETECTED'
   → throw UnauthorizedException('Token has been revoked')
5. If found but expired → throw UnauthorizedException('Refresh token expired')
6. Token is valid:
   a. Revoke the current token (revokeByHash)
   b. Load user from UserRepositoryPort.findById(record.userId)
   c. Generate new access token via TokenGeneratorPort.generateToken()
   d. Generate new refresh token (RefreshToken.generate())
   e. Store new refresh token with SAME tokenFamily
   f. Audit log: 'TOKEN_REFRESHED'
   g. Return { accessToken, refreshToken: newToken.getRawToken(), expiresIn }
```

This is **refresh token rotation** — every refresh invalidates the old token and issues a new one. The `tokenFamily` ties the chain together for replay detection.

#### 4d. New use case: `LogoutUseCase` (or extend existing)

Location: `apps/backend/src/application/use-cases/logout.use-case.ts`

```
Input: userId (from auth middleware)

1. RefreshTokenRepositoryPort.revokeAllForUser(userId)
2. Audit log: 'USER_LOGOUT'
```

#### 4e. Update `LoginUserUseCase`

Current return: `{ userId, email, accessToken, roles }`

New return: `{ userId, email, accessToken, refreshToken, expiresIn, roles }`

After generating the access token, also:
1. Generate a new `RefreshToken`
2. Create a new `tokenFamily` (new UUIDv7 — this is the start of a new rotation chain)
3. Store via `RefreshTokenRepositoryPort.create()`
4. Return the raw refresh token alongside the access token

#### 4f. Update `RegisterUserWithProviderUseCase`

Same pattern as login — generate and return a refresh token alongside the access token.

---

### 5. Backend — Infrastructure Layer

#### 5a. New repository: `RefreshTokenRepository`

Location: `apps/backend/src/adapters/secondary/repositories/refresh-token.repository.ts`

Implements `RefreshTokenRepositoryPort` using Drizzle ORM against the `refresh_tokens` table.

#### 5b. New cleanup job (optional but recommended)

Location: `apps/backend/src/infrastructure/jobs/cleanup-expired-tokens.ts`

A periodic job (e.g. daily via `setInterval` or a cron library) that calls `RefreshTokenRepositoryPort.deleteExpiredBefore(new Date())` to prune old rows.

---

### 6. Backend — Controller Layer

#### 6a. Update `AuthController.registerRoutes()`

Add two new routes:

```typescript
registerRoutes(app: FastifyInstance): void {
  app.post('/auth/login', this.login.bind(this))
  app.post('/auth/oauth-sync', { preHandler: oauthSyncAuthMiddleware }, this.oauthSync.bind(this))
  app.post('/auth/refresh', this.refresh.bind(this))      // NEW
  app.post('/auth/logout', { preHandler: authMiddleware }, this.logout.bind(this)) // NEW
}
```

#### 6b. New handler: `refresh()`

```
POST /auth/refresh
Body: { refreshToken: string }

1. Validate refreshToken is present and is a 64-char hex string
2. Call RefreshAccessTokenUseCase.execute(refreshToken, auditContext)
3. Return 200: { success: true, data: { accessToken, refreshToken, expiresIn } }
4. On error: return 401: { success: false, error: message }
```

**Important:** This endpoint has NO `authMiddleware` — the caller's access token is expired, so it cannot be validated. The refresh token itself is the authentication proof.

#### 6c. New handler: `logout()`

```
POST /auth/logout
Headers: Authorization: Bearer <accessToken>
(Uses authMiddleware — requires a valid access token)

1. Extract userId from request.user.sub
2. Call LogoutUseCase.execute(userId, auditContext)
3. Return 200: { success: true, message: 'Logged out' }
```

#### 6d. Update `login()` response

Current:
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "email": "...",
    "accessToken": "...",
    "roles": [...]
  }
}
```

New:
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "email": "...",
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "roles": [...]
  }
}
```

#### 6e. Update `oauthSync()` response

Same pattern — add `refreshToken` and `expiresIn` to the response alongside `accessToken`.

---

### 7. Frontend — NextAuth Type Augmentation

Update `apps/frontend/src/shared/types/next-auth.d.ts`:

```typescript
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    error?: string            // NEW — 'RefreshTokenExpired' when refresh fails
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      roles: string[]
    }
  }

  interface User {
    id: string
    email: string
    accessToken: string
    refreshToken: string      // NEW
    expiresIn: number         // NEW — seconds until access token expires
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    refreshToken: string      // NEW
    accessTokenExp: number    // NEW — epoch ms when access token expires
    error?: string            // NEW
    id: string
    roles: string[]
  }
}
```

---

### 8. Frontend — NextAuth Config Changes

Location: `apps/frontend/src/lib/auth/auth-config.ts`

This is where the silent renewal lives. NextAuth's `jwt` callback runs **on every `getServerSession()` and `getToken()` call** — making it the ideal place to check expiry and refresh.

#### 8a. Update `authorize()` in CredentialsProvider

Current: returns `{ id, email, accessToken, roles }`

New: return the `refreshToken` and `expiresIn` from the backend response too:

```typescript
return {
  id: data.userId,
  email: data.email,
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,    // NEW
  expiresIn: data.expiresIn,          // NEW
  roles: data.roles || [],
}
```

#### 8b. Update `signIn()` callback for OAuth

The OAuth sync response now also includes `refreshToken` and `expiresIn`. These need to be captured and threaded into the user object. Since NextAuth's `signIn` callback cannot directly modify the `user` object that flows to `jwt`, you have two options:

- **Option A (recommended):** In `signIn`, store the OAuth sync response in a module-scoped `Map<string, OAuthSyncResult>` keyed by email, then read from it in the `jwt` callback. Clear the entry after reading.
- **Option B:** Have the `jwt` callback make its own call to a backend endpoint to fetch the tokens for OAuth users (heavier, but cleaner separation).

#### 8c. Update `jwt()` callback — the core of silent renewal

```typescript
async jwt({ account, token, user }) {
  // ① Initial sign-in — store tokens
  if (user) {
    token.accessToken = user.accessToken
    token.refreshToken = user.refreshToken
    token.accessTokenExp = Date.now() + user.expiresIn * 1000
    token.id = user.id
    token.roles = user.roles ?? ['user']
    return token
  }

  // ② Access token still valid (with buffer) — return as-is
  const BUFFER_MS = 5 * 60 * 1000  // 5 minutes before expiry
  if (Date.now() < token.accessTokenExp - BUFFER_MS) {
    return token
  }

  // ③ Access token expired or about to expire — attempt silent refresh
  try {
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const result = await response.json()
    const data = result.data

    token.accessToken = data.accessToken
    token.refreshToken = data.refreshToken      // Rotated token
    token.accessTokenExp = Date.now() + data.expiresIn * 1000
    delete token.error

    return token
  } catch (error) {
    // Refresh failed — mark the session as errored
    // The session callback will expose this, and the frontend can force sign-out
    token.error = 'RefreshTokenExpired'
    return token
  }
}
```

#### 8d. Update `session()` callback

```typescript
async session({ session, token }) {
  session.user.id = token.id as string
  session.user.roles = token.roles as string[]
  session.accessToken = token.accessToken as string
  // NEW: propagate refresh errors to the client
  if (token.error) {
    session.error = token.error as string
  }
  return session
}
```

---

### 9. Frontend — Handle Refresh Failures on the Client

When the refresh token itself expires or is revoked, `session.error` will be `'RefreshTokenExpired'`. At this point, the user genuinely must re-authenticate.

#### 9a. Create a `SessionGuard` client component

Location: `apps/frontend/src/view/client-components/SessionGuard.tsx`

```typescript
'use client'

import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      // Force sign-out — redirect to login page
      signOut({ callbackUrl: '/signin?error=session_expired' })
    }
  }, [session?.error])

  return <>{children}</>
}
```

Wrap this around the app layout (or the `SessionProvider`) so it runs on every page.

#### 9b. Update `backendRequest()` — retry on 401

Location: `apps/frontend/src/infrastructure/serverActions/baseServerAction.ts`

Currently, a 401 immediately redirects to `/signin`. With refresh tokens, a smarter approach is:

1. On 401, **don't redirect immediately**
2. Call `getServerSession()` (which triggers the `jwt` callback, which attempts the refresh)
3. Get the new `session.accessToken`
4. **Retry the original request** once with the new token
5. If the retry also returns 401, then redirect to `/signin`

This is the "transparent retry" part of the design.

```typescript
// Pseudocode for the retry logic in backendRequest()
if (res.status === 401 && redirectOn401 && !isRetry) {
  // Trigger session refresh by re-reading the session
  const refreshedSession = await getServerSession(authOptions)
  if (refreshedSession?.accessToken && !refreshedSession?.error) {
    // Retry the request with the new token
    return backendRequest({ ...options, headers: { Authorization: `Bearer ${refreshedSession.accessToken}` }, _isRetry: true })
  }
  // Refresh failed — force re-login
  redirect('/signin?error=session_expired')
}
```

#### 9c. Client-side: `useAIChat` and `DefaultChatTransport`

The AI chat hook in `apps/frontend/src/view/hooks/useAIChat.ts` attaches `session.accessToken` from `useSession()`. NextAuth's client-side `useSession()` does not automatically re-fetch on token refresh — the session is cached.

Options:
- **Option A:** Set `refetchInterval` on the `<SessionProvider>` (e.g. every 4 minutes) so the client polls for session updates and picks up the refreshed access token automatically.
- **Option B:** On a 401 response in the custom `fetch` wrapper, call `getSession()` to force a client-side session refresh, then retry.

**Recommended:** Option A is simplest and covers all client-side consumers:

```typescript
// In the root layout or provider
<SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
  {children}
</SessionProvider>
```

This means the client will poll NextAuth's `/api/auth/session` every 4 minutes, which triggers the `jwt` callback, which refreshes the backend token if needed.

---

### 10. Frontend — Logout Integration

#### 10a. Create a `logout` server action

Location: `apps/frontend/src/infrastructure/serverActions/logout.server.ts`

Before calling NextAuth's `signOut()`, call the backend `POST /auth/logout` to revoke all refresh tokens for the user. This ensures tokens are invalidated server-side, not just cleared from the cookie.

```typescript
'use server'

export async function logoutAction() {
  const token = await getAuthToken()
  if (token) {
    await backendRequest({
      method: 'POST',
      endpoint: '/auth/logout',
      headers: { Authorization: `Bearer ${token}` },
      redirectOn401: false,  // Don't redirect during logout
    })
  }
}
```

#### 10b. Update sign-out UI

Wherever sign-out is triggered, call `logoutAction()` before `signOut()`:

```typescript
async function handleSignOut() {
  await logoutAction()       // Revoke backend refresh tokens
  await signOut()            // Clear NextAuth session
}
```

---

### 11. OpenAPI Specification Updates

Update the following OpenAPI specs to reflect the new response shapes and endpoints:

| File | Change |
|------|--------|
| `packages/shared/src/openapi/paths/auth_login.json` | Add `refreshToken` and `expiresIn` to response schema |
| `packages/shared/src/openapi/paths/auth_oauth_sync.json` | Add `refreshToken` and `expiresIn` to response schema |
| NEW: `packages/shared/src/openapi/paths/auth_refresh.json` | Define `POST /auth/refresh` — request: `{ refreshToken }`, response: `{ accessToken, refreshToken, expiresIn }` |
| NEW: `packages/shared/src/openapi/paths/auth_logout.json` | Define `POST /auth/logout` — no body, requires `Authorization` header |

---

### 12. OAuth Users — Fix the `'oauth-provider'` Problem

Currently, OAuth users get `accessToken = 'oauth-provider'` — a string marker, not a real backend JWT. This likely means OAuth users cannot call any protected backend endpoint.

With the refresh token implementation, the OAuth sync flow (`POST /auth/oauth-sync`) already returns a real `access_token`. The fix is:

1. In the `signIn` callback, capture the `access_token`, `refreshToken`, and `expiresIn` from the OAuth sync response
2. Thread them into the `jwt` callback (via the module-scoped Map approach from Section 8b, or by setting them directly on the `user` object if NextAuth's typing allows it)
3. Remove the `token.accessToken = 'oauth-provider'` fallback

This means OAuth users will get real backend JWTs and participate in the same silent renewal flow as credential users.

---

## Security Considerations

### Refresh Token Storage

| Location | Security | Applicability |
|----------|----------|---------------|
| **Inside NextAuth JWT cookie** | HTTP-only, Secure, SameSite=Lax — cannot be read by client-side JavaScript | ✅ **Best option for this architecture** — refresh token stays server-side |
| HTTP-only cookie (separate) | Same security, but requires backend cookie handling | ❌ Backend is stateless/cookie-free |
| `localStorage`/`sessionStorage` | Vulnerable to XSS | ❌ Never store refresh tokens here |

**The refresh token never leaves the server.** It's stored in the NextAuth JWT cookie (which is HTTP-only) and only read in the `jwt` callback (which runs server-side). The client-side JavaScript only ever sees `session.accessToken` — never the refresh token.

### Refresh Token Rotation

Every time `POST /auth/refresh` is called:
1. The old refresh token is revoked in the database
2. A new refresh token is issued with the same `token_family`
3. The new token is stored in the NextAuth JWT cookie

If an attacker steals an old refresh token and tries to use it after the legitimate user has already refreshed:
- The old token is marked as revoked
- The backend detects this as a **replay attack**
- **The entire token family is revoked** — both the attacker's stolen token and the legitimate user's current token
- The legitimate user will be forced to re-login (which is the correct security response to a compromise)

### Timing Considerations

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Access token lifetime | 15–60 minutes (current: 60m via `JWT_EXPIRATION=3600`) | Short-lived; limits exposure window |
| Refresh token lifetime | 7 days (`REFRESH_TOKEN_EXPIRATION=604800`) | Long enough for "remember me" UX; short enough to limit risk |
| Frontend refresh buffer | 5 minutes (`ACCESS_TOKEN_BUFFER=300`) | Refresh before expiry to prevent failed requests |
| Session polling interval | 4 minutes (`refetchInterval={4 * 60}`) | Client-side: pick up refreshed tokens before expiry |

**The buffer matters:** If the access token expires at T, the `jwt` callback will start attempting refresh at T - 5min. This ensures that by the time the old token expires, a new one is already in the cookie.

---

## Audit Log Integration

All token lifecycle events should be logged to the existing audit system:

| Action | When |
|--------|------|
| `TOKEN_ISSUED` | Login or OAuth sync (initial issuance) |
| `TOKEN_REFRESHED` | Successful token refresh |
| `REFRESH_TOKEN_REPLAY_DETECTED` | Revoked token presented — potential attack |
| `REFRESH_FAMILY_REVOKED` | Entire token family revoked due to replay |
| `USER_LOGOUT` | User explicitly logged out |
| `REFRESH_TOKENS_EXPIRED_CLEANUP` | Periodic cleanup of expired tokens |

These can use the existing `AuditLogPort` and `AuditAction` enum.

---

## Files Changed (Summary)

| # | File | Action |
|---|------|--------|
| 1 | `apps/backend/src/infrastructure/database/schema.ts` | Add `refresh_tokens` table |
| 2 | `apps/backend/src/infrastructure/config/env.config.ts` | Add `REFRESH_TOKEN_EXPIRATION` env var |
| 3 | `apps/backend/src/domain/value-objects/refresh-token.ts` | New — opaque token generation + hashing |
| 4 | `apps/backend/src/domain/entities/refresh-token-record.ts` | New — refresh token record entity |
| 5 | `apps/backend/src/application/ports/refresh-token.repository.port.ts` | New — repository port interface |
| 6 | `apps/backend/src/adapters/secondary/repositories/refresh-token.repository.ts` | New — Drizzle implementation |
| 7 | `apps/backend/src/application/use-cases/refresh-access-token.use-case.ts` | New — refresh + rotate logic |
| 8 | `apps/backend/src/application/use-cases/logout.use-case.ts` | New — revoke all tokens for user |
| 9 | `apps/backend/src/application/use-cases/login-user.use-case.ts` | Add refresh token generation to return |
| 10 | `apps/backend/src/application/use-cases/register-user-with-provider.use-case.ts` | Add refresh token generation to return |
| 11 | `apps/backend/src/adapters/primary/http/auth.controller.ts` | Add `/auth/refresh`, `/auth/logout` routes; update login/oauthSync responses |
| 12 | `apps/backend/src/infrastructure/di/container/index.ts` | Wire new repository, use cases |
| 13 | `apps/backend/src/domain/audit/entity-type.enum.ts` | Add new audit actions |
| 14 | `apps/frontend/src/shared/types/next-auth.d.ts` | Add `refreshToken`, `accessTokenExp`, `error` |
| 15 | `apps/frontend/src/lib/auth/auth-config.ts` | Silent renewal in `jwt` callback; update `authorize`, `signIn`, `session` |
| 16 | `apps/frontend/src/view/client-components/SessionGuard.tsx` | New — client-side refresh failure handler |
| 17 | `apps/frontend/src/infrastructure/serverActions/baseServerAction.ts` | Add 401 retry logic |
| 18 | `apps/frontend/src/infrastructure/serverActions/logout.server.ts` | New — backend logout server action |
| 19 | Various OpenAPI specs | New/updated path definitions |

---

## Test Impact

### Backend

| Test file | Changes needed |
|-----------|----------------|
| `test/adapters/secondary/repositories/refresh-token.repository.test.ts` | New — CRUD, revocation, family revocation, expiry |
| `test/application/use-cases/refresh-access-token.use-case.test.ts` | New — happy path, expired token, revoked token, replay detection |
| `test/application/use-cases/logout.use-case.test.ts` | New — revokes all tokens |
| `test/application/use-cases/login-user.use-case.test.ts` | Update — verify refresh token is returned alongside access token |
| `test/application/use-cases/register-user-with-provider.use-case.test.ts` | Update — verify refresh token is returned |
| `test/adapters/primary/http/auth.controller.test.ts` | Update — new endpoints, updated response shapes |
| `test/schema.test.ts` | Add — `refresh_tokens` table constraints |

### Frontend

| Test file | Changes needed |
|-----------|----------------|
| `test/lib/auth/auth-config.test.ts` | Update/new — test `jwt` callback refresh logic, `session` callback error propagation |
| `test/middleware.test.ts` | Likely unchanged — middleware only checks `getToken()` presence |
| `test/infrastructure/serverActions/baseServerAction.test.ts` | Update — test 401 retry logic |
| `test/view/client-components/SessionGuard.test.ts` | New — test `signOut` on `RefreshTokenExpired` |

---

## Suggested Implementation Order

1. **Database migration** — `refresh_tokens` table
2. **Domain layer** — `RefreshToken` value object, `RefreshTokenRecord` entity
3. **Application layer** — `RefreshTokenRepositoryPort`, `RefreshAccessTokenUseCase`, `LogoutUseCase`
4. **Infrastructure layer** — `RefreshTokenRepository` (Drizzle), env config
5. **Update existing use cases** — `LoginUserUseCase`, `RegisterUserWithProviderUseCase`
6. **Controller layer** — new routes + updated responses
7. **DI container** — wire everything
8. **Backend tests** — all new and updated tests
9. **OpenAPI specs** — new and updated path definitions
10. **Frontend types** — NextAuth augmentation
11. **Frontend auth config** — silent renewal in `jwt` callback
12. **Frontend `SessionGuard`** — client-side error handler
13. **Frontend `backendRequest()`** — 401 retry logic
14. **Frontend logout** — server action + UI integration
15. **Frontend `SessionProvider`** — add `refetchInterval`
16. **Frontend tests** — all new and updated tests
17. **End-to-end validation** — full login → use → expiry → silent refresh → continued use flow

---

## Risk Mitigation

1. **Backwards compatibility**: The login/oauthSync response shape changes (new fields added). The frontend must be updated simultaneously, or existing clients will ignore the new fields (additive change, so technically backwards compatible).
2. **OAuth user breakage**: OAuth users currently get `accessToken = 'oauth-provider'` which is not a real JWT. The refresh token work is an opportunity to fix this, but it must be done carefully to avoid breaking existing OAuth sessions. Consider a migration path where old sessions without `refreshToken` gracefully degrade to the current forced-login behaviour.
3. **Concurrent refresh requests**: If multiple server actions fire simultaneously and all detect an expired token, they may all attempt to refresh. With token rotation, only the first succeeds — the rest will use a revoked token and fail. **Solution:** Add a mutex/deduplication lock in the `jwt` callback so concurrent refresh attempts are serialised.
4. **NextAuth session caching**: `getServerSession()` caches within a single request, but separate requests may see stale tokens. The retry logic in `backendRequest()` handles this.
5. **Clock skew**: The 5-minute buffer should be sufficient for any reasonable clock drift between the frontend server and the backend server.