import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { AIContentPort } from '../ports/ai-content.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { DBChatType } from '../../infrastructure/database/schema.js'
import { SEO } from '../../shared/utils/SEO.util.js'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'
import { isString } from '@norberts-spark/shared'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { QueryResult } from 'pg'

export type PostChatTypesData = Pick<DBChatType, 'name' | 'description'>
export type PostChatTypesInsert = Omit<DBChatType, 'createdAt' | 'updatedAt'>

export class PostChatTypesUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiChatContent: AIContentPort
  ) {}

  async execute(auditContext: AuditContext, data: PostChatTypesData): Promise<QueryResult> {
    this.logger.info('Executing PostChatTypesUseCase with data', { data })

    const { description, name } = data

    // Generate a new UUIDv7 for the chat type
    const newId = Uuid7Util.createUuidv7()
    const seoFriendlyId = SEO.generateSeoFriendlyTitle(name)
    const seoFriendlyBase64IdResult = Uuid7Util.toBase64(newId)
    if (!isString(seoFriendlyBase64IdResult) || seoFriendlyBase64IdResult.length !== 22) {
      throw new Error('Failed to generate a valid base64 ID for the new chat type')
    }
    const seoFriendlyBase64Id: string = seoFriendlyBase64IdResult

    const dataInput: PostChatTypesInsert = {
      id: newId,
      name,
      description,
      seoFriendlyId,
      seoFriendlyBase64Id,
    }

    const result = await this.aiChatContent.createChatType(dataInput)

    const auditEntry: CreateAuditLogDTO = {
      userId: auditContext.userId,
      entityType: EntityType.CHAT_TYPE,
      entityId: newId,
      action: AuditAction.CREATE,
      changes: {
        reason: result ? 'creation_successful' : 'creation_unsuccessful',
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent ?? undefined,
    }
    // AuditLogPort.log() never throws per contract
    await this.auditLog.log(auditEntry)

    return result
  }
}
