import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { BucketPort } from '../ports/bucket.service.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { uuidv7 } from 'uuidv7'
import type { MultipartFile } from '@fastify/multipart'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'

interface PresignedUploadUrl {
  filename: string
  uploadUrl: string
  fileKey: string
}

export class PresignedUploadUrlUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly bucketService: BucketPort
  ) {}

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

      try {
        await this.auditLog.log({
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
        })
      } catch (error) {
        this.logger.error('Error logging audit for data extraction upload', error as Error, {
          userId: auditContext.userId,
        })
      }

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
