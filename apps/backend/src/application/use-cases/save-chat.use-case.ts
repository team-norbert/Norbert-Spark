import type { LoggerPort } from '../ports/logger.port.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { EntityType, AuditAction } from '../../domain/audit/entity-type.enum.js'

export class SaveChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(
    chatId: ChatIdType,
    userId: UserIdType,
    messages: any[],
    auditContext: AuditContext
  ): Promise<string> {
    // Placeholder implementation
    this.logger.info(`Saving chat ${chatId} for user ${userId} with ${messages.length} messages.`)
    this.logger.info('Messages:', messages)

    const savedChatId = await this.aiRepository.createChat(chatId, userId, messages)
    this.logger.info(`Chat saved with ID: ${savedChatId}`)

    // Log audit event for data extraction upload initialization
    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.CHAT,
        entityId: chatId,
        action: AuditAction.FETCH,
        changes: { reason: 'chat_successfuly_saved' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for data extraction upload', error as Error, {
        userId: auditContext.userId,
      })
    }

    return savedChatId
  }
}
