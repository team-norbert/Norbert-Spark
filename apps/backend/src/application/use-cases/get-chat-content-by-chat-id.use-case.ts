import type { AIServicePort } from '../ports/ai.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { EntityType, AuditAction } from '../../domain/audit/entity-type.enum.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'

export class GetChatContentByChatIdUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}
  async execute(chatId: ChatIdType, auditContext: AuditContext): Promise<any> {
    this.logger.info('GetChatContentByChatIdUseCase.execute', chatId)
    const chatContent = await this.aiService.getAIChatByChatId(chatId)

    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.CHAT,
        entityId: chatId,
        action: AuditAction.UPDATE,
        changes: { reason: 'chat_successfuly_appended' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for data extraction upload', error as Error, {
        userId: auditContext.userId,
      })
    }

    return chatContent
  }
}
