import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UpdateChanges } from '../../domain/audit/audit-changes.types.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use-case — creates a brand-new chat session with its initial
 * messages.
 *
 * Orchestrates two steps:
 * 1. Delegates the database write to {@link AIRepository} via `createChat`,
 *    which inserts a row into the `chats` table and persists any initial
 *    messages and their parts.
 * 2. Writes a `CREATE` audit log entry via {@link AuditLogPort}
 *    (fire-and-forget; audit failures never propagate to the caller).
 *
 * This use-case is called from {@link AIController.chat} when no existing
 * chat session is found for the given `chatId`, i.e. the first time a user
 * sends a message in a new chat session.
 */
export class SaveChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository,
    private readonly auditLog: AuditLogPort
  ) {}

  /**
   * Creates the chat session and persists the initial messages.
   *
   * Delegates to {@link AIRepository.createChat}, then writes a `CREATE`
   * audit log entry with `reason: 'chat_successfully_saved'`.
   *
   * @param chatId - The UUIDv7 identifier for the new chat session.
   * @param userId - The ID of the user who owns the chat.
   * @param chatTypeId - The ID of the chat type (configuration) to associate
   *   with the session.
   * @param messages - The initial array of UI messages to persist alongside
   *   the chat record. Passed directly to {@link AIRepository.createChat}.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise that resolves to the `chatId` string once the chat and
   *   all initial messages have been persisted.
   *
   * @example
   * const savedId = await saveChatUseCase.execute(
   *   chatId, userId, chatTypeId, messages, auditContext
   * )
   * // savedId === chatId
   */
  async execute(
    chatId: ChatIdType,
    userId: UserIdType,
    chatTypeId: ChatIdType,
    messages: any[],
    auditContext: AuditContext
  ): Promise<string> {
    // Placeholder implementation
    this.logger.info('Saving chat', {
      event: 'chat.save.attempt',
      chatId,
      userId,
      messageCount: messages.length,
    })
    this.logger.debug('Messages to save', { chatId, messages })

    const savedChatId = await this.aiRepository.createChat(chatId, userId, chatTypeId, messages)
    this.logger.info('Chat saved', { event: 'chat.created', chatId: savedChatId })

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
