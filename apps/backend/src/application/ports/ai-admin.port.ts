import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { PutAIAdminDTO } from '../dtos/put-ai-admin.dto.js'
import type { PostAIAdminDTO } from '../dtos/post-ai-admin.dto.js'

export interface AIAdminPort {
  getAllChatAIOptions(id: UUIDType): Promise<DBChatAiOptions | null>
  putChatAIOptions(id: UUIDType, dto: PutAIAdminDTO): Promise<DBChatAiOptions | null>
  createChatAIOptions(id: UUIDType, dto: PostAIAdminDTO): Promise<DBChatAiOptions | null>
}
