import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { PutChatTypeDto } from '../dtos/put-chat-type.dto.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UpdateChanges } from '../../domain/audit/audit-changes.types.js'
import type { QueryResult } from 'pg'

export class PutChatDetailsUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  async execute(auditContext: AuditContext, details: PutChatTypeDto): Promise<QueryResult | null> {
    this.logger.info(`Executing PutChatDetailsUseCase for id: ${details.id}`)
    this.logger.debug(`Received details to update: ${JSON.stringify(details)}`)

    const result = await this.aiChatContent.putChatTypeDetails(details)

    if (result) {
      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: details.id,
        action: AuditAction.UPDATE,
        changes: {
          after: {
            id: details.id,
            name: details.name,
            seoFriendlyId: details.seoFriendlyId,
            description: details.description,
          },
          reason: 'update_successful',
        } satisfies UpdateChanges,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    }

    if (!result) {
      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: details.id,
        action: AuditAction.UPDATE,
        changes: {
          after: {
            id: details.id,
            name: details.name,
            seoFriendlyId: details.seoFriendlyId,
            description: details.description,
          },
          reason: 'update_unsuccessful',
        } satisfies UpdateChanges,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    }

    return result
  }
}
