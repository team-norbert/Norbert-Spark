import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { ChatTypeChange } from '../../domain/audit/audit-changes.types.js'

/**
 * Resolves a chat type parameter (UUID, seoFriendlyId, or seoFriendlyBase64Id)
 * to the actual UUID id of the chat type from the chat_types table.
 *
 * All three identifier columns in chat_types are unique, so a match
 * against any of them uniquely identifies the chat type.
 */
export class ResolveChatTypeUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiContentRepository: AIContentPort
  ) {}

  /**
   * @param param - One of: UUID id, seo_friendly_id, or seo_friendly_base64_id
   * @param auditContext - Audit context for logging
   * @returns The UUID id of the matching chat type, or null if not found
   */
  async execute(param: string, auditContext: AuditContext): Promise<string | null> {
    this.logger.info(`Resolving chat type by param: ${param}`)

    try {
      const resolvedId = await this.aiContentRepository.resolveChatTypeByParam(param)

      if (resolvedId) {
        this.logger.info(`Chat type resolved: ${param} → ${resolvedId}`)
      } else {
        this.logger.warn(`Chat type not found for param: ${param}`)
      }

      try {
        const auditEntry: CreateAuditLogDTO = {
          userId: auditContext.userId,
          entityType: EntityType.CHAT_TYPE,
          entityId: param,
          action: resolvedId ? AuditAction.FETCH : AuditAction.FETCH_FAILED,
          changes: {
            reason: resolvedId ? 'chat_type_resolved_successfully' : 'chat_type_resolution_failed',
            param,
            resolvedId,
          } satisfies ChatTypeChange,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        }
        await this.auditLog.log(auditEntry)
      } catch (auditError) {
        this.logger.error('Error logging audit for chat type resolution', auditError as Error, {
          userId: auditContext.userId,
        })
      }

      return resolvedId
    } catch (error) {
      this.logger.error('Error resolving chat type', error as Error, { param })
      throw error
    }
  }
}
