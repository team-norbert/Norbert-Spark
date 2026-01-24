import { eq } from 'drizzle-orm'
import type { AIChatOptionsPort } from '../../../application/ports/ai-chat-options.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { DBChatAiOptions } from '../../../infrastructure/database/schema.js'
import type { ChatIdType } from '../../../domain/value-objects/chatID.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatAiOptions } from '../../../infrastructure/database/schema.js'

export class AIChatOptionsRepository implements AIChatOptionsPort {
  constructor(private readonly logger: LoggerPort) {}

  async getChatOptionsByChatOptionsByChatTypeId(
    chatTypeId: ChatIdType
  ): Promise<DBChatAiOptions | null> {
    this.logger.info('Fetching chat AI options by chat type ID', { chatTypeId })

    try {
      const result = await db
        .select()
        .from(chatAiOptions)
        .where(eq(chatAiOptions.chatTypeId, chatTypeId))
        .limit(1)

      return result[0] ?? null
    } catch (error) {
      this.logger.error('Error fetching chat AI options', error as Error, { chatTypeId })
      throw error
    }
  }
}
