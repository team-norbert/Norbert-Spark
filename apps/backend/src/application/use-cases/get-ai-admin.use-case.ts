import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AIAdminPort } from '../ports/ai-admin.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../infrastructure/database/schema.js'

/**
 * Application use-case — retrieves the AI options record associated with a
 * specific chat type configuration.
 *
 * Orchestrates two steps:
 * 1. Delegates the database read to {@link AIAdminPort} (backed by
 *    {@link AIAdminRepository}) via `getAllChatAIOptions`.
 * 2. Writes a `FETCH` audit log entry via {@link AuditLogPort} regardless of
 *    whether the record was found (fire-and-forget; audit failures never
 *    propagate to the caller).
 *
 * This use-case is called from {@link AIAdminController.getAIChatSettingsById}
 * to serve the `GET /ai-admin/chat-settings/:id` endpoint.
 */
export class GetAIAdminUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiAdminPort: AIAdminPort
  ) {}

  /**
   * Fetches the AI options row for the given configuration ID and writes an
   * audit log entry.
   *
   * @param id - The UUID of the chat AI options record to retrieve.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise that resolves to the {@link DBChatAiOptions} row if
   *   found, or `null` if no record exists for the given `id`.
   *
   * @example
   * const options = await getAIAdminUseCase.execute(optionsId, auditContext)
   * // options?.prompt — the system prompt configured for this chat type
   */
  async execute(id: UUIDType, auditContext: AuditContext): Promise<DBChatAiOptions | null> {
    this.logger.info('Executing GetAIAdminUseCase')

    const result: DBChatAiOptions | null = await this.aiAdminPort.getAllChatAIOptions(id)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.AI_OPTIONS,
      entityId: id,
      action: AuditAction.FETCH,
      changes: {
        reason: 'chat_successfully_db_chat_options_retrieved',
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return result
  }
}
