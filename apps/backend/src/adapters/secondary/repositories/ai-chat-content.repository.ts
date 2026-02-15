import { desc, eq, or } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatTypes } from '../../../infrastructure/database/schema.js'
import type { AIContentPort } from '../../../application/ports/ai-content.port.js'
import type { DBChatType } from '../../../infrastructure/database/schema.js'
import { Uuid7Util } from '../../../shared/utils/uuid7.util.js'

/**
 * Maximum allowed length for chat type parameter to prevent DoS attacks
 */
const MAX_PARAM_LENGTH = 200

/**
 * Regex pattern for validating seoFriendlyId format
 * - Must be lowercase alphanumeric with hyphens
 * - Cannot start or end with hyphens
 * - Cannot have consecutive hyphens
 */
const SEO_FRIENDLY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Regex pattern for validating seoFriendlyBase64Id format
 * - Must be exactly 22 alphanumeric characters (base64 without padding)
 */
const SEO_FRIENDLY_BASE64_ID_PATTERN = /^[A-Za-z0-9]{22}$/

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
   * Input validation:
   * - Maximum length: 200 characters (prevents DoS with extremely long strings)
   * - Format validation for non-UUID params: alphanumeric + hyphens only
   * - Returns null for invalid inputs rather than querying the database
   *
   * @param param - One of the three unique identifiers for a chat type
   * @returns The UUID id of the matching chat type, or null if not found or invalid
   */
  async resolveChatTypeByParam(param: string): Promise<string | null> {
    this.logger.debug('Resolving chat type by param', { param })

    // Validate maximum length to prevent DoS attacks with extremely long strings
    if (param.length > MAX_PARAM_LENGTH) {
      this.logger.warn('Chat type param exceeds maximum length', {
        param: param.substring(0, 50) + '...',
        length: param.length,
      })
      return null
    }

    // Only check UUID column if param is a valid UUID to avoid PostgreSQL type casting errors
    const isUUID = Uuid7Util.isValidUUID(param)

    // For non-UUID params, validate format to provide better error handling
    if (!isUUID) {
      const isSeoFriendlyId = SEO_FRIENDLY_ID_PATTERN.test(param)
      const isSeoFriendlyBase64Id = SEO_FRIENDLY_BASE64_ID_PATTERN.test(param)

      if (!isSeoFriendlyId && !isSeoFriendlyBase64Id) {
        this.logger.debug('Chat type param has invalid format', {
          param,
          isSeoFriendlyId,
          isSeoFriendlyBase64Id,
        })
        return null
      }
    }

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
