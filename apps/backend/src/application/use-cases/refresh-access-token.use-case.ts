import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { User } from '../../domain/entities/user.js'
import { RefreshToken } from '../../domain/value-objects/refreshToken.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import { Uuid } from '../../domain/value-objects/uuid.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { UnauthorizedException } from '../../shared/exceptions/unauthorized.exception.js'
import type { JwtUserClaims } from '../../shared/types/index.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../ports/token-generator.port.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'

export class RefreshAccessTokenUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly tokenGenerator: TokenGeneratorPort
  ) {}

  /**
   * Input: rawRefreshToken (string from request body)
   *
   * 1. Hash the incoming token → SHA-256
   * 2. Look up the hash in DB via RefreshTokenRepositoryPort.findByHash()
   * 3. If not found → throw UnauthorizedException('Invalid refresh token')
   * 4. If found but revoked → REPLAY ATTACK detected
   *    → revokeFamily(record.tokenFamily)  // Revoke ALL in the family
   *    → audit log: 'REFRESH_TOKEN_REPLAY_DETECTED'
   *    → throw UnauthorizedException('Token has been revoked')
   * 5. If found but expired → throw UnauthorizedException('Refresh token expired')
   * 6. Token is valid:
   *    a. Revoke the current token (revokeByHash)
   *    b. Load user from UserRepositoryPort.findById(record.userId)
   *    c. Generate new access token via TokenGeneratorPort.generateToken()
   *    d. Generate new refresh token (RefreshToken.generate())
   *    e. Store new refresh token with SAME tokenFamily
   *    f. Audit log: 'TOKEN_REFRESHED'
   *    g. Return { accessToken, refreshToken: newToken.getRawToken(), expiresIn }
   */

  async execute(
    rawRefreshToken: string,
    auditContext: AuditContext
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: Date }> {
    this.logger.info('Executing RefreshAccessTokenUseCase', { rawRefreshToken })
    try {
      const token = RefreshToken.fromRaw(rawRefreshToken)
      const record = await this.refreshTokenRepo.findByHash(token.getHash())
      if (!record) {
        throw new UnauthorizedException('Invalid refresh token')
      }
      if (record.isRevoked()) {
        await this.refreshTokenRepo.revokeFamily(record.getTokenFamily())
        const auditEntry: CreateAuditLogDTO = {
          userId: record.getUserId(),
          entityType: EntityType.TOKEN,
          entityId: new Uuid(record.getUserId()).getValue(),
          action: AuditAction.UPDATE,
          changes: {
            reason: 'refresh_token_replay_detected',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)
        throw new UnauthorizedException('Token has been revoked')
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
       *    g. Return { accessToken, refreshToken: newToken.getRawToken(), expiresIn }
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
      const expiresInSeconds = parseInt(EnvConfig.REFRESH_TOKEN_EXPIRATION, 10)
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

      await this.refreshTokenRepo.create({
        userId: user.id as UserIdType,
        tokenHash: newRefreshToken.getHash(),
        tokenFamily: record.getTokenFamily(),
        expiresAt,
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
      })

      const auditEntry: CreateAuditLogDTO = {
        userId: record.getUserId(),
        entityType: EntityType.TOKEN,
        entityId: new Uuid(record.getUserId()).getValue(),
        action: AuditAction.UPDATE,
        changes: {
          reason: 'token_refreshed',
        },
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)

      return {
        accessToken: newlyGeneratedAccessToken,
        refreshToken: newRefreshToken.getRawToken(),
        expiresIn: expiresAt,
      }
    } catch (error) {
      this.logger.error(
        'Failed to refresh access token',
        error instanceof Error ? error : new Error(String(error)),
        { rawRefreshToken }
      )
      throw error
    }
  }
}
