import type { LoggerPort } from '../ports/logger.port.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { EntityType, AuditAction } from '../../domain/audit/entity-type.enum.js'
import type { UpdateChanges } from '../../domain/audit/audit-changes.types.js'

export class SaveChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(
    chatId: ChatIdType,
    userId: UserIdType,
    chatTypeId: ChatIdType,
    messages: any[],
    auditContext: AuditContext
  ): Promise<string> {
    // Placeholder implementation
    this.logger.info(`Saving chat ${chatId} for user ${userId} with ${messages.length} messages.`)
    this.logger.info('Messages:', messages)

    const savedChatId = await this.aiRepository.createChat(chatId, userId, chatTypeId, messages)
    this.logger.info(`Chat saved with ID: ${savedChatId}`)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT,
      entityId: chatId,
      action: AuditAction.CREATE,
      changes: { reason: 'chat_successfully_saved' } satisfies UpdateChanges,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return savedChatId
  }
}
