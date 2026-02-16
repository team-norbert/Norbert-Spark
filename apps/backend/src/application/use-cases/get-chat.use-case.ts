import type { AIServicePort } from '../ports/ai.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { MessageSchemaType } from '@norberts-spark/shared'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { FetchChatChanges } from '../../domain/audit/audit-changes.types.js'
/**
 * Use case for retrieving chat messages for a specific user
 *
 * This use case handles the retrieval of chat messages and their associated parts
 * from the database. It validates the user ID format before querying the repository.
 *
 * @class GetChatUseCase
 * @example
 * ```typescript
 * const useCase = new GetChatUseCase(aiRepository, logger)
 * const result = await useCase.execute('01943e6d-1234-7890-abcd-1234567890ab')
 * ```
 */
export class GetChatUseCase {
  /**
   * Creates an instance of GetChatUseCase
   * @param {AIServicePort} aiService - Service for handling AI-related operations
   * @param {LoggerPort} logger - Logger for tracking operations
   * @param {AuditLogPort} auditLog - Audit logging service for recording user registration events
   */
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  /**
   * Executes the get chat use case
   *
   * Validates the user ID format (must be UUID v7) and retrieves all chat messages
   * and their associated parts for the given user.
   *
   * @param chatID
   * @param messages
   * @param auditContext
   * @returns {Promise<ChatResponseResult | null>} Chat messages with parts, or null if not found
   * @throws {ValidationException} If the userId is not a valid UUID v7
   * @example
   * ```typescript
   * try {
   *   const chatData = await useCase.execute('01943e6d-1234-7890-abcd-1234567890ab')
   *   if (chatData) {
   *     console.log(`Found ${chatData.length} messages`)
   *   }
   * } catch (error) {
   *   if (error instanceof ValidationException) {
   *     console.error('Invalid user ID format')
   *   }
   * }
   * ```
   */
  async execute(
    chatID: ChatIdType,
    messages: MessageSchemaType[] = [],
    auditContext: AuditContext
  ): Promise<ChatResponseResult | null> {
    this.logger.info('Getting chat', { chatID })

    // Retrieve chat data from DB
    const chatData = await this.aiService.getChatResponse(chatID)

    if (chatData && chatData.length > 0) {
      this.logger.info('Chat data retrieved successfully', {
        chatID,
        messageCount: chatData.length,
      })

      try {
        const auditEntry: CreateAuditLogDTO = {
          userId: auditContext.userId,
          entityType: EntityType.CHAT,
          entityId: chatID,
          action: AuditAction.FETCH,
          changes: {
            chatIds: chatData.map((chat) => chat.chat.id),
            reason: 'chat_successfully_retrieved',
          } satisfies FetchChatChanges,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        }
        await this.auditLog.log(auditEntry)
      } catch (error) {
        this.logger.error('Error logging audit for chat retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
    } else {
      this.logger.info('No chat data found for user', { chatID })
      return null
    }

    return chatData
  }
}
