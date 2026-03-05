import type { UIMessage } from 'ai'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { AIServicePort } from '../ports/ai.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Shape of the value returned by a successful {@link AppendedChatUseCase} execution.
 */
export interface AppendedChatResult {
  chatId: string
  appendedMessages: UIMessage[]
}

/**
 * Application use-case — appends new messages to an existing chat session.
 *
 * Orchestrates three steps:
 * 1. Delegates the persistence of the new messages to {@link AIServicePort}
 *    (backed by {@link AIRepository}).
 * 2. Writes an `UPDATE` audit log entry via {@link AuditLogPort} (fire-and-forget;
 *    audit failures never propagate to the caller).
 * 3. Returns an {@link AppendedChatResult} containing the chat ID and the
 *    messages that were appended.
 *
 * This use-case is called from {@link AIController} in two places:
 * - Before streaming, to persist the incoming user message.
 * - After streaming, inside `toUIMessageStreamResponse.onFinish`, to persist
 *   the assistant's response.
 */
export class AppendedChatUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  /**
   * Appends messages to an existing chat and records an audit log entry.
   *
   * Returns `null` (without throwing) if `chatId` is falsy, logging the
   * invalid value at `info` level so callers can handle the no-op gracefully.
   *
   * @param chatId - The UUIDv7 identifier of the chat to append to.
   * @param messages - The {@link UIMessage} array to persist. May be a single
   *   message (e.g. one user turn) or multiple messages.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise that resolves to an {@link AppendedChatResult} on
   *   success, or `null` when `chatId` is invalid.
   *
   * @example
   * const result = await appendedChatUseCase.execute(chatId, [userMessage], auditContext)
   * // result?.chatId === chatId
   * // result?.appendedMessages === [userMessage]
   */
  async execute(
    chatId: ChatIdType,
    messages: UIMessage[],
    auditContext: AuditContext
  ): Promise<AppendedChatResult | null> {
    const chatIdString = chatId
    if (!chatIdString) {
      this.logger.info('Invalid chatId value received in AppendedChatUseCase', {
        event: 'chat.append.invalid_id',
        chatId,
      })
      return null
    }
    this.logger.info('Appending chat messages', {
      event: 'chat.append.attempt',
      chatId: chatIdString,
      messageCount: messages.length,
    })
    this.logger.debug('Appended chat', { event: 'chat.appended', chatId: chatIdString, messages })
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
