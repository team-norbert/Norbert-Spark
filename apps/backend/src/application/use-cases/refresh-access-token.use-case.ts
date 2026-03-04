import crypto from 'node:crypto'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { User } from '../../domain/entities/user.js'
import { RefreshToken } from '../../domain/value-objects/refreshToken.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import { Uuid } from '../../domain/value-objects/uuid.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'
import { UnauthorizedException } from '../../shared/exceptions/unauthorized.exception.js'
import type { JwtUserClaims } from '../../shared/types/index.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../ports/token-generator.port.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'

/**
 * Use case for refreshing JWT access tokens using a valid refresh token.
 *
 * Implements token rotation security pattern:
 * - Each refresh invalidates the old refresh token and issues a new one
 * - All tokens in a family share the same tokenFamily UUID
 * - If a revoked token is reused (replay attack), the entire family is revoked
 *
 * Security features:
 * - Opaque refresh tokens (64-char hex, SHA-256 hashed in database)
 * - Token family tracking for replay attack detection
 * - Automatic expiration checking (default 7 days)
 * - Comprehensive audit logging for security events
 * - IP address and user agent tracking
 *
 * @example
 * ```typescript
 * const useCase = new RefreshAccessTokenUseCase(
 *   logger,
 *   auditLog,
 *   refreshTokenRepo,
 *   userRepo,
 *   tokenGenerator
 * )
 *
 * const result = await useCase.execute(
 *   'a1b2c3...', // 64-char hex refresh token from client
 *   { userId: null, ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0...' }
 * )
 * // Returns: { accessToken: 'jwt...', refreshToken: 'new64char...', expiresInSeconds: number }
 * ```
 */
