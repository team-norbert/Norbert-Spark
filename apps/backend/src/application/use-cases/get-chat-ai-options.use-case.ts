import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AIChatOptionsPort } from '../ports/ai-chat-options.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'

/**
 * Use case for retrieving AI configuration options for a specific chat type.
 *
 * This use case implements the business logic for fetching AI system prompts and other
 * configuration settings from the database based on the chat type ID. It follows the
 * hexagonal architecture pattern by depending on ports (interfaces) rather than concrete
 * implementations.
 *
 * **Responsibilities:**
 * - Fetch AI options (system prompts) from the repository
 * - Log audit trail for all retrieval attempts (success and failure)
 * - Handle errors gracefully and return null on failure
 * - Ensure audit logging failures don't break the main operation
 *
 * **Architecture Layer:** Application Layer (Use Case)
 *
 * @example
 * ```typescript
 * const useCase = new GetChatAiOptionsUseCase(logger, auditLog, aiChatOptionsRepo)
 * const auditContext = { userId, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' }
 * const options = await useCase.execute(auditContext, chatTypeId)
 * if (options) {
 *   console.log(`System prompt: ${options.prompt}`)
 * }
 * ```
 */
export class GetChatAiOptionsUseCase {
  /**
   * Creates an instance of GetChatAiOptionsUseCase.
   *
   * @param logger - Port for logging operations (errors, debug info)
   * @param auditLog - Port for recording audit trail of all data access
   * @param aiChatOptions - Port for accessing AI chat options from data source
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatOptions: AIChatOptionsPort
  ) {}

  /**
   * Executes the use case to retrieve AI configuration options for a specific chat type.
   *
   * This method fetches the AI system prompt and related configuration from the database
   * via the AI chat options repository. All retrieval attempts (both successful and failed)
   * are logged to the audit trail for compliance and debugging purposes.
   *
   * **Error Handling:**
   * - If retrieval fails, the error is logged and null is returned
   * - If audit logging fails, the error is logged but the main operation continues
   * - Audit logging failures never cause the use case to fail
   *
   * **Audit Trail:**
   * - Success: Logs FETCH action with reason 'chat_options_retrieved_successfully_for_internal'
   * - Failure: Logs FETCH action with reason 'chat_options_failed_to_retrieve_for_internal'
   *
   * @param auditContext - Context information for audit logging (user ID, IP address, user agent)
   * @param chatTypeId - The unique identifier of the chat type to retrieve options for
   * @returns Promise resolving to an object containing the system prompt, or null if not found or on error
   *
   * @example
   * ```typescript
   * const auditContext = {
   *   userId: new UserId('user-123').getValue(),
   *   ipAddress: '192.168.1.100',
   *   userAgent: 'Mozilla/5.0'
   * }
   * const chatTypeId = new ChatId('019bdccc-f0cb-7322-aa9e-776e25f34d81').getValue()
   * const result = await useCase.execute(auditContext, chatTypeId)
   * if (result) {
   *   console.log(`System prompt: ${result.prompt}`)
   * } else {
   *   console.log('Failed to retrieve AI options')
   * }
   * ```
   */
  async execute(
    auditContext: AuditContext,
    chatTypeId: ChatIdType
  ): Promise<Pick<DBChatAiOptions, 'prompt'> | null> {
    try {
      const result = await this.aiChatOptions.getChatOptionsByChatOptionsByChatTypeId(chatTypeId)

      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.AI_OPTIONS,
          entityId: chatTypeId,
          action: AuditAction.FETCH,
          changes: { reason: 'chat_options_retrieved_successfully_for_internal' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for chat retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
      return result ?? null
    } catch (error) {
      this.logger.error('Error in GetChatAiOptionsUseCase.execute', error as Error, { chatTypeId })
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.FETCH,
        changes: { reason: 'chat_options_failed_to_retrieve_for_internal' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
      return null
    }
  }
}
