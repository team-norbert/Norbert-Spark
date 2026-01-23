import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import { PutAIAdminDTO } from '../dtos/put-ai-admin.dto.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'

export interface AIAdminPort {
  getAllChatAIOptions(id: UUIDType): Promise<DBChatAiOptions | null>
  putChatAIOptions(
    id: UUIDType,
    dto: PutAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null>
}
