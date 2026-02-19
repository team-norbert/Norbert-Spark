import type { LoggerPort } from '../ports/logger.port.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { PostAIAdminDTO } from '../dtos/post-ai-admin.dto.js'

export class PostAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  async execute(
    id: UUIDType,
    dto: PostAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null> {
    this.logger.info(`Executing PutAIAdminUseCase for ID: ${id}`)

    try {
      const result = await this.aiAdminPort.createChatAIOptions(id, dto)

      // Log successful audit
      await this.logAudit(id, auditContext, 'chat_ai_options_create')

      return result
    } catch (error) {
      // Log failed audit
      await this.logAudit(id, auditContext, 'chat_ai_options_create_failed')

      throw error
    }
  }

  private async logAudit(id: UUIDType, auditContext: AuditContext, reason: string): Promise<void> {
    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.AI_OPTIONS,
      entityId: id,
      action: AuditAction.CREATE,
      changes: {
        reason,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)
  }
}
