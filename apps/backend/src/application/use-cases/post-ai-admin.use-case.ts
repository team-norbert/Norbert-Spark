import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'
import type { PostAIAdminDTO } from '../dtos/post-ai-admin.dto.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use case responsible for creating a new AI chat settings record.
 *
 * Orchestrates the creation flow by:
 * 1. Delegating persistence to {@link AIAdminPort.createChatAIOptions}
 * 2. Writing a structured audit log entry via {@link AuditLogPort} regardless
 *    of whether the operation succeeds or fails.
 *
 * @remarks
 * The audit log is always written — on success with reason
 * `'chat_ai_options_create'`, and on failure with reason
 * `'chat_ai_options_create_failed'`. Errors from the persistence layer are
 * re-thrown after the failure audit entry is recorded, so callers receive the
 * original error.
 *
 * {@link AuditLogPort.log} is guaranteed by contract never to throw, so audit
 * failures will not mask the original persistence error.
 */
export class PostAIAdminUseCase {
  /**
   * @param logger       - Structured logger for recording execution events.
   * @param auditLog     - Port used to persist audit trail entries.
   * @param aiAdminPort  - Port providing access to the `chat_ai_options` table.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  /**
   * Creates a new `chat_ai_options` row for the given chat type and records an
   * audit log entry.
   *
   * @param id           - UUID of the chat type the new settings belong to.
   *   This value is stored as `chat_type_id` in the created row.
   * @param dto          - Validated DTO containing the prompt (required) and
   *   any optional AI model parameters to persist.
   * @param auditContext - Caller context (userId, IP, user-agent) embedded in
   *   the audit log entry.
   * @returns The newly created row, or `null` if the repository returned no
   *   rows (e.g. the insert succeeded but `.returning()` was empty).
   * @throws Re-throws any error raised by {@link AIAdminPort.createChatAIOptions}
   *   after writing a failure audit entry.
   */
  async execute(
    id: UUIDType,
    dto: PostAIAdminDTO,
    auditContext: AuditContext
  ): Promise<DBChatAiOptions | null> {
    this.logger.info('Executing PostAIAdminUseCase', { event: 'ai_admin.create.attempt', id })

    try {
      const result = await this.aiAdminPort.createChatAIOptions(id, dto)

      // Log successful audit
      await this.logAudit(id, auditContext, 'chat_ai_options_create')

      return result
    } catch (error) {
      // Log failed audit
      await this.logAudit(id, auditContext, 'chat_ai_options_create_failed')

      throw error
    }
  }

  /**
   * Builds and persists a structured audit log entry for a create operation.
   *
   * @param id           - UUID of the affected chat type (used as `entityId`).
   * @param auditContext - Caller context supplying `userId`, `ipAddress`, and
   *   `userAgent`. A `null` `userAgent` is normalised to `undefined` to match
   *   the {@link CreateAuditLogDTO} contract.
   * @param reason       - Human-readable reason string embedded in the
   *   `changes` payload (`'chat_ai_options_create'` or
   *   `'chat_ai_options_create_failed'`).
   */
  private async logAudit(id: UUIDType, auditContext: AuditContext, reason: string): Promise<void> {
    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.AI_OPTIONS,
      entityId: id,
      action: AuditAction.CREATE,
      changes: {
        reason,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)
  }
}
