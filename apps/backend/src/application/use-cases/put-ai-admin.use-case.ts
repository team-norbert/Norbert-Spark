import type { LoggerPort } from '../ports/logger.port.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { PutAIAdminDTO } from '../dtos/put-ai-admin.dto.js'

export class PutAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  async execute(
    id: UUIDType,
    dto: PutAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null> {
    this.logger.info(`Executing PutAIAdminUseCase for ID: ${id}`)

    try {
      const result = await this.aiAdminPort.putChatAIOptions(id, dto)

      // Log successful audit
      await this.logAudit(id, auditContext, 'chat_ai_options_updated')

      return result
    } catch (error) {
      // Log failed audit
      await this.logAudit(id, auditContext, 'chat_ai_options_update_failed')

      throw error
    }
  }

  private async logAudit(id: UUIDType, auditContext: AuditContext, reason: string): Promise<void> {
    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: id,
        action: AuditAction.UPDATE,
        changes: {
          reason,
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for chat AI options update', error as Error, {
        userId: auditContext.userId,
      })
    }
  }
}
