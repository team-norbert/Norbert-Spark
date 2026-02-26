import { isString } from '@norberts-spark/shared'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { DBChatType } from '../../infrastructure/database/schema.js'
import { SEO } from '../../shared/utils/SEO.util.js'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'
import type { ChatTypeInsertDto } from '../dtos/chat-type-insert.dto.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Shape of the input data required to create a new chat type.
 * Derived from the database schema, containing only the user-supplied fields.
 */
export type PostChatTypesData = Pick<DBChatType, 'name' | 'description' | 'rag'>

/**
 * Use case responsible for creating a new chat type.
 *
 * Orchestrates the full creation flow:
 * 1. Generates a UUIDv7 primary key for the new record.
 * 2. Derives a SEO-friendly slug and a 22-character base64url ID from the UUID.
 * 3. Persists the chat type via {@link AIContentPort.createChatType}.
 * 4. Writes an audit log entry recording who triggered the creation and whether it succeeded.
 *
 * @example
 * ```typescript
 * const useCase = new PostChatTypesUseCase(logger, auditLog, aiChatContent)
 *
 * const result = await useCase.execute(auditContext, {
 *   name: 'Creative Writing',
 *   description: 'Helps users with creative writing tasks',
 * })
 * ```
 */
export class PostChatTypesUseCase {
  /**
   * @param logger - Logger port for structured application logging.
   * @param auditLog - Audit log port for recording create actions. Per contract,
   *   implementations must never throw — audit failures are swallowed internally.
   * @param aiChatContent - Content port that provides database access for chat types.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  /**
   * Creates a new chat type and records an audit log entry.
   *
   * @param auditContext - Caller identity and request metadata used for audit logging.
   * @param data - The name and description for the new chat type.
   * @returns The created chat type record with all fields including database-generated timestamps.
   * @throws {Error} If a valid 22-character base64url ID cannot be derived from the
   *   generated UUIDv7 (should never occur in practice with a well-formed UUID).
   * @throws {ConflictException} If a unique constraint is violated (duplicate name or identifiers).
   */
  async execute(auditContext: AuditContext, data: PostChatTypesData): Promise<DBChatType> {
    this.logger.info('Executing PostChatTypesUseCase with data', { data })

    const { description, name, rag } = data

    // Generate a new UUIDv7 for the chat type
    const newId = Uuid7Util.createUuidv7()
    const seoFriendlyId = SEO.generateSeoFriendlyTitle(name)
    const seoFriendlyBase64IdResult = Uuid7Util.toBase64(newId)
    if (!isString(seoFriendlyBase64IdResult) || seoFriendlyBase64IdResult.length !== 22) {
      throw new Error('Failed to generate a valid base64 ID for the new chat type')
    }
    const seoFriendlyBase64Id: string = seoFriendlyBase64IdResult

    const dataInput: ChatTypeInsertDto = {
      id: newId,
      name,
      description,
      seoFriendlyId,
      seoFriendlyBase64Id,
      rag,
    }

    const createdChatType = await this.aiChatContent.createChatType(dataInput)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT_TYPE,
      entityId: newId,
      action: AuditAction.CREATE,
      changes: {
        reason: 'creation_successful',
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return createdChatType
  }
}
