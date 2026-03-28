import type { UpdateChanges } from '../../domain/audit/audit-changes.types.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import { PutAIAdminDTO } from '../dtos/put-ai-admin.dto.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use-case — updates the AI options record for a specific chat
 * type configuration.
 *
 * Orchestrates two steps:
 * 1. Delegates the database write to {@link AIAdminPort} (backed by
 *    {@link AIAdminRepository}) via `putChatAIOptions`.
 * 2. Writes an `UPDATE` audit log entry via {@link AuditLogPort} in both the
 *    success and failure paths (fire-and-forget; audit failures never
 *    propagate). On failure the original error is re-thrown so the caller
 *    can map it to an HTTP status code.
 *
 * The audit entry records a snapshot of all updated fields (`prompt`,
 * `maxTokens`, `temperature`, `topP`, `frequencyPenalty`, `presencePenalty`,
 * `topK`, `stopSequences`, `maxRetries`) under the `after` key.
 *
 * This use-case is called from
 * {@link AIAdminController.putAIChatSettingsById} to serve the
 * `PUT /ai-admin/chat-settings/:id` endpoint.
 */
export class PutAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  /**
   * Applies the DTO updates to the AI options record and writes an audit log
   * entry.
   *
   * On success an audit entry is written with
   * `reason: 'chat_ai_options_updated'`. On failure an audit entry is written
   * with `reason: 'chat_ai_options_update_failed'` and the original error is
   * re-thrown.
   *
   * @param id - The UUID of the `chat_ai_options` record to update.
   * @param dto - The validated {@link PutAIAdminDTO} containing the fields to
   *   persist (prompt, model parameters, etc.).
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise resolving to the updated {@link DBChatAiOptions} row,
   *   or `null` if the record was not found.
   *
   * @throws Re-throws any error thrown by {@link AIAdminPort.putChatAIOptions}.
   *
   * @example
   * const updated = await putAIAdminUseCase.execute(optionsId, dto, auditContext)
   * // updated?.prompt — the newly persisted system prompt
   */
  async execute(
    id: UUIDType,
    dto: PutAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null> {
    this.logger.info('Executing PutAIAdminUseCase', { event: 'ai_admin.update.attempt', id })

    try {
      const result = await this.aiAdminPort.putChatAIOptions(id, dto)

      // Log successful audit
      await this.logAudit(id, auditContext, dto, 'chat_ai_options_updated')

      return result
    } catch (error) {
      // Log failed audit
      await this.logAudit(id, auditContext, dto, 'chat_ai_options_update_failed')

      throw error
    }
  }

  /**
   * Builds and writes an `UPDATE` audit log entry for the AI options record.
   *
   * Shared by both the success and failure branches of {@link execute}.
   * Never throws per the {@link AuditLogPort} contract.
   *
   * @param id - The UUID of the record being updated (used as `entityId`).
   * @param auditContext - Caller context (`userId`, `ipAddress`, `userAgent`).
   * @param dto - The DTO whose fields are recorded under the `after` snapshot.
   * @param reason - A short descriptor (`'chat_ai_options_updated'` or
   *   `'chat_ai_options_update_failed'`) stored in `changes.reason`.
   */
  private async logAudit(
    id: UUIDType,
    auditContext: AuditContext,
    dto: PutAIAdminDTO,
    reason: string
  ): Promise<void> {
    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.AI_OPTIONS,
      entityId: id,
      action: AuditAction.UPDATE,
      changes: {
        reason,
        after: {
          prompt: dto.prompt,
          maxTokens: dto.maxTokens,
          temperature: dto.temperature,
          topP: dto.topP,
          frequencyPenalty: dto.frequencyPenalty,
          presencePenalty: dto.presencePenalty,
          topK: dto.topK,
          stopSequences: dto.stopSequences,
          maxRetries: dto.maxRetries,
        },
      } satisfies UpdateChanges,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)
  }
}
