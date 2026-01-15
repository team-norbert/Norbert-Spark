import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import { ExtractDataDto } from '../dtos/extract-data.dto.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'

export class ExtractDataUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}

  async execute(
    GetObjectCommandKeys: ExtractDataDto,
    auditContext: { ipAddress: string; userAgent: string | null; userId: string | null }
  ) {
    this.logger.info('Starting data extraction from file', {
      fileKey: GetObjectCommandKeys.fileKey,
    })

    try {
      const result = await this.bucketService.getFileUrl(
        GetObjectCommandKeys.bucketName,
        GetObjectCommandKeys.fileKey
      )

      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.DATA_EXTRACTION,
        entityId: GetObjectCommandKeys.fileKey,
        action: AuditAction.FETCH,
        changes: { reason: 'get_from_bucket' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })

      return result
    } catch (error) {
      this.logger.error(
        'Error during data extraction',
        error instanceof Error ? error : new Error(String(error))
      )
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.DATA_EXTRACTION,
        entityId: GetObjectCommandKeys.fileKey,
        action: AuditAction.FETCH,
        changes: { reason: 'get_from_bucket_failed' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    }
  }
}
