import { eq } from 'drizzle-orm'

import type { AIChatOptionsPort } from '../../../application/ports/ai-chat-options.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { ChatIdType } from '../../../domain/value-objects/chatID.js'
import { db } from '../../../infrastructure/database/index.js'
import type { DBChatAiOptions } from '../../../infrastructure/database/schema.js'
import { chatAiOptions } from '../../../infrastructure/database/schema.js'

/**
 * Repository for managing AI chat options data access
 *
 * This repository handles retrieval of AI configuration options (system prompts,
 * model parameters) associated with specific chat types. It implements the
 * AIChatOptionsPort interface, following the hexagonal architecture pattern
 * by abstracting database operations from the application layer.
 *
 * @implements {AIChatOptionsPort}
 *
 * @example
 * ```typescript
 * const repository = new AIChatOptionsRepository(logger)
 * const options = await repository.getChatOptionsByChatOptionsByChatTypeId(chatTypeId)
 * if (options) {
 *   console.log('System prompt:', options.prompt)
 * }
 * ```
 */
export class AIChatOptionsRepository implements AIChatOptionsPort {
  /**
   * Creates an instance of AIChatOptionsRepository
   *
   * @param {LoggerPort} logger - Logger instance for structured logging of operations and errors
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Retrieves the system prompt for a specific chat type
   *
   * Fetches AI configuration options from the database based on the provided chat type ID.
   * Currently returns only the system prompt, which contains instructions that define
   * the AI's behavior and personality for a specific chat context.
   *
   * This method:
   * - Logs the fetch attempt for audit and debugging purposes
   * - Queries the database for matching chat options
   * - Returns only the first matching record (chat type IDs should be unique)
   * - Returns null if no configuration is found for the given chat type
   * - Logs and re-throws any errors encountered during the database operation
   *
   * @param {ChatIdType} chatTypeId - UUID of the chat type to retrieve options for
   * @returns {Promise<Pick<DBChatAiOptions, 'prompt'> | null>} Object containing the system prompt, or null if not found
   *
   * @throws {Error} Re-throws any database errors after logging them
   *
   * @example
   * ```typescript
   * // Successful retrieval
   * const options = await repository.getChatOptionsByChatOptionsByChatTypeId('019bdccc-f0cb-7322-aa9e-776e25f34d81')
   * // options = { prompt: 'You are a helpful assistant...' }
   *
   * // Not found
   * const notFound = await repository.getChatOptionsByChatOptionsByChatTypeId('non-existent-id')
   * // notFound = null
   * ```
   */
  async getChatOptionsByChatTypeId(
    chatTypeId: ChatIdType
  ): Promise<Pick<DBChatAiOptions, 'prompt'> | null> {
    this.logger.info('Fetching chat AI options by chat type ID', { chatTypeId })

    try {
      const result = await db
        .select({
          prompt: chatAiOptions.prompt,
        })
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
