import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { BucketPort } from '../../../src/application/ports/bucket.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { PresignedUploadUrlUseCase } from '../../../src/application/use-cases/presigned-url-put.use-case.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

// Mock EnvConfig
vi.mock('../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    BUCKET: 'test-bucket',
  },
}))

describe('PresignedUploadUrlUseCase', () => {
  let useCase: PresignedUploadUrlUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockBucketService: BucketPort

  // Standard audit context for tests
  const auditContext = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-user-agent',
    userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Create mock implementations
    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockBucketService = {
      bucketExists: vi.fn(),
      createBucket: vi.fn(),
      uploadFile: vi.fn(),
      getFileUrl: vi.fn(),
      getLoadURL: vi.fn(),
      getUploadURL: vi.fn().mockResolvedValue('https://r2.example.com/presigned-url'),
    }

    // Create use case instance with mocks
    useCase = new PresignedUploadUrlUseCase(mockLogger, mockAuditLog, mockBucketService)
  })

  describe('execute()', () => {
    describe('successful operations', () => {
      it('should generate presigned URL for single file', async () => {
        const files = [{ filename: 'document.pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(1)
        expect(result.uploadUrls[0]!).toMatchObject({
          filename: 'document.pdf',
          uploadUrl: 'https://r2.example.com/presigned-url',
        })
        expect(result.uploadUrls[0]!.fileKey).toMatch(/^data-extraction\/[^/]+\/document\.pdf$/)
      })

      it('should generate presigned URLs for multiple files', async () => {
        const files = [
          { filename: 'document1.pdf', mimetype: 'application/pdf' },
          { filename: 'document2.pdf', mimetype: 'application/pdf' },
          { filename: 'archive.zip', mimetype: 'application/zip' },
        ] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(3)
        expect(result.uploadUrls[0]!.filename).toBe('document1.pdf')
        expect(result.uploadUrls[1]!.filename).toBe('document2.pdf')
        expect(result.uploadUrls[2]!.filename).toBe('archive.zip')
      })

      it('should call bucketService.getUploadURL with correct parameters', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockBucketService.getUploadURL).toHaveBeenCalledTimes(1)
        expect(mockBucketService.getUploadURL).toHaveBeenCalledWith(
          'test-bucket',
          expect.stringMatching(/^data-extraction\/[^/]+\/test\.pdf$/),
          3600
        )
      })

      it('should generate unique file keys for each file', async () => {
        const files = [
          { filename: 'test.pdf', mimetype: 'application/pdf' },
          { filename: 'test.pdf', mimetype: 'application/pdf' },
        ] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.fileKey).not.toBe(result.uploadUrls[1]!.fileKey)
      })

      it('should log file information when generating presigned URLs', async () => {
        const files = [{ filename: 'document.pdf', mimetype: 'application/pdf' }] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Generating presigned URL for file',
          expect.objectContaining({
            filename: 'document.pdf',
            mimetype: 'application/pdf',
            fileKey: expect.stringMatching(/^data-extraction\/[^/]+\/document\.pdf$/),
          })
        )
      })

      it('should log success message with file count', async () => {
        const files = [
          { filename: 'file1.pdf', mimetype: 'application/pdf' },
          { filename: 'file2.pdf', mimetype: 'application/pdf' },
        ] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockLogger.info).toHaveBeenCalledWith('Presigned URLs generated successfully', {
          event: 'presigned_url.generate.success',
          fileCount: 2,
        })
      })

      it('should create audit log with correct data', async () => {
        const files = [
          { filename: 'doc1.pdf', mimetype: 'application/pdf' },
          { filename: 'doc2.zip', mimetype: 'application/zip' },
        ] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.USER,
          entityId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          action: AuditAction.CREATE,
          changes: {
            action: 'data_extraction_upload_initialized',
            fileCount: 2,
            files: [
              { filename: 'doc1.pdf', mimetype: 'application/pdf' },
              { filename: 'doc2.zip', mimetype: 'application/zip' },
            ],
          },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })

      it('should handle null userId in audit context', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any
        const contextWithNullUser = {
          ...auditContext,
          userId: null,
        }

        await useCase.execute(files, contextWithNullUser, 'data-extraction')

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: null,
            entityId: null,
          })
        )
      })

      it('should handle null userAgent in audit context', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any
        const contextWithNullUserAgent = {
          ...auditContext,
          userAgent: null,
        }

        await useCase.execute(files, contextWithNullUserAgent, 'data-extraction')

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: undefined,
          })
        )
      })

      it('should preserve file order in results', async () => {
        const files = [
          { filename: 'first.pdf', mimetype: 'application/pdf' },
          { filename: 'second.zip', mimetype: 'application/zip' },
          { filename: 'third.pdf', mimetype: 'application/pdf' },
        ] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.filename).toBe('first.pdf')
        expect(result.uploadUrls[1]!.filename).toBe('second.zip')
        expect(result.uploadUrls[2]!.filename).toBe('third.pdf')
      })
    })

    describe('error handling', () => {
      it('should throw error when BUCKET is not configured', async () => {
        vi.spyOn(EnvConfig, 'BUCKET', 'get').mockReturnValue('')
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        await expect(useCase.execute(files, auditContext, 'data-extraction')).rejects.toThrow(
          'Bucket configuration is missing'
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'BUCKET environment variable is not configured',
          undefined,
          { event: 'presigned_url.config.missing' }
        )
      })

      it('should throw error when BUCKET is undefined', async () => {
        vi.spyOn(EnvConfig, 'BUCKET', 'get').mockReturnValue(undefined as any)
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        await expect(useCase.execute(files, auditContext, 'data-extraction')).rejects.toThrow(
          'Bucket configuration is missing'
        )
      })

      it('should throw error when bucketService.getUploadURL fails', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any
        const error = new Error('S3 service unavailable')
        vi.mocked(mockBucketService.getUploadURL).mockRejectedValue(error)

        await expect(useCase.execute(files, auditContext, 'data-extraction')).rejects.toThrow(
          'S3 service unavailable'
        )
      })

      it('should log error with context when generation fails', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any
        const error = new Error('Network error')
        vi.mocked(mockBucketService.getUploadURL).mockRejectedValue(error)

        await expect(useCase.execute(files, auditContext, 'data-extraction')).rejects.toThrow(
          'Network error'
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          error,
          expect.objectContaining({
            userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
            fileCount: 1,
          })
        )
      })

      it('should handle partial failure - throw on first error', async () => {
        const files = [
          { filename: 'file1.pdf', mimetype: 'application/pdf' },
          { filename: 'file2.pdf', mimetype: 'application/pdf' },
        ] as any

        vi.mocked(mockBucketService.getUploadURL)
          .mockResolvedValueOnce('https://r2.example.com/url1')
          .mockRejectedValueOnce(new Error('Failed on second file'))

        await expect(useCase.execute(files, auditContext, 'data-extraction')).rejects.toThrow(
          'Failed on second file'
        )
      })
    })

    describe('edge cases', () => {
      it('should handle empty files array', async () => {
        const files = [] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(0)
        expect(mockBucketService.getUploadURL).not.toHaveBeenCalled()
      })

      it('should handle files with special characters in filename', async () => {
        const files = [{ filename: 'my document (1).pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.filename).toBe('my document (1).pdf')
        expect(result.uploadUrls[0]!.fileKey).toContain('my document (1).pdf')
      })

      it('should handle files with unicode characters in filename', async () => {
        const files = [{ filename: 'документ.pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.filename).toBe('документ.pdf')
      })

      it('should handle very long filenames', async () => {
        const longFilename = 'a'.repeat(200) + '.pdf'
        const files = [{ filename: longFilename, mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.filename).toBe(longFilename)
      })

      it('should handle large number of files', async () => {
        const files = Array(100)
          .fill(null)
          .map((_, i) => ({
            filename: `document${i}.pdf`,
            mimetype: 'application/pdf',
          })) as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(100)
        expect(mockBucketService.getUploadURL).toHaveBeenCalledTimes(100)
      })

      it('should handle different MIME types', async () => {
        const files = [
          { filename: 'doc.pdf', mimetype: 'application/pdf' },
          { filename: 'archive.zip', mimetype: 'application/zip' },
          { filename: 'compressed.zip', mimetype: 'application/x-zip-compressed' },
        ] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(3)
      })

      it('should handle files with same name but different extensions', async () => {
        const files = [
          { filename: 'document.pdf', mimetype: 'application/pdf' },
          { filename: 'document.zip', mimetype: 'application/zip' },
        ] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls).toHaveLength(2)
        expect(result.uploadUrls[0]!.fileKey).not.toBe(result.uploadUrls[1]!.fileKey)
      })
    })

    describe('audit logging', () => {
      it('should include file metadata in audit log', async () => {
        const files = [
          { filename: 'report.pdf', mimetype: 'application/pdf' },
          { filename: 'data.zip', mimetype: 'application/zip' },
        ] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: expect.objectContaining({
              files: [
                { filename: 'report.pdf', mimetype: 'application/pdf' },
                { filename: 'data.zip', mimetype: 'application/zip' },
              ],
            }),
          })
        )
      })
    })

    describe('logging', () => {
      it('should log info for each file being processed', async () => {
        const files = [
          { filename: 'file1.pdf', mimetype: 'application/pdf' },
          { filename: 'file2.zip', mimetype: 'application/zip' },
        ] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Generating presigned URL for file',
          expect.objectContaining({ filename: 'file1.pdf' })
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Generating presigned URL for file',
          expect.objectContaining({ filename: 'file2.zip' })
        )
      })

      it('should include fileKey in log messages', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Generating presigned URL for file',
          expect.objectContaining({
            fileKey: expect.any(String),
          })
        )
      })

      it('should log final success with correct file count', async () => {
        const files = Array(5)
          .fill(null)
          .map((_, i) => ({
            filename: `file${i}.pdf`,
            mimetype: 'application/pdf',
          })) as any

        await useCase.execute(files, auditContext, 'data-extraction')

        expect(mockLogger.info).toHaveBeenCalledWith('Presigned URLs generated successfully', {
          event: 'presigned_url.generate.success',
          fileCount: 5,
        })
      })
    })

    describe('file key generation', () => {
      it('should generate file keys with data-extraction prefix', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.fileKey).toMatch(/^data-extraction\//)
      })

      it('should include UUID in file key', async () => {
        const files = [{ filename: 'test.pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        // UUIDv7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
        expect(result.uploadUrls[0]!.fileKey).toMatch(
          /^data-extraction\/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\//
        )
      })

      it('should end with original filename', async () => {
        const files = [{ filename: 'my-document.pdf', mimetype: 'application/pdf' }] as any

        const result = await useCase.execute(files, auditContext, 'data-extraction')

        expect(result.uploadUrls[0]!.fileKey).toMatch(/\/my-document\.pdf$/)
      })
    })
  })
})
