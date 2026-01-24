import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'

export interface AIChatOptionsPort {
  getChatOptionsByChatTypeId(
    chatTypeId: ChatIdType
  ): Promise<Pick<DBChatAiOptions, 'prompt'> | null>
}
