import type { components } from '@norberts-spark/shared/openapi-types'
import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { LoginUserDto } from '../../../application/dtos/login-user.dto.js'
import { OAuthSyncDto } from '../../../application/dtos/oauth-sync.dto.js'
import { PostRefreshDTO } from '../../../application/dtos/post-refresh.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { LogOutUseCase } from '../../../application/use-cases/log-out.use-case.js'
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case.js'
import { RefreshAccessTokenUseCase } from '../../../application/use-cases/refresh-access-token.use-case.js'
import { RegisterUserWithProviderUseCase } from '../../../application/use-cases/register-user-with-provider.use-case.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { oauthSyncAuthMiddleware } from '../../../infrastructure/http/middleware/auth-sync-auth.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { safelyMaskIp } from '../../../shared/utils/mask-ip.js'
/**
 * HTTP controller for authentication endpoints.
 *
 * Handles authentication-related HTTP requests in the Fastify application.
 * Acts as a primary adapter in the Hexagonal Architecture, translating HTTP
 * requests into application use case calls and formatting responses.
 *
 * @class
 *
 * @remarks
 * This controller is part of the Ports & Adapters architecture, serving as
 * a primary (driving) adapter that receives external requests and delegates
 * business logic to application use cases. It handles:
 * - HTTP request validation and DTO conversion
 * - Use case orchestration
 * - HTTP response formatting (success and error cases)
 * - Exception translation to appropriate HTTP status codes
 *
 * Routes registered:
 * - `POST /auth/login`      — Credential-based authentication (public)
 * - `POST /auth/oauth-sync` — OAuth user synchronisation (shared-secret protected)
 * - `POST /auth/refresh`    — Access token rotation via refresh token (public)
 * - `POST /auth/logout`     — Revoke all refresh tokens (JWT protected)
 *
 * Uniform response envelope:
 * - Success: `{ success: true,  data:  { ... } }`
 * - Error:   `{ success: false, error: "message" }`
 *
 * @example
 * ```typescript
 * const authController = new AuthController(
 *   logger,
 *   loginUserUseCase,
 *   registerUserWithProviderUseCase,
 *   refreshAccessTokenUseCase,
 *   logOutUseCase,
 * )
 * authController.registerRoutes(app)
 * // POST /auth/login, /auth/oauth-sync, /auth/refresh, /auth/logout now available
 * ```
 *
 * @see {@link LoginUserUseCase} for credential authentication logic
 * @see {@link RegisterUserWithProviderUseCase} for OAuth user synchronisation logic
 * @see {@link RefreshAccessTokenUseCase} for token rotation logic
 * @see {@link LogOutUseCase} for session revocation logic
 */
export class AuthController {
  /**
   * Creates a new AuthController instance.
   *
   * @param logger - Structured logger for recording handler activity and errors.
   * @param loginUserUseCase - Use case that validates credentials and issues tokens.
   * @param registerUserWithProviderUseCase - Use case that upserts OAuth-provider users.
   * @param refreshAccessTokenUseCase - Use case that rotates an existing refresh token.
   * @param logOutUseCase - Use case that revokes all refresh tokens for a user.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly registerUserWithProviderUseCase: RegisterUserWithProviderUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly logOutUseCase: LogOutUseCase
  ) {}

  /**
   * Registers all authentication routes with the Fastify application.
   *
   * Binds the four `POST /auth/*` endpoints to their handler methods.
   * Route-level middleware is applied where required:
   * - `/auth/oauth-sync` requires the `oauthSyncAuthMiddleware` shared-secret check.
   * - `/auth/logout` requires the `authMiddleware` JWT bearer check.
   *
   * @param app - Fastify application instance to register routes on.
   * @returns {void}
   *
   * @example
   * ```typescript
   * import Fastify from 'fastify'
   * const app = Fastify()
   * authController.registerRoutes(app)
   * await app.listen({ port: 3001 })
   * // POST /auth/login, /auth/oauth-sync, /auth/refresh, /auth/logout available
   * ```
   */
  registerRoutes(app: FastifyInstance): void {
    app.post('/auth/login', this.login.bind(this))
    app.post('/auth/oauth-sync', { preHandler: oauthSyncAuthMiddleware }, this.oauthSync.bind(this))
    app.post('/auth/refresh', this.refresh.bind(this))
    app.post('/auth/logout', { preHandler: authMiddleware }, this.logout.bind(this))
  }

