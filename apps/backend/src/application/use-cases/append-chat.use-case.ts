import type { LoggerPort } from '../ports/logger.port.js'
import type { UIMessage } from 'ai'
import type { AIServicePort } from '../ports/ai.port.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { EntityType, AuditAction } from '../../domain/audit/entity-type.enum.js'

export interface AppendedChatResult {
  chatId: string
  appendedMessages: UIMessage[]
}

export class AppendedChatUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(
    chatId: ChatIdType,
    messages: UIMessage[],
    auditContext: AuditContext
  ): Promise<AppendedChatResult | null> {
    const chatIdString = chatId
    if (!chatIdString) {
      this.logger.info('Invalid chatId value received in AppendedChatUseCase', { chatId })
      return null
    }
    this.logger.info('Appending chat messages', {
      chatId: chatIdString,
      messageCount: messages.length,
    })
    this.logger.debug('Appended chat', { chatId: chatIdString, messages })
    await this.aiService.appendToChatMessages(chatIdString, messages)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT,
      entityId: chatId,
      action: AuditAction.UPDATE,
      changes: { reason: 'chat_successfully_appended' },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    // This is a placeholder return value
    return {
      chatId: chatIdString,
      appendedMessages: messages,
    }
  }
}