export class RefreshAccessTokenUseCase {
  /**
   * Creates a new RefreshAccessTokenUseCase.
   *
   * @param logger - Logger for tracking execution flow and errors
   * @param auditLog - Audit log for recording security events (replay attacks, successful refreshes)
   * @param refreshTokenRepo - Repository for refresh token CRUD operations
   * @param userRepo - Repository for loading user data by ID
   * @param tokenGenerator - Service for generating new JWT access tokens
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly tokenGenerator: TokenGeneratorPort
  ) {}

  /**
   * Refreshes an access token using a valid refresh token.
   *
   * Token rotation flow:
   * 1. Hash the incoming token using SHA-256
   * 2. Look up token record in database by hash
   * 3. Validate token (not revoked, not expired, user exists)
   * 4. If revoked → REPLAY ATTACK: revoke entire token family and audit log
   * 5. If valid → revoke current token, load user, generate new tokens
   * 6. Store new refresh token with SAME tokenFamily (enables rotation tracking)
   * 7. Audit log successful refresh
   * 8. Return new access token, new refresh token, and expiration time in seconds
   *
   * Security guarantees:
   * - Only valid (non-revoked, non-expired) tokens can be refreshed
   * - Each refresh invalidates the old token (single-use tokens)
   * - Replay attacks trigger family-wide revocation
   * - All security events are audit logged with IP/user agent
   *
   * @param rawRefreshToken - 64-character hexadecimal refresh token from client (e.g., from cookie or Authorization header)
   * @param auditContext - Context containing IP address, user agent, and current user ID for audit trail
   * @returns Promise resolving to object with new access token (JWT), new refresh token (64-char hex), and expiration time in seconds
   *
   * @throws {ValidationException} If rawRefreshToken format is invalid (not 64-char hex)
   * @throws {UnauthorizedException} If token not found in database
   * @throws {UnauthorizedException} If token has been revoked (also revokes entire family)
   * @throws {UnauthorizedException} If token has expired
   * @throws {UnauthorizedException} If user associated with token no longer exists
   *
   * @example
   * ```typescript
   * try {
   *   const result = await useCase.execute(
   *     'abc123...', // 64-char hex from client
   *     { userId: null, ipAddress: req.ip, userAgent: req.headers['user-agent'] }
   *   )
   *   // Set new tokens in response
   *   res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: true })
   *   res.json({ accessToken: result.accessToken, expiresInSeconds: result.expiresInSeconds })
   * } catch (error) {
   *   if (error instanceof UnauthorizedException) {
   *     // Handle invalid/expired token
   *     res.status(401).json({ error: error.message })
   *   }
   * }
   * ```
   */
  async execute(
    rawRefreshToken: string,
    auditContext: AuditContext
  ): Promise<{ accessToken: string; refreshToken: string; expiresInSeconds: number }> {
    this.logger.info('Executing RefreshAccessTokenUseCase', {
      tokenHash: crypto.createHash('sha256').update(rawRefreshToken).digest('hex'),
    })
    try {
      const token = RefreshToken.fromRaw(rawRefreshToken)
      const record = await this.refreshTokenRepo.findByHash(token.getHash())
      if (!record) {
        throw new UnauthorizedException('Invalid refresh token')
      }
      if (record.isRevoked()) {
        const auditEntry: CreateAuditLogDTO = {
          userId: record.getUserId(),
          entityType: EntityType.TOKEN,
          entityId: new Uuid(record.getTokenFamily()).getValue(),
          action: AuditAction.REFRESH_TOKEN_REPLAY_DETECTED,
          changes: {
            reason: 'refresh_token_replay_detected',
          },
          ipAddress: auditContext.ipAddress ?? undefined,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)
        try {
          // Store the refresh token in the database
          await this.refreshTokenRepo.revokeFamily(record.getTokenFamily())
        } catch (err) {
          this.logger.error('Fail', err instanceof Error ? err : new Error(String(err)), {
            userId: auditContext.userId,
          })
          const auditEntry: CreateAuditLogDTO = {
            userId: record.getUserId(),
            entityType: EntityType.TOKEN,
            entityId: new Uuid(record.getTokenFamily()).getValue(),
            action: AuditAction.REFRESH_FAMILY_REVOKED,
            changes: {
              reason: 'refresh_token_storage_failed',
            },
            ipAddress: auditContext.ipAddress ?? undefined,
            userAgent: auditContext.userAgent ?? undefined,
          }
          // AuditLogPort.log() never throws per contract
          await this.auditLog.log(auditEntry)
          throw new InternalErrorException(
            'Failed to revoke token family after replay attack detected'
          )
        } finally {
          const auditEntry: CreateAuditLogDTO = {
            userId: record.getUserId(),
            entityType: EntityType.TOKEN,
            entityId: new Uuid(record.getTokenFamily()).getValue(),
            action: AuditAction.REFRESH_FAMILY_REVOKED,
            changes: {
              reason: 'refresh_token_stored',
            },
            ipAddress: auditContext.ipAddress ?? undefined,
            userAgent: auditContext.userAgent ?? undefined,
          }
          // AuditLogPort.log() never throws per contract
          await this.auditLog.log(auditEntry)
        }
      }

      if (record.isExpired()) {
        throw new UnauthorizedException('Refresh token expired')
      }

      /**
       * 6. Token is valid:
       *    a. Revoke the current token (revokeByHash)
       *    b. Load user from UserRepositoryPort.findById(record.userId)
       *    c. Generate new access token via TokenGeneratorPort.generateToken()
       *    d. Generate new refresh token (RefreshToken.generate())
       *    e. Store new refresh token with SAME tokenFamily
       *    f. Audit log: 'TOKEN_REFRESHED'
       *    g. Return { accessToken, refreshToken: newToken.getRawToken(), expiresInSeconds }
       */

      await this.refreshTokenRepo.revokeByHash(token.getHash())
      const user: User | null = await this.userRepo.findById(record.getUserId())

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      const jwtUserClaims: JwtUserClaims = {
        sub: user.id as UserIdType,
        email: user.getEmail(),
        roles: [user.getRole()],
      }

      const newlyGeneratedAccessToken = this.tokenGenerator.generateToken(jwtUserClaims)

      // d. Generate new refresh token (RefreshToken.generate())
      const newRefreshToken = RefreshToken.generate()

      // e. Store new refresh token with SAME tokenFamily
      const parsedExpiration = Number.parseInt(EnvConfig.REFRESH_TOKEN_EXPIRATION, 10)
      const expiresInSeconds = Number.isNaN(parsedExpiration)
        ? 7 * 24 * 60 * 60 // default 7 days in seconds
        : parsedExpiration
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

      try {
        // Store the refresh token in the database
        await this.refreshTokenRepo.create({
          userId: record.getUserId(),
          tokenHash: newRefreshToken.getHash(),
          tokenFamily: record.getTokenFamily(),
          expiresAt,
          ipAddress: auditContext.ipAddress ?? undefined,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (err) {
        this.logger.error(
          'Failed to store refresh token',
          err instanceof Error ? err : new Error(String(err)),
          {
            userId: user.id as UserIdType,
            email: user.getEmail(),
          }
        )
        const auditEntry: CreateAuditLogDTO = {
          userId: record.getUserId(),
          entityType: EntityType.TOKEN,
          entityId: new Uuid(record.getTokenFamily()).getValue(),
          action: AuditAction.TOKEN_REFRESHED,
          changes: {
            reason: 'refresh_token_storage_failed',
          },
          ipAddress: auditContext.ipAddress ?? undefined,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)
        throw new InternalErrorException('Failed to store refresh token')
      } finally {
        const auditEntry: CreateAuditLogDTO = {
          userId: record.getUserId(),
          entityType: EntityType.TOKEN,
          entityId: new Uuid(record.getTokenFamily()).getValue(),
          action: AuditAction.TOKEN_REFRESHED,
          changes: {
            reason: 'refresh_token_stored',
          },
          ipAddress: auditContext.ipAddress ?? undefined,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)
      }

      return {
        accessToken: newlyGeneratedAccessToken,
        refreshToken: newRefreshToken.getRawToken(),
        expiresInSeconds,
      }
    } catch (error) {
      this.logger.error(
        'Failed to refresh access token',
        error instanceof Error ? error : new Error(String(error)),
        { tokenHash: crypto.createHash('sha256').update(rawRefreshToken).digest('hex') }
      )
      throw error
    }
  }
}
