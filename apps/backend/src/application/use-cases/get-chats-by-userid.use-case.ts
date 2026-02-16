import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AIServicePort, ChatWithType } from '../ports/ai.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type {
  FetchChatChanges,
  FetchChatFailedChanges,
} from '../../domain/audit/audit-changes.types.js'

export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(userId: UserIdType, auditContext: AuditContext): Promise<ChatWithType[]> {
    this.logger.info(`Getting chats for user ID: ${userId}`)

    let chats: ChatWithType[]
    try {
      chats = await this.aiRepository.getChatsByUserId(userId)
    } catch (error) {
      this.logger.error('Error retrieving chats for user', error as Error, {
        userId,
      })

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.CHAT,
        entityId: userId,
        action: AuditAction.FETCH_FAILED,
        changes: {
          reason: 'chat_retrieval_failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        } satisfies FetchChatFailedChanges,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      await this.auditLog.log(auditEntry)

      throw error
    }

    this.logger.info(
      `Retrieved ${chats.length} chat${chats.length === 1 ? '' : 's'} for user ID: ${userId}`
    )

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT,
      entityId: userId,
      action: AuditAction.FETCH,
      changes: {
        reason: 'chat_successfully_retrieved_by_userid',
        chatIds: chats.map((c) => c.id),
      } satisfies FetchChatChanges,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    await this.auditLog.log(auditEntry)

    return chats
  }
}
