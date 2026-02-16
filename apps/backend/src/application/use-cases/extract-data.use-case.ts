import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import { ExtractDataDto } from '../dtos/extract-data.dto.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { UnprocessableEntityException } from '../../shared/exceptions/unprocessable-entity.exception.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { FileUploadChanges } from '../../domain/audit/audit-changes.types.js'
/**
 * Detect file type from buffer by checking magic bytes (file signature)
 */
function detectFileType(buffer: Uint8Array): 'pdf' | 'zip' | 'unknown' {
  if (buffer.length < 4) {
    return 'unknown'
  }

  // PDF magic bytes: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf'
  }

  // ZIP magic bytes: PK (50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    if (
      (buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08)
    ) {
      return 'zip'
    }
  }

  return 'unknown'
}

export class ExtractDataUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}

  async execute(GetObjectCommandKeys: ExtractDataDto, auditContext: AuditContext) {
    this.logger.info('Starting data extraction from file', {
      fileKey: GetObjectCommandKeys.fileKey,
    })

    try {
      const result = await this.bucketService.getFileUrl(
        GetObjectCommandKeys.bucketName,
        GetObjectCommandKeys.fileKey
      )

      if (!result) {
        throw new UnprocessableEntityException('File not found in bucket')
      }

      // Detect file type from buffer
      const fileType = detectFileType(result)

      if (fileType === 'unknown') {
        throw new UnprocessableEntityException(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      }

      this.logger.info('File type detected', {
        fileKey: GetObjectCommandKeys.fileKey,
        fileType,
      })

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.DATA_EXTRACTION,
        entityId: GetObjectCommandKeys.fileKey,
        action: AuditAction.FETCH,
        changes: { reason: 'get_from_bucket', fileType } satisfies FileUploadChanges,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)

      return { buffer: result, fileType }
    } catch (error) {
      this.logger.error(
        'Error during data extraction',
        error instanceof Error ? error : new Error(String(error))
      )

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.DATA_EXTRACTION,
        entityId: GetObjectCommandKeys.fileKey,
        action: AuditAction.FETCH,
        changes: { reason: 'get_from_bucket_failed' } satisfies FileUploadChanges,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
      throw error
    }
  }
}
