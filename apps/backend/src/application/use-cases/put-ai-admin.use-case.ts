import type { LoggerPort } from '../ports/logger.port.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'

export class PutAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  async execute(id: UUIDType, auditContext: AuditContext): Promise<any> {
    this.logger.info(`Executing PutAIAdminUseCase for ID: ${id}`)
    // Placeholder return
    return Promise.resolve(null)
  }
}
