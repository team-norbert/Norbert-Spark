import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AIServicePort } from '../ports/ai.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'

export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(userId: UserIdType, auditContext: AuditContext): Promise<ChatIdType[]> {
    this.logger.info(`Getting chats for user ID: ${userId}`)
    const chats = await this.aiRepository.getChatsByUserId(userId)
    this.logger.info(
      `Retrieved ${chats.length} chat${chats.length === 1 ? '' : 's'} for user ID: ${userId}`
    )

    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.CHAT,
        entityId: userId,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_retrieved_by_userid',
          chatIds: chats,
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
    } catch (error) {
      this.logger.error('Error logging audit for chat retrieval', error as Error, {
        userId: auditContext.userId,
      })
    }
    return chats
  }
}
