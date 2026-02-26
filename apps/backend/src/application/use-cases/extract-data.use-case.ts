import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { UnprocessableEntityException } from '../../shared/exceptions/unprocessable-entity.exception.js'
import { ExtractDataDto } from '../dtos/extract-data.dto.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
/**
 * Detects the type of a file by inspecting its magic bytes (file signature).
 *
 * Recognised signatures:
 * - **PDF** — `%PDF` (`0x25 0x50 0x44 0x46`) at offset 0
 * - **ZIP** — `PK` (`0x50 0x4B`) at offset 0, followed by `0x03 0x04`,
 *   `0x05 0x06`, or `0x07 0x08` at offsets 2–3
 *
 * @param buffer - The raw file bytes to inspect. At least 4 bytes are required;
 *   shorter buffers always return `'unknown'`.
 * @returns `'pdf'` | `'zip'` | `'unknown'`.
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

/**
 * Application use-case — retrieves a file from object storage and validates
 * its type before returning the raw buffer to the caller.
 *
 * Orchestrates three steps:
 * 1. Fetches the file bytes from the configured bucket via {@link BucketPort}.
 * 2. Validates the file type by inspecting magic bytes with
 *    {@link detectFileType}. Only `pdf` and `zip` files are accepted;
 *    all others throw an {@link UnprocessableEntityException}.
 * 3. Writes a `FETCH` audit log entry via {@link AuditLogPort} regardless of
 *    outcome (success and failure are both recorded).
 *
 * **Supported file types:** PDF, ZIP
 */
export class ExtractDataUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}

  /**
   * Fetches a file from the bucket, detects its type, and returns the buffer.
   *
   * On success an audit entry is written with `reason: 'get_from_bucket'` and
   * the detected `fileType`. On failure an audit entry is written with
   * `reason: 'get_from_bucket_failed'` and the original error is re-thrown so
   * the caller (e.g. {@link AIExtractDataController}) can map it to an HTTP
   * status code.
   *
   * @param GetObjectCommandKeys - DTO containing the `bucketName` and `fileKey`
   *   that identify the object in storage.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise resolving to `{ buffer: Uint8Array, fileType: 'pdf' | 'zip' }`.
   *
   * @throws {UnprocessableEntityException} When the file is not found in the
   *   bucket (`422`) or the detected file type is not PDF or ZIP (`422`).
   * @throws Re-throws any other error thrown by {@link BucketPort.getFileUrl}.
   *
   * @example
   * const { buffer, fileType } = await extractDataUseCase.execute(
   *   { bucketName: 'uploads', fileKey: 'docs/report.pdf' },
   *   auditContext
   * )
   * // fileType === 'pdf'
   */
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
        changes: { reason: 'get_from_bucket', fileType },
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
        changes: { reason: 'get_from_bucket_failed' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
      throw error
    }
  }
}
