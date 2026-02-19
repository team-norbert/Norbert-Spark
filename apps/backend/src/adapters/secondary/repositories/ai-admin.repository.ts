import { eq } from 'drizzle-orm'
import type { AIAdminPort } from '../../../application/ports/ai-admin.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatAiOptions } from '../../../infrastructure/database/schema.js'
import type { DBChatAiOptions } from '../../../infrastructure/database/schema.js'
import type { UUIDType } from '../../../domain/value-objects/uuid.js'
import { PutAIAdminDTO } from '../../../application/dtos/put-ai-admin.dto.js'
import { isDefined } from '@norberts-spark/shared'
import { PostAIAdminDTO } from '../../../application/dtos/post-ai-admin.dto.js'
import { DatabaseUtil } from '../../../shared/utils/database.util.js'
import { ConflictException } from '../../../shared/exceptions/conflict.exception.js'

/**
 * Secondary adapter that implements {@link AIAdminPort} using Drizzle ORM.
 *
 * Provides persistence operations for the `chat_ai_options` table, which stores
 * per-chat-type AI model configuration (prompts, sampling parameters, limits, etc.).
 * All database errors are logged and re-thrown so callers can apply their own
 * error-handling strategy.
 *
 * @remarks
 * Numeric model parameters (`temperature`, `topP`, `frequencyPenalty`,
 * `presencePenalty`) are stored as SQL `NUMERIC` columns. Drizzle represents
 * these as `string` on the TypeScript side, so incoming `number` values are
 * converted via `.toString()` before insertion or update. Integer parameters
 * (`maxTokens`, `topK`, `seed`, `maxRetries`) map to SQL `INTEGER` and are
 * stored as-is.
 *
 * Optional fields are only included in the SQL payload when the DTO carries a
 * defined value, preventing unintended overwrites of existing column data.
 */
export class AIAdminRepository implements AIAdminPort {
  /**
   * @param logger - Structured logger injected at construction time, used for
   *   info, warn, and error events across all repository methods.
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Creates a new `chat_ai_options` row linked to the given chat type.
   *
   * The `id` parameter is mapped to `chat_type_id` (the foreign key), not to
   * the row's own primary key — the database generates that automatically via
   * `uuidv7()`. Only `prompt` is mandatory; all other AI parameters are
   * included in the insert only when provided in `data`.
   *
   * @param id   - UUID of the chat type this configuration belongs to.
   * @param data - Validated DTO containing the prompt and any optional AI
   *   model parameters to persist.
   * @returns The newly created row, or `null` if the database returned no rows.
   * @throws Re-throws any database error after logging it.
   */
  async createChatAIOptions(id: UUIDType, data: PostAIAdminDTO): Promise<DBChatAiOptions | null> {
    this.logger.info('Creating chat AI options', { chatTypeId: id })

    try {
      const insertData: typeof chatAiOptions.$inferInsert = {
        chatTypeId: id,
        prompt: data.prompt,
        ...(isDefined(data.maxTokens) && { maxTokens: data.maxTokens }),
        ...(isDefined(data.temperature) && { temperature: data.temperature.toString() }),
        ...(isDefined(data.topP) && { topP: data.topP.toString() }),
        ...(isDefined(data.frequencyPenalty) && {
          frequencyPenalty: data.frequencyPenalty.toString(),
        }),
        ...(isDefined(data.presencePenalty) && {
          presencePenalty: data.presencePenalty.toString(),
        }),
        ...(isDefined(data.topK) && { topK: data.topK }),
        ...(isDefined(data.stopSequences) && { stopSequences: data.stopSequences }),
        ...(isDefined(data.seed) && { seed: data.seed }),
        ...(isDefined(data.maxRetries) && { maxRetries: data.maxRetries }),
      }

      const result = await db.insert(chatAiOptions).values(insertData).returning()

      this.logger.info('Chat AI options created successfully', { chatTypeId: id })
      return result[0] ?? null
    } catch (error) {
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        this.logger.warn('Duplicate key error when creating chat AI options', {
          chatTypeId: id,
          error,
        })
        throw new ConflictException('AI options already exist for this chat type', {
          chatTypeId: id,
          reason: 'AI options already exist for this chat type (unique constraint on chat_type_id)',
        })
      }
      this.logger.error('Error creating chat AI options', error as Error, { chatTypeId: id })
      throw error
    }
  }

  /**
   * Retrieves the AI chat settings for the specified chat type.
   *
   * Queries the `chat_ai_options` table by `chat_type_id` and returns the first
   * matching row. Because `chat_type_id` has a unique index, at most one row
   * will ever match.
   *
   * @param id - UUID of the chat type whose AI options should be fetched.
   * @returns The matching row, or `null` if no configuration exists for this
   *   chat type.
   * @throws Re-throws any database error after logging it.
   */
  async getAllChatAIOptions(id: UUIDType): Promise<DBChatAiOptions | null> {
    this.logger.info('Fetching chat AI options', { id })
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

  /**
   * Updates an existing `chat_ai_options` row for the given chat type.
   *
   * Builds the update payload from the DTO, always including `prompt` and
   * `updatedAt`, and conditionally adding each optional field only when it is
   * defined. This prevents accidental nullification of fields that were not
   * part of the current request.
   *
   * @param id  - UUID of the chat type whose AI options should be updated.
   * @param dto - Validated DTO carrying the new field values.
   * @returns The updated row, or `null` if no row with the given `chat_type_id`
   *   exists (i.e. the `WHERE` clause matched nothing).
   * @throws Re-throws any database error after logging it.
   */
  async putChatAIOptions(id: UUIDType, dto: PutAIAdminDTO): Promise<DBChatAiOptions | null> {
    try {
      this.logger.info('Updating chat AI options', { chatTypeId: id })

      // Build update object with only defined fields
      const updateData: Partial<DBChatAiOptions> = {
        prompt: dto.prompt,
        updatedAt: new Date(),
      }

      if (isDefined(dto.maxTokens)) {
        updateData.maxTokens = dto.maxTokens
      }

      if (isDefined(dto.temperature)) {
        updateData.temperature = dto.temperature.toString()
      }
      if (isDefined(dto.topP)) {
        updateData.topP = dto.topP.toString()
      }
      if (isDefined(dto.frequencyPenalty)) {
        updateData.frequencyPenalty = dto.frequencyPenalty.toString()
      }
      if (isDefined(dto.presencePenalty)) {
        updateData.presencePenalty = dto.presencePenalty.toString()
      }
      if (isDefined(dto.topK)) {
        updateData.topK = dto.topK
      }
      if (isDefined(dto.stopSequences)) {
        updateData.stopSequences = dto.stopSequences
      }
      if (isDefined(dto.seed)) {
        updateData.seed = dto.seed
      }
      if (isDefined(dto.maxRetries)) {
        updateData.maxRetries = dto.maxRetries
      }

      const result = await db
        .update(chatAiOptions)
        .set(updateData)
        .where(eq(chatAiOptions.chatTypeId, id))
        .returning()

      if (!result || result.length === 0) {
        this.logger.warn('No chat AI options found to update', { chatTypeId: id })
        return null
      }

      this.logger.info('Chat AI options updated successfully', { chatTypeId: id })
      return result[0] ?? null
    } catch (error) {
      this.logger.error('Error updating chat AI options', error as Error, { chatTypeId: id })
      throw error
    }
  }
}
