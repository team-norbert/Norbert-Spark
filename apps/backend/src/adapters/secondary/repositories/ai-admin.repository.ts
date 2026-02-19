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

export class AIAdminRepository implements AIAdminPort {
  constructor(private readonly logger: LoggerPort) {}

  async createChatAIOptions(id: UUIDType, data: PostAIAdminDTO): Promise<DBChatAiOptions | null> {
    this.logger.info('Creating chat AI options', { chatTypeId: id })

    try {
      const insertData: Partial<DBChatAiOptions> = {
        chatTypeId: id,
        prompt: data.prompt,
      }

      if (isDefined(data.maxTokens)) {
        insertData.maxTokens = data.maxTokens
      }
      if (isDefined(data.temperature)) {
        insertData.temperature = data.temperature.toString()
      }
      if (isDefined(data.topP)) {
        insertData.topP = data.topP.toString()
      }
      if (isDefined(data.frequencyPenalty)) {
        insertData.frequencyPenalty = data.frequencyPenalty.toString()
      }
      if (isDefined(data.presencePenalty)) {
        insertData.presencePenalty = data.presencePenalty.toString()
      }
      if (isDefined(data.topK)) {
        insertData.topK = data.topK
      }
      if (isDefined(data.stopSequences)) {
        insertData.stopSequences = data.stopSequences
      }
      if (isDefined(data.seed)) {
        insertData.seed = data.seed
      }
      if (isDefined(data.maxRetries)) {
        insertData.maxRetries = data.maxRetries
      }

      const result = await db
        .insert(chatAiOptions)
        .values(insertData as DBChatAiOptions)
        .returning()

      this.logger.info('Chat AI options created successfully', { chatTypeId: id })
      return result[0] ?? null
    } catch (error) {
      this.logger.error('Error creating chat AI options', error as Error, { chatTypeId: id })
      throw error
    }
  }

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
