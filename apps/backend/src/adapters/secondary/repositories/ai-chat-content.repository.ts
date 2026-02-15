import { desc, eq, or } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatTypes } from '../../../infrastructure/database/schema.js'
import type { AIContentPort } from '../../../application/ports/ai-content.port.js'
import type { DBChatType } from '../../../infrastructure/database/schema.js'
import { Uuid7Util } from '../../../shared/utils/uuid7.util.js'

/**
 * Repository for managing AI chat content data access.
 *
 * This class implements the AIContentPort interface and provides methods to
 * retrieve chat type information from the database. It acts as an adapter
 * between the application layer and the database infrastructure.
 *
 * @implements {AIContentPort}
 */
export class AIChatContentRepository implements AIContentPort {
  /**
   * Creates an instance of AIChatContentRepository.
   *
   * @param {LoggerPort} logger - The logger instance for logging operations
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Fetches all chat types from the database ordered by creation date.
   *
   * Retrieves all chat type records from the chat_types table, ordered by
   * their creation timestamp in descending order (most recent first). This
   * method is typically used to populate chat type selection interfaces or
   * to provide a list of available chat configurations.
   *
   * @returns {Promise<DBChatType[]>} A promise that resolves to an array of
   *   chat type records, including their IDs, names, descriptions, SEO fields,
   *   and timestamps. Returns an empty array if no chat types exist.
   *
   * @throws {Error} If there's a database connection error or query execution failure
   *
   * @example
   * ```typescript
   * const repository = new AIChatContentRepository(logger);
   * const chatTypes = await repository.fetchChatContent();
   * console.log(`Found ${chatTypes.length} chat types`);
   * ```
   */
  async fetchChatContent(): Promise<DBChatType[]> {
    this.logger.debug('Fetching chatContent from chat_types table')
    return db.select().from(chatTypes).orderBy(desc(chatTypes.createdAt))
  }

  /**
   * Resolves a chat type parameter (id, seoFriendlyId, or seoFriendlyBase64Id)
   * to the actual UUID id of the chat type.
   *
   * Queries the chat_types table matching the param against all three unique
   * identifier columns. Since all three are unique, at most one row will match.
   *
   * @param param - One of the three unique identifiers for a chat type
   * @returns The UUID id of the matching chat type, or null if not found
   */
  async resolveChatTypeByParam(param: string): Promise<string | null> {
    this.logger.debug('Resolving chat type by param', { param })

    // Only check UUID column if param is a valid UUID to avoid PostgreSQL type casting errors
    const isUUID = Uuid7Util.isValidUUID(param)

    const conditions = [
      eq(chatTypes.seoFriendlyId, param),
      eq(chatTypes.seoFriendlyBase64Id, param),
    ]

    if (isUUID) {
      conditions.unshift(eq(chatTypes.id, param))
    }

    try {
      const result = await db
        .select({ id: chatTypes.id })
        .from(chatTypes)
        .where(or(...conditions))
        .limit(1)

      const resolved = result[0]?.id ?? null
      this.logger.debug('Resolved chat type', { param, resolvedId: resolved })
      return resolved
    } catch (error) {
      this.logger.error(
        'Failed to resolve chat type by param',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
}
