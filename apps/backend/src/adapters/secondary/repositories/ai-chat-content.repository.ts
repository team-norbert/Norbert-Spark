import { desc, eq, or } from 'drizzle-orm'
import type { QueryResult } from 'pg'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatTypes } from '../../../infrastructure/database/schema.js'
import type { AIContentPort } from '../../../application/ports/ai-content.port.js'
import type { DBChatType } from '../../../infrastructure/database/schema.js'
import { Uuid7Util } from '../../../shared/utils/uuid7.util.js'
import { PutChatTypeDto } from '../../../application/dtos/put-chat-type.dto.js'
import type { PostChatTypesInsert } from '../../../application/use-cases/post-chat-types.use-case.js'

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
 * - Must be exactly 22 base64url characters (A-Z, a-z, 0-9, '-' or '_', without padding)
 */
const SEO_FRIENDLY_BASE64_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/

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
   * Updates details for an existing chat type.
   *
   * Applies partial updates to a chat type record identified by its UUID. Only
   * the fields provided in the {@link PutChatTypeDto} are updated; any
   * `undefined` fields are ignored. The `updated_at` timestamp is managed by
   * the `chat_types_updated_at` database trigger.
   *
   * @param {PutChatTypeDto} details - The chat type data to update.
   * @param {string} details.id - The UUID of the chat type to update.
   * @param {string} [details.name] - Optional new name for the chat type.
   * @param {string} [details.description] - Optional new description for the chat type.
   * @param {string} [details.seoFriendlyId] - Optional new SEO-friendly identifier
   *   for the chat type. When provided, it should already satisfy any
   *   domain-level validation rules.
   *
   * @returns {Promise<QueryResult | null>} A promise that resolves with the
   *   QueryResult if the update succeeds, or null if the chat type is not
   *   found or if a database error occurs.
   *
   * @example
   * ```typescript
   * const repository = new AIChatContentRepository(logger)
   *
   * await repository.putChatTypeDetails({
   *   id: 'c0a8015e-7c3b-4e3e-9e89-2f0f1c4a1234',
   *   name: 'Product Support Chat',
   *   description: 'AI assistant for product-related customer support',
   *   seoFriendlyId: 'product-support-chat',
   * })
   * ```
   */
  async putChatTypeDetails(details: PutChatTypeDto): Promise<QueryResult | null> {
    this.logger.debug('Updating chat type details', { chatTypeId: details.id })

    // Build update object with only the provided optional fields
    // Note: updated_at is automatically handled by the chat_types_updated_at trigger
    const updateData: Partial<{
      name: string
      description: string
      seoFriendlyId: string
    }> = {}

    if (details.name !== undefined) {
      updateData.name = details.name
    }

    if (details.description !== undefined) {
      updateData.description = details.description
    }

    if (details.seoFriendlyId !== undefined) {
      updateData.seoFriendlyId = details.seoFriendlyId
    }

    try {
      const result = await db.update(chatTypes).set(updateData).where(eq(chatTypes.id, details.id))

      // Return null if no rows were updated (chat type not found)
      if (result.rowCount === 0) {
        this.logger.warn('No chat type found to update', { chatTypeId: details.id })
        return null
      }

      this.logger.info('Successfully updated chat type details', { chatTypeId: details.id })
      return result
    } catch (error) {
      this.logger.error('Error updating chat type details', error as Error)
      return null
    }
  }

  /**
   * Inserts a new chat type record into the `chat_types` table.
   *
   * Logs a debug message before the insert and an info message on success.
   * If the database operation fails, the error is logged and re-thrown so
   * the caller can handle it (e.g. respond with an appropriate HTTP status).
   *
   * @param data - The chat type fields to insert. Must satisfy
   *   `PostChatTypesInsert` — all columns except the auto-managed
   *   `createdAt` and `updatedAt` timestamps.
   * @returns A promise that resolves to the raw `QueryResult` returned by
   *   the `pg` driver after a successful insert.
   * @throws Re-throws any error raised by the database driver (e.g. unique
   *   constraint violations, connection failures) without modification.
   *
   * @example
   * const result = await repository.createChatType({
   *   id: 'some-uuid-v7',
   *   name: 'General Assistant',
   *   seoFriendlyId: 'general-assistant',
   *   seoFriendlyBase64Id: 'AAAAAAAAAAAAAAAAAAAAAA',
   *   description: 'A general-purpose AI assistant chat type',
   * })
   * // result.rowCount === 1 on success
   */
  async createChatType(data: PostChatTypesInsert): Promise<QueryResult> {
    this.logger.debug('Creating new chat type', { name: data.name })
    try {
      const result = await db.insert(chatTypes).values(data)
      this.logger.info('Successfully created new chat type', { name: data.name, result })
      return result
    } catch (error) {
      this.logger.error('Error creating new chat type', error as Error)
      throw error
    }
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
    // Validate maximum length to prevent DoS attacks with extremely long strings
    if (param.length > MAX_PARAM_LENGTH) {
      this.logger.warn('Chat type param exceeds maximum length', {
        param: param.substring(0, 50) + '...',
        length: param.length,
      })
      return null
    }

    // Log with truncated param to prevent large log entries
    this.logger.debug('Resolving chat type by param', {
      param: param.length > 50 ? param.substring(0, 50) + '...' : param,
      length: param.length,
    })

    // Only check UUID column if param is a valid UUID to avoid PostgreSQL type casting errors
    const isUUID = Uuid7Util.isValidUUID(param)

    // For non-UUID params, validate format to provide better error handling
    if (!isUUID) {
      const isSeoFriendlyId = SEO_FRIENDLY_ID_PATTERN.test(param)
      const isSeoFriendlyBase64Id = SEO_FRIENDLY_BASE64_ID_PATTERN.test(param)

      if (!isSeoFriendlyId && !isSeoFriendlyBase64Id) {
        this.logger.debug('Chat type param has invalid format', {
          param: param.length > 50 ? param.substring(0, 50) + '...' : param,
          length: param.length,
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