  /**
   * Logs out the authenticated user by revoking all their refresh tokens.
   *
   * This endpoint implements a "log out from all devices" pattern — every
   * refresh token associated with the calling user is invalidated immediately.
   * The user's current access token will remain valid until it naturally expires
   * (short-lived by design), but no new access tokens can be obtained without
   * re-authenticating.
   *
   * **Security:** Protected by `authMiddleware`. The request must carry a valid
   * JWT bearer token; the user ID is read from `request.user.sub`.
   *
   * @async
   * @param request - Fastify request. `request.user.sub` must be set by `authMiddleware`.
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns {Promise<void>} Resolves once the response has been sent.
   *
   * @remarks
   * Success response (200):
   * ```json
   * { "success": true, "data": { "message": "Logged out" } }
   * ```
   *
   * Error responses:
   * - `401` — JWT missing or invalid (rejected by `authMiddleware` before reaching this handler).
   * - `4xx` — Any `BaseException` thrown by the logout use case is returned with its own `statusCode`
   *   (for example, `401`, `403`, `404`), along with an error message.
   * - `500` — Token revocation failed due to an unexpected server error.
   *
   * Error response format:
   * ```json
   * { "success": false, "error": "Failed to log out user" }
   * ```
   *
   * @example
   * ```http
   * POST /auth/logout
   * Authorization: Bearer <accessToken>
   *
   * HTTP/1.1 200 OK
   * { "success": true, "data": { "message": "Logged out" } }
   * ```
   *
   * @see {@link LogOutUseCase.execute} for token revocation logic
   * @see {@link authMiddleware} for JWT verification
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: safelyMaskIp(request.ip),
        userAgent: request.headers['user-agent'] ?? null,
      }

      const userId = request.user?.sub
      await this.logOutUseCase.execute(userId!, auditContext)

      reply.code(200).send({
        success: true,
        data: {
          message: 'Logged out',
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in logout handler',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to log out user due to a database error'
          : err?.message || 'Failed to log out user due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Issues a new access token and rotated refresh token in exchange for a valid refresh token.
   *
   * Implements refresh token rotation: the supplied refresh token is consumed and
   * a brand-new refresh token is returned alongside a fresh access token. The old
   * refresh token is invalidated immediately, so it cannot be reused.
   *
   * **Security:** This endpoint is public (no JWT required). Authentication is
   * proved solely by possession of a valid, unexpired, non-revoked refresh token.
   * Reuse of an already-consumed token is treated as a potential replay attack and
   * results in a `401` response.
   *
   * @async
   * @param request - Fastify request. Body must conform to `RefreshTokenRequest`
   *   (`{ refreshToken: string }` — a 64-character hexadecimal string).
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns {Promise<void>} Resolves once the response has been sent.
   *
   * @remarks
   * Success response (200):
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "accessToken": "<JWT>",
   *     "refreshToken": "<64-char hex>",
   *     "expiresInSeconds": 604800
   *   }
   * }
   * ```
   *
   * Error responses:
   * - `400` — `refreshToken` is missing, not a string, or not a 64-character hex value
   *   (thrown by {@link PostRefreshDTO.validate}).
   * - `401` — Refresh token not found, already consumed, or expired
   *   (thrown by {@link RefreshAccessTokenUseCase}).
   * - `500` — Database error or unexpected exception.
   *
   * Error response format:
   * ```json
   * { "success": false, "error": "<message>" }
   * ```
   *
   * @example
   * ```http
   * POST /auth/refresh
   * Content-Type: application/json
   *
   * { "refreshToken": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
   *
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "accessToken": "eyJhbGci...",
   *     "refreshToken": "a1b2c3d4...",
   *     "expiresInSeconds": 604800
   *   }
   * }
   * ```
   *
   * @see {@link PostRefreshDTO.validate} for request body validation
   * @see {@link RefreshAccessTokenUseCase.execute} for token rotation logic
   */
  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: safelyMaskIp(request.ip),
        userAgent: request.headers['user-agent'] ?? null,
      }

      const body = request.body as components['schemas']['RefreshTokenRequest']

      const dto = PostRefreshDTO.validate(body)

      const result = await this.refreshAccessTokenUseCase.execute(dto.refreshToken, auditContext)

      reply.code(200).send({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresInSeconds: result.expiresInSeconds,
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in refresh handler',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to refresh authentication token due to a database error'
          : err?.message || 'Failed to refresh authentication token due to an internal server error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Handles user login requests
   *
   * Authenticates users by validating credentials and generating JWT access tokens.
   * Validates request body, executes login use case, and formats the response
   * with appropriate HTTP status codes.
   *
   * @async
   * @param {FastifyRequest} request - Fastify request object with login credentials in body
   * @param {FastifyReply} reply - Fastify reply object for sending HTTP response
   * @returns {Promise<void>} Resolves when response is sent
   *
   * @remarks
   * Request body should contain:
   * - `email` (string): User's email address
   * - `password` (string): User's password
   *
   * Success response (200):
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "userId": "uuid",
   *     "email": "user@example.com",
   *     "accessToken": "jwt_token",
   *     "roles": ["user"]
   *   }
   * }
   * ```
   *
   * Error responses:
   * - 400: Validation error (invalid request body)
   * - 401: Unauthorized (invalid credentials)
   * - 500: Internal server error
   *
   * Error response format:
   * ```json
   * {
   *   "success": false,
   *   "error": "Error message"
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Successful login request
   * // POST /auth/login
   * // Body: { "email": "user@example.com", "password": "password123" }
   *
   * // Response:
   * // Status: 200
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "userId": "550e8400-e29b-41d4-a716-446655440000",
   * //     "email": "user@example.com",
   * //     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   * //     "roles": ["user"]
   * //   }
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Failed login request - invalid credentials
   * // POST /auth/login
   * // Body: { "email": "user@example.com", "password": "wrongPassword" }
   *
   * // Response:
   * // Status: 401
   * // {
   * //   "success": false,
   * //   "error": "Invalid email or password"
   * // }
   * ```
   *
   * @see {@link LoginUserDto.validate} for request body validation
   * @see {@link LoginUserUseCase.execute} for authentication logic
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as components['schemas']['UserLoginRequest']
      // Convert HTTP request to DTO
      const dto = LoginUserDto.validate(body)

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: safelyMaskIp(request.ip),
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Execute use case
      const result = await this.loginUserUseCase.execute(dto, auditContext)

      // Convert result to HTTP response
      reply.code(200).send({
        success: true,
        data: {
          userId: result.userId,
          email: result.email,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresInSeconds: result.expiresInSeconds,
          roles: result.roles,
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in login handler',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to authenticate user due to a database error'
          : err?.message || 'Failed to authenticate user due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Handles OAuth user synchronization
   *
   * Creates or updates user records for OAuth-authenticated users (Google, GitHub, etc.)
   * This endpoint is called by the frontend NextAuth callback to ensure OAuth users
   * are stored in the backend database for consistency with credentials users.
   * **Security:** This endpoint is protected by the oauthSyncAuthMiddleware, which requires
   * a valid shared secret in the X-OAuth-Sync-Secret header to prevent unauthorized access.
   *
   * @async
   * @param {FastifyRequest} request - Fastify request with OAuth user data in body
   * @param {FastifyReply} reply - Fastify reply object for sending HTTP response
   * @returns {Promise<void>} Resolves when response is sent
   *
   * @remarks
   * Request headers must include:
   * - `X-OAuth-Sync-Secret`: Shared secret matching OAUTH_SYNC_SECRET environment variable
   *
   * Request body should contain:
   * - `provider` (string): OAuth provider name (e.g., 'google')
   * - `providerId` (string): User ID from OAuth provider
   * - `email` (string): User's email address (must be valid email format)
   * - `name` (string, optional): User's display name
   *
   * Success response (200):
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "userId": "...",
   *     "email": "user@example.com",
   *     "accessToken": "...",
   *     "refreshToken": "...",
   *     "expiresInSeconds": 604800,
   *     "roles": ["user"]
   *   }
   * }
   * ```
   *
   * Error responses:
   * - 401: Unauthorized (invalid or missing shared secret)
   * - 400: Validation error (invalid request body)
   * - 500: Internal server error
   *
   * This is a simple implementation that logs the sync request.
   *
   * @see {@link OAuthSyncDto.validate} for request body validation
   * @see {@link oauthSyncAuthMiddleware} for authentication implementation
   */
  async oauthSync(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      request.log.info({ body: request.body }, 'OAuth sync request received')

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: safelyMaskIp(request.ip),
        userAgent: request.headers['user-agent'] ?? null,
      }

      const body = request.body as components['schemas']['OAuthSyncRequest']

      const dto = OAuthSyncDto.validate(body)

      const result = await this.registerUserWithProviderUseCase.execute(dto, auditContext)

      reply.code(200).send({
        success: true,
        data: {
          userId: result.userId,
          email: result.email,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresInSeconds: result.expiresInSeconds,
          roles: result.roles,
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in OAuth sync handler',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to sync OAuth user due to a database error'
          : err instanceof BaseException && err.message
            ? err.message
            : 'OAuth sync failed'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
