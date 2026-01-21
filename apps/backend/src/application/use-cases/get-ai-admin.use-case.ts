import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'

export class GetAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  async execute(id: UUIDType, auditContext: AuditContext): Promise<DBChatAiOptions | null> {
    this.logger.info('Executing GetAirAdminUseCase')

    const result: DBChatAiOptions | null = await this.aiAdminPort.getAllChatAIOptions(id)

    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: id,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_db_chat_options_retrieved',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for chat admin retrieval', error as Error, {
        userId: auditContext.userId,
      })
    }

    return result
  }
}
