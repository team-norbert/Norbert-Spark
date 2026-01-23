import { eq } from 'drizzle-orm'
import type { AIAdminPort } from '../../../application/ports/ai-admin.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatAiOptions } from '../../../infrastructure/database/schema.js'
import type { DBChatAiOptions } from '../../../infrastructure/database/schema.js'
import type { UUIDType } from '../../../domain/value-objects/uuid.js'
import { PutAIAdminDTO } from '../../../application/dtos/put-ai-admin.dto.js'

export class AIAdminRepository implements AIAdminPort {
  constructor(private readonly logger: LoggerPort) {}

  async getAllChatAIOptions(id: UUIDType): Promise<DBChatAiOptions | null> {
    try {
      const result = await db
        .select()
        .from(chatAiOptions)
        .where(eq(chatAiOptions.chatTypeId, id))
        .limit(1)

      return result[0] ?? null
    } catch (error) {
      this.logger.error('Error fetching chat AI options', error as Error, { id })
      throw error
    }
  }

  async putChatAIOptions(id: UUIDType, dto: PutAIAdminDTO): Promise<any> {
    // Implementation for updating chat AI options goes here
    this.logger.info(`Updating chat AI options for ID: ${id}`)
    // Placeholder return
    return Promise.resolve(null)
  }
}
