import type { UIMessage } from 'ai'

import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'

export interface ChatWithType {
  id: ChatIdType
  chatTypeId: ChatIdType
  seoFriendlyId: string
}

export interface AIServicePort {
  getChatResponse(chatId: ChatIdType): Promise<ChatResponseResult | null>
  createChat(
    chatId: ChatIdType,
    userId: UserIdType,
    chatTypeId: ChatIdType,
    initialMessages: UIMessage[]
  ): Promise<string>
  appendToChatMessages(chatId: ChatIdType, messages: UIMessage[]): Promise<string>
  getChatsByUserId(userId: UserIdType): Promise<ChatWithType[]>
  getAIChatByChatId(chatId: ChatIdType): Promise<ChatResponseResult | null>
}
