import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { uuidv7 } from 'uuidv7'
import type { MultipartFile } from '@fastify/multipart'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { LoginFailedChanges } from '../../domain/audit/audit-changes.types.js'

/**
 * Describes a single pre-signed S3 PUT URL generated for a file upload.
 */
interface PresignedUploadUrl {
  /** The original filename supplied by the caller. */
  filename: string
  /** The time-limited pre-signed URL the client should use to PUT the file. */
  uploadUrl: string
  /**
   * The object key under which the file will be stored in the bucket.
   * Format: `data-extraction/<uuidv7>/<filename>`.
   */
  fileKey: string
}

/**
 * Application use-case — generates pre-signed S3 PUT URLs for one or more
 * file uploads.
 *
 * Orchestrates three steps:
 * 1. Validates that the `BUCKET` environment variable is configured; throws
 *    {@link InternalErrorException} if it is missing.
 * 2. For each file in the batch, assigns a UUIDv7-based object key
 *    (`data-extraction/<uuidv7>/<filename>`) and calls
 *    {@link BucketPort.getUploadURL} to generate a pre-signed URL with a
 *    1-hour (3600 s) expiry.
 * 3. Writes a `CREATE` audit log entry via {@link AuditLogPort} recording the
 *    file count and metadata (fire-and-forget; audit failures never propagate).
 *
 * This use-case is called from
 * {@link AIExtractDataController.generatePresignedUrls} to serve the
 * `POST /ai/extract-data/generate-presigned-urls` endpoint.
 */
export class PresignedUploadUrlUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}

  /**
   * Generates pre-signed PUT URLs for all supplied files and writes an audit
   * log entry.
   *
   * Each file receives a unique object key of the form
   * `data-extraction/<uuidv7>/<filename>`. The pre-signed URL expires after
   * **3600 seconds** (1 hour).
   *
   * On error the exception is logged and re-thrown so the calling controller
   * can map it to an appropriate HTTP status code. No partial results are
   * returned — if any URL generation fails the entire operation is aborted.
   *
   * @param files - The multipart files for which to generate upload URLs.
   *   Each entry must have `filename` and `mimetype` fields.
   * @param auditContext - Caller context used to populate the audit log entry
   *   (`userId`, `ipAddress`, `userAgent`).
   * @returns A promise resolving to `{ uploadUrls }` where each entry
   *   contains the original `filename`, the pre-signed `uploadUrl`, and the
   *   assigned `fileKey`.
   *
   * @throws {InternalErrorException} When the `BUCKET` environment variable
   *   is not configured (`500`).
   * @throws Re-throws any error thrown by {@link BucketPort.getUploadURL}.
   *
   * @example
   * const { uploadUrls } = await presignedUploadUrlUseCase.execute(files, auditContext)
   * // uploadUrls[0].uploadUrl — PUT this URL to upload the file
   * // uploadUrls[0].fileKey  — pass to ExtractDataUseCase to retrieve the file
   */
  async execute(
    files: MultipartFile[],
    auditContext: AuditContext
  ): Promise<{ uploadUrls: PresignedUploadUrl[] }> {
    const bucketName = EnvConfig.BUCKET
    const uploadUrls: PresignedUploadUrl[] = []

    try {
      if (!bucketName) {
        this.logger.error('BUCKET environment variable is not configured')
        throw new InternalErrorException('Bucket configuration is missing')
      }

      // Generate presigned URLs for each file
      for (const file of files) {
        const fileId = uuidv7()
        const fileKey = `data-extraction/${fileId}/${file.filename}`

        this.logger.info('Generating presigned URL for file', {
          filename: file.filename,
          fileKey,
          mimetype: file.mimetype,
        })

        // Generate presigned URL with 1 hour expiration
        const uploadUrl = await this.bucketService.getUploadURL(bucketName, fileKey, 3600)

        uploadUrls.push({
          filename: file.filename,
          uploadUrl,
          fileKey,
        })
      }

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.USER,
        entityId: auditContext.userId,
        action: AuditAction.CREATE,
        changes: {
          action: 'data_extraction_upload_initialized',
          fileCount: files.length,
          files: files.map((f) => ({
            filename: f.filename,
            mimetype: f.mimetype,
          })),
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)

      this.logger.info('Presigned URLs generated successfully', {
        fileCount: uploadUrls.length,
      })

      return { uploadUrls }
    } catch (error) {
      this.logger.error('Error generating presigned URLs', error as Error, {
        userId: auditContext.userId,
        fileCount: files.length,
      })
      throw error
    }
  }
}
