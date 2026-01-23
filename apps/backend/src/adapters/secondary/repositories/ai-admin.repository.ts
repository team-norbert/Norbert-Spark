import { eq } from 'drizzle-orm'
import type { AIAdminPort } from '../../../application/ports/ai-admin.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatAiOptions } from '../../../infrastructure/database/schema.js'
import type { DBChatAiOptions } from '../../../infrastructure/database/schema.js'
import type { UUIDType } from '../../../domain/value-objects/uuid.js'
import { PutAIAdminDTO } from '../../../application/dtos/put-ai-admin.dto.js'
import { isDefined } from '@norberts-spark/shared'
import type { AuditLogPort } from '../../../application/ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../../domain/audit/entity-type.enum.js'
import type { AuditContext } from '../../../domain/audit/audit-context.js'

export class AIAdminRepository implements AIAdminPort {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async getAllChatAIOptions(id: UUIDType): Promise<DBChatAiOptions | null> {
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

  async putChatAIOptions(
    id: UUIDType,
    dto: PutAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null> {
    try {
      this.logger.info('Updating chat AI options', { chatTypeId: id })

      // Build update object with only defined fields
      const updateData: Partial<DBChatAiOptions> = {
        prompt: dto.prompt,
        updatedAt: new Date(),
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
      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.AI_OPTIONS,
          entityId: id,
          action: AuditAction.UPDATE,
          changes: {
            reason: 'chat_ai_options_updated',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for chat AI options update', error as Error, {
          userId: auditContext.userId,
        })
      }

      this.logger.error('Error updating chat AI options', error as Error, { chatTypeId: id })
      throw error
    }
  }
}
