import { uuidv7 } from 'uuidv7'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port.js'

export class LogOutUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort
  ) {}

  async execute(userId: UserIdType, auditContext: AuditContext): Promise<void> {
    this.logger.info(`Executing LogOutUseCase for user ID: ${userId}`)

    try {
      await this.refreshTokenRepo.revokeAllForUser(auditContext.userId as UserIdType)

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.TOKEN,
        entityId: uuidv7(), // No specific token ID, so we generate a random UUID for logging
        action: AuditAction.USER_LOGOUT,
        changes: {
          reason: 'refresh_token_replay_detected',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    } catch (error) {
      this.logger.error(
        `Error executing LogOutUseCase for user ID: ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      )

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.TOKEN,
        entityId: uuidv7(), // No specific token ID, so we generate a random UUID for logging
        action: AuditAction.USER_LOGOUT,
        changes: {
          reason: 'refresh_token_replay_detected',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    }
  }
}
