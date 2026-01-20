import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import { SEO } from '@norberts-spark/shared'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'
import type { DBChatType } from '../../infrastructure/database/schema.js'

export class GetChatDetailsUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  public async execute(_auditContext: AuditContext): Promise<DBChatType[]> {
    const result = await this.aiChatContent.fetchChatContent()
    this.logger.info(`Fetched ${result.length} chat types from AIContentPort`)
    return result.map((chatType: DBChatType) => {
      let seoFriendlyId = chatType.seoFriendlyId
      let seoFriendlyBase64Id = chatType.seoFriendlyBase64Id

      if (!seoFriendlyId) {
        seoFriendlyId = SEO.generateSeoFriendlyTitle(chatType.name)
      }
      if (!seoFriendlyBase64Id && chatType.id) {
        seoFriendlyBase64Id = Uuid7Util.toBase64(chatType.id)
      }

      return {
        ...chatType,
        seoFriendlyId,
        seoFriendlyBase64Id,
      }
    })
  }
}
