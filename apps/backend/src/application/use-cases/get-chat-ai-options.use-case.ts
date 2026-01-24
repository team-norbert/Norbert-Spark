import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AIChatOptionsPort } from '../ports/ai-chat-options.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'

export class GetChatAiOptionsUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatOptions: AIChatOptionsPort
  ) {}
  async execute(
    auditContext: AuditContext,
    chatTypeId: ChatIdType
  ): Promise<Pick<DBChatAiOptions, 'prompt'> | null> {
    try {
      const result = await this.aiChatOptions.getChatOptionsByChatOptionsByChatTypeId(chatTypeId)

      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.AI_OPTIONS,
          entityId: chatTypeId,
          action: AuditAction.FETCH,
          changes: { reason: 'chat_options_retrieved_successfully_for_internal' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for chat retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
      return result ?? null
    } catch (error) {
      this.logger.error('Error in GetChatAiOptionsUseCase.execute', error as Error, { chatTypeId })
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.FETCH,
        changes: { reason: 'chat_options_failed_to_retrieve_for_internal' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
      return null
    }
  }
}
