import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'

export class ExtractDataUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}
  async execute(
    imageBuffer: Buffer,
    auditContext: { ipAddress: string; userAgent: string | null; userId: string | null }
  ): Promise<Record<string, any>> {
    // Use bucket service to upload ZIP or PDFs to bucket

    // bucketService.getUploadURL

    // if successful call the auditLog:

    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.USER,
        entityId: auditContext.userId,
        action: AuditAction.DELETE,
        changes: { reason: 'moved_to_bucket' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for user deletion', error as Error, {
        userId: auditContext.userId,
      })
    }

    // Placeholder implementation
    // In a real implementation, you would process the imageBuffer to extract data
    return {}
  }
}
