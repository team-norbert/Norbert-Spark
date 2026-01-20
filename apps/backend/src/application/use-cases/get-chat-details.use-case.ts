import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import { SEO } from '../../shared/utils/SEO.util.js'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'
import type { DBChatType } from '../../infrastructure/database/schema.js'

/**
 * Use case for retrieving and enriching chat type details.
 *
 * This use case fetches all available chat types from the database and ensures
 * each chat type has the required SEO-friendly fields. If any SEO fields are
 * missing, they are automatically generated from the chat type's name and ID.
 *
 * The SEO fields include:
 * - `seoFriendlyId`: A URL-safe slug generated from the chat type name
 * - `seoFriendlyBase64Id`: A 22-character base64url-encoded representation of the UUIDv7
 *
 * @class GetChatDetailsUseCase
 */
export class GetChatDetailsUseCase {
  /**
   * Creates an instance of GetChatDetailsUseCase.
   *
   * @param {LoggerPort} logger - The logger instance for logging operations
   * @param {AuditLogPort} auditLog - The audit log port for tracking access (currently unused but reserved for future auditing)
   * @param {AIContentPort} aiChatContent - The content port for fetching chat type data
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  /**
   * Executes the use case to fetch and enrich chat type details.
   *
   * Retrieves all chat types from the database and ensures each has complete
   * SEO-friendly fields. If a chat type is missing `seoFriendlyId` or
   * `seoFriendlyBase64Id`, these fields are generated automatically:
   * - Missing `seoFriendlyId` is generated from the chat type name using SEO utility
   * - Missing `seoFriendlyBase64Id` is generated from the chat type ID using base64url encoding
   *
   * @param {AuditContext} auditContext - The audit context containing user information,
   *   IP address, and user agent for tracking purposes
   *
   * @returns {Promise<DBChatType[]>} A promise that resolves to an array of chat types,
   *   each guaranteed to have both SEO fields populated. Returns an empty array if no
   *   chat types exist in the database.
   *
   * @throws {Error} If there's a database connection error or data retrieval failure
   *
   * @example
   * ```typescript
   * const useCase = new GetChatDetailsUseCase(logger, auditLog, aiContentPort);
   * const auditContext = {
   *   userId: '019bda39-6197-7557-9071-d7ed1c719138',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0'
   * };
   * const chatTypes = await useCase.execute(auditContext);
   * // chatTypes[0].seoFriendlyId => 'general-assistant'
   * // chatTypes[0].seoFriendlyBase64Id => 'AbCdEfGhIjKlMnOpQrStUv'
   * ```
   */
  public async execute(auditContext: AuditContext): Promise<DBChatType[]> {
    const result = await this.aiChatContent.fetchChatContent()
    this.logger.info(`Fetched ${result.length} chat types from AIContentPort`)
    return result.map((chatType: DBChatType) => {
      let seoFriendlyId = chatType.seoFriendlyId
      let seoFriendlyBase64Id = chatType.seoFriendlyBase64Id

      if (!seoFriendlyId) {
        seoFriendlyId = SEO.generateSeoFriendlyTitle(chatType.name)
      }
      if (!seoFriendlyBase64Id && chatType.id) {
        const base64Id = Uuid7Util.toBase64(chatType.id)
        if (!base64Id) {
          this.logger.error(
            `Failed to generate seoFriendlyBase64Id from chatType.id=${chatType.id}`
          )
          throw new Error('Failed to generate seoFriendlyBase64Id from chat type ID')
        }
        seoFriendlyBase64Id = base64Id
      }

      return {
        ...chatType,
        seoFriendlyId,
        seoFriendlyBase64Id,
      }
    })
  }
}
