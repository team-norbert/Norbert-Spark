import { desc } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatTypes } from '../../../infrastructure/database/schema.js'
import type { AIContentPort } from '../../../application/ports/ai-content.port.js'
import type { DBChatType } from '../../../infrastructure/database/schema.js'

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
    this.logger.debug('Fetches chatContent from chat_types table')
    return db.select().from(chatTypes).orderBy(desc(chatTypes.createdAt))
  }
}
