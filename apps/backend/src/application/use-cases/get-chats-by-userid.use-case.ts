import type {
  FetchChatChanges,
  FetchChatFailedChanges,
} from '../../domain/audit/audit-changes.types.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AIServicePort, ChatWithType } from '../ports/ai.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use-case — retrieves all chat sessions belonging to a user.
 *
 * Orchestrates two steps:
 * 1. Delegates the database read to {@link AIServicePort} (backed by
 *    {@link AIRepository}) via `getChatsByUserId`.
 * 2. Writes a `FETCH` audit log entry on success (recording the list of
 *    returned chat IDs) or a `FETCH_FAILED` entry on error, both via
 *    {@link AuditLogPort} (fire-and-forget; audit failures never propagate).
 *    On error the original exception is re-thrown so the caller can map it
 *    to an HTTP status code.
 *
 * This use-case is called from {@link AIController.getAIChatsByUserId} to
 * serve the `GET /ai/chats/:userId` endpoint.
 */
export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  /**
   * Fetches all chats for the given user and writes an audit log entry.
   *
   * On success a `FETCH` audit entry is written with `reason:
   * 'chat_successfully_retrieved_by_userid'` and the list of returned chat
   * IDs. On failure a `FETCH_FAILED` entry is written and the original
   * error is re-thrown.
   *
   * @param userId - The branded UUID of the user whose chats to retrieve.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise that resolves to an array of {@link ChatWithType}
   *   objects (chat record joined with its chat-type details). Returns an
   *   empty array when the user has no chats.
   *
   * @throws Re-throws any error thrown by {@link AIServicePort.getChatsByUserId}.
   *
   * @example
   * const chats = await getChatsByUserIdUseCase.execute(userId, auditContext)
   * // chats[0].id — ChatIdType of the first chat
   * // chats[0].chatType — associated chat-type details
   */
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
      // AuditLogPort.log() never throws per contract
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
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return chats
  }
}
