import type { QueryResult } from 'pg'

import type { UpdateChanges } from '../../domain/audit/audit-changes.types.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { PutChatTypeDto } from '../dtos/put-chat-type.dto.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Use case for updating chat type details in the system.
 *
 * This use case handles the update of chat type attributes such as name,
 * seoFriendlyId, and description. It performs the update operation and
 * automatically creates audit log entries for both successful and unsuccessful
 * update attempts.
 *
 * @remarks
 * The use case follows these steps:
 * 1. Logs the execution start with chat type ID
 * 2. Delegates the update to the AIContentPort repository
 * 3. Creates an audit log entry with 'update_successful' or 'update_unsuccessful' reason
 * 4. Returns the query result or null if the update failed
 *
 * Audit logs are always created regardless of success/failure, providing
 * complete traceability of all update attempts.
 *
 * @example
 * ```typescript
 * const useCase = new PutChatDetailsUseCase(logger, auditLog, aiChatContent)
 * const result = await useCase.execute(auditContext, chatTypeDto)
 * if (result) {
 *   console.log('Chat type updated successfully')
 * }
 * ```
 */
export class PutChatDetailsUseCase {
  /**
   * Creates an instance of PutChatDetailsUseCase.
   *
   * @param logger - Logger for recording execution flow and debugging
   * @param auditLog - Audit log service for recording all update attempts
   * @param aiChatContent - Repository for performing chat type updates
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  /**
   * Executes the chat type update operation with audit logging.
   *
   * Updates the chat type identified by the ID in the DTO with the provided
   * optional fields (name, seoFriendlyId, description). Only fields that are
   * defined in the DTO will be updated; undefined fields are left unchanged.
   *
   * Creates audit log entries for both successful and unsuccessful updates,
   * including the full context of what was attempted to be updated.
   *
   * @param auditContext - Context information for audit logging (userId, IP, userAgent)
   * @param details - DTO containing the chat type ID and optional fields to update
   * @returns Promise resolving to the QueryResult if successful, or null if the update failed
   *
   * @remarks
   * - The audit log never throws per the AuditLogPort contract
   * - A null return indicates the chat type was not found or could not be updated
   * - The database trigger automatically updates the updated_at timestamp
   *
   * @example
   * ```typescript
   * const auditContext = {
   *   userId: new UserId('...').getValue(),
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...'
   * }
   * const details = new PutChatTypeDto(chatTypeId, 'New Name', 'new-seo-id', 'New description')
   * const result = await useCase.execute(auditContext, details)
   * ```
   */
  async execute(auditContext: AuditContext, details: PutChatTypeDto): Promise<QueryResult | null> {
    this.logger.info(`Executing PutChatDetailsUseCase for id: ${details.id}`)
    this.logger.debug(`Received details to update: ${JSON.stringify(details)}`)

    const result = await this.aiChatContent.putChatTypeDetails(details)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT_TYPE,
      entityId: details.id,
      action: AuditAction.UPDATE,
      changes: {
        after: {
          id: details.id,
          name: details.name,
          seoFriendlyId: details.seoFriendlyId,
          description: details.description,
        },
        reason: result ? 'update_successful' : 'update_unsuccessful',
      } satisfies UpdateChanges,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return result
  }
}
