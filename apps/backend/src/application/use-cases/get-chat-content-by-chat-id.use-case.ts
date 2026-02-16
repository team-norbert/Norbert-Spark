import type { AIServicePort } from '../ports/ai.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { EntityType, AuditAction } from '../../domain/audit/entity-type.enum.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { ChatTypeChange } from '../../domain/audit/audit-changes.types.js'

export class GetChatContentByChatIdUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}
  async execute(
    chatId: ChatIdType,
    auditContext: AuditContext
  ): Promise<ChatResponseResult | null> {
    this.logger.info('GetChatContentByChatIdUseCase.execute', chatId)
    const chatContent = await this.aiService.getAIChatByChatId(chatId)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT,
      entityId: chatId,
      action: AuditAction.FETCH,
      changes: { reason: 'chat_successfully_retrieved' } satisfies ChatTypeChange,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)
    return chatContent
  }
}
