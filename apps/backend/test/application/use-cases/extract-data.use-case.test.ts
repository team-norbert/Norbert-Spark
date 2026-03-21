import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExtractDataDto } from '../../../src/application/dtos/extract-data.dto.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { BucketPort } from '../../../src/application/ports/bucket.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { ExtractDataUseCase } from '../../../src/application/use-cases/extract-data.use-case.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { UnprocessableEntityException } from '../../../src/shared/exceptions/unprocessable-entity.exception.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('ExtractDataUseCase', () => {
  let useCase: ExtractDataUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockBucketService: BucketPort

  // Standard audit context for tests
  const auditContext = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-user-agent',
    userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
  }

  // Helper function to create PDF buffer
  const createPdfBuffer = (): Uint8Array => {
    // PDF magic bytes: %PDF (25 50 44 46)
    return new Uint8Array([0x25, 0x50, 0x44, 0x46, ...Array(100).fill(0)])
  }

  // Helper function to create ZIP buffer
  const createZipBuffer = (): Uint8Array => {
    // ZIP magic bytes: PK (50 4B 03 04)
    return new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)])
  }

  // Helper function to create invalid buffer
  const createInvalidBuffer = (): Uint8Array => {
    return new Uint8Array([0x00, 0x00, 0x00, 0x00, ...Array(100).fill(0)])
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
      getUploadURL: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new ExtractDataUseCase(mockLogger, mockAuditLog, mockBucketService)
  })

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      const instance = new ExtractDataUseCase(mockLogger, mockAuditLog, mockBucketService)

      expect(instance).toBeInstanceOf(ExtractDataUseCase)
      expect(instance).toBeDefined()
    })
  })

  describe('execute()', () => {
    describe('successful operations with PDF files', () => {
      it('should extract PDF file and return buffer with file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toEqual({
          buffer: pdfBuffer,
          fileType: 'pdf',
        })
      })

      it('should call bucketService.getFileUrl with correct parameters', async () => {
        const dto = new ExtractDataDto('my-bucket', 'documents/report.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockBucketService.getFileUrl).toHaveBeenCalledTimes(1)
        expect(mockBucketService.getFileUrl).toHaveBeenCalledWith(
          'my-bucket',
          'documents/report.pdf'
        )
      })

      it('should log info when starting extraction', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Starting data extraction from file', {
          event: 'data_extraction.attempt',
          fileKey: 'path/to/file.pdf',
        })
      })

      it('should log info with detected file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('File type detected', {
          event: 'data_extraction.file_type_detected',
          fileKey: 'path/to/file.pdf',
          fileType: 'pdf',
        })
      })

      it('should create audit log with correct data for PDF', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/document.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/document.pdf',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket', fileType: 'pdf' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })

      it('should handle null userId in audit context', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const nullUserContext = {
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
          userId: null,
        }

        await useCase.execute(dto, nullUserContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: null,
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/file.pdf',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket', fileType: 'pdf' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })

      it('should handle null userAgent in audit context', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const nullAgentContext = {
          ipAddress: '127.0.0.1',
          userAgent: null,
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
        }

        await useCase.execute(dto, nullAgentContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/file.pdf',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket', fileType: 'pdf' },
          ipAddress: '127.0.0.1',
          userAgent: undefined,
        })
      })
    })

    describe('successful operations with ZIP files', () => {
      it('should extract ZIP file and return buffer with file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/archive.zip')
        const zipBuffer = createZipBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(zipBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toEqual({
          buffer: zipBuffer,
          fileType: 'zip',
        })
      })

      it('should log info with ZIP file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/archive.zip')
        const zipBuffer = createZipBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(zipBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('File type detected', {
          event: 'data_extraction.file_type_detected',
          fileKey: 'path/to/archive.zip',
          fileType: 'zip',
        })
      })

      it('should create audit log with correct data for ZIP', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/archive.zip')
        const zipBuffer = createZipBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(zipBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/archive.zip',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket', fileType: 'zip' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })

      it('should handle ZIP file with alternative magic bytes (50 4B 05 06)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/archive.zip')
        const zipBuffer = new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...Array(100).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(zipBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('zip')
      })

      it('should handle ZIP file with alternative magic bytes (50 4B 07 08)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/archive.zip')
        const zipBuffer = new Uint8Array([0x50, 0x4b, 0x07, 0x08, ...Array(100).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(zipBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('zip')
      })
    })

    describe('error handling - file not found', () => {
      it('should throw UnprocessableEntityException when file is not found', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/missing.pdf')
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(undefined)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          UnprocessableEntityException
        )
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('File not found in bucket')
      })

      it('should log error when file is not found', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/missing.pdf')
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(undefined)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error during data extraction',
          expect.any(Error),
          { event: 'data_extraction.failed' }
        )
      })

      it('should create audit log with failure reason', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/missing.pdf')
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(undefined)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/missing.pdf',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket_failed' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })
    })

    describe('error handling - invalid file type', () => {
      it('should throw UnprocessableEntityException for invalid file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.txt')
        const invalidBuffer = createInvalidBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(invalidBuffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          UnprocessableEntityException
        )
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      it('should throw for buffer with less than 4 bytes', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/tiny.pdf')
        const tinyBuffer = new Uint8Array([0x25, 0x50])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(tinyBuffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      it('should log error for invalid file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.txt')
        const invalidBuffer = createInvalidBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(invalidBuffer)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error during data extraction',
          expect.any(Error),
          { event: 'data_extraction.failed' }
        )
      })

      it('should create audit log with failure reason for invalid file type', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.txt')
        const invalidBuffer = createInvalidBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(invalidBuffer)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/file.txt',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket_failed' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })
    })

    describe('error handling - bucket service errors', () => {
      it('should throw error when bucketService.getFileUrl fails', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const bucketError = new Error('S3 service unavailable')
        vi.mocked(mockBucketService.getFileUrl).mockRejectedValue(bucketError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('S3 service unavailable')
      })

      it('should log error when bucket service fails', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const bucketError = new Error('Network error')
        vi.mocked(mockBucketService.getFileUrl).mockRejectedValue(bucketError)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockLogger.error).toHaveBeenCalledWith('Error during data extraction', bucketError, {
          event: 'data_extraction.failed',
        })
      })

      it('should handle non-Error exceptions', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        vi.mocked(mockBucketService.getFileUrl).mockRejectedValue('String error')

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error during data extraction',
          expect.any(Error),
          { event: 'data_extraction.failed' }
        )
      })

      it('should create audit log with failure when bucket service fails', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const bucketError = new Error('Connection timeout')
        vi.mocked(mockBucketService.getFileUrl).mockRejectedValue(bucketError)

        try {
          await useCase.execute(dto, auditContext)
        } catch (_error) {
          // Expected error
        }

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234',
          entityType: EntityType.DATA_EXTRACTION,
          entityId: 'path/to/file.pdf',
          action: AuditAction.FETCH,
          changes: { reason: 'get_from_bucket_failed' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
      })

      it('should rethrow error after logging', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/file.pdf')
        const bucketError = new Error('Fatal error')
        vi.mocked(mockBucketService.getFileUrl).mockRejectedValue(bucketError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(bucketError)
      })
    })

    describe('edge cases', () => {
      it('should handle file with special characters in key', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/my file (1).pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
        expect(mockBucketService.getFileUrl).toHaveBeenCalledWith(
          'test-bucket',
          'path/to/my file (1).pdf'
        )
      })

      it('should handle file with unicode characters in key', async () => {
        const dto = new ExtractDataDto('test-bucket', 'path/to/файл.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
      })

      it('should handle very long file keys', async () => {
        const longKey = 'a'.repeat(500) + '/file.pdf'
        const dto = new ExtractDataDto('test-bucket', longKey)
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
      })

      it('should handle bucket name with hyphens', async () => {
        const dto = new ExtractDataDto('my-production-bucket-2024', 'file.pdf')
        const pdfBuffer = createPdfBuffer()
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        await useCase.execute(dto, auditContext)

        expect(mockBucketService.getFileUrl).toHaveBeenCalledWith(
          'my-production-bucket-2024',
          'file.pdf'
        )
      })

      it('should handle large PDF buffer', async () => {
        const dto = new ExtractDataDto('test-bucket', 'large-file.pdf')
        const largePdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, ...Array(10000).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(largePdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
        expect(result.buffer.length).toBe(10004)
      })

      it('should handle large ZIP buffer', async () => {
        const dto = new ExtractDataDto('test-bucket', 'large-archive.zip')
        const largeZipBuffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...Array(10000).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(largeZipBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('zip')
        expect(result.buffer.length).toBe(10004)
      })
    })

    describe('file type detection', () => {
      it('should correctly detect PDF with exact magic bytes', async () => {
        const dto = new ExtractDataDto('test-bucket', 'document.pdf')
        const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(pdfBuffer)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
      })

      it('should reject file that starts with PK but wrong following bytes', async () => {
        const dto = new ExtractDataDto('test-bucket', 'fake.zip')
        const invalidZipBuffer = new Uint8Array([0x50, 0x4b, 0x00, 0x00, ...Array(100).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(invalidZipBuffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      it('should reject file that has PDF-like bytes but not at start', async () => {
        const dto = new ExtractDataDto('test-bucket', 'fake.pdf')
        const invalidPdfBuffer = new Uint8Array([
          0x00,
          0x25,
          0x50,
          0x44,
          0x46,
          ...Array(100).fill(0),
        ])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(invalidPdfBuffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })
    })

    describe('magic byte near-miss boundary tests', () => {
      // Kills mutant 3549: buffer.length <= 4 instead of < 4
      it('should accept a buffer of exactly 4 bytes with valid PDF magic bytes', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const exactFourBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(exactFourBytes)

        const result = await useCase.execute(dto, auditContext)

        expect(result.fileType).toBe('pdf')
      })

      // Kills mutants 3555, 3556, 3558, 3559, 3560: byte 0 of PDF signature wrong
      it('should reject buffer where only bytes 1–3 match PDF signature (byte 0 differs)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const buffer = new Uint8Array([0x00, 0x50, 0x44, 0x46, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3556, 3562: byte 1 of PDF signature wrong
      it('should reject buffer where only bytes 0, 2, 3 match PDF signature (byte 1 differs)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const buffer = new Uint8Array([0x25, 0x00, 0x44, 0x46, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3556, 3564: byte 2 of PDF signature wrong
      it('should reject buffer where only bytes 0, 1, 3 match PDF signature (byte 2 differs)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const buffer = new Uint8Array([0x25, 0x50, 0x00, 0x46, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3555, 3566: byte 3 of PDF signature wrong
      it('should reject buffer where only bytes 0, 1, 2 match PDF signature (byte 3 differs)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x00, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3557, 3558, 3560: only bytes 2 and 3 match PDF signature
      it('should reject buffer where only bytes 2 and 3 match PDF signature', async () => {
        const dto = new ExtractDataDto('test-bucket', 'file.pdf')
        const buffer = new Uint8Array([0x00, 0x00, 0x44, 0x46, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3570, 3572, 3573: ZIP byte 0 wrong (0x25 instead of 0x50)
      it('should reject buffer where byte 1 matches ZIP PK but byte 0 does not (0x25 0x4b)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x25, 0x4b, 0x03, 0x04, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3570, 3572, 3575: ZIP byte 1 wrong (0x00 instead of 0x4b)
      it('should reject buffer where byte 0 matches ZIP PK but byte 1 does not (0x50 0x00)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x00, 0x03, 0x04, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3584, 3587: ZIP first inner variant with wrong byte 3 (0x03 0x05)
      it('should reject ZIP header where byte 3 mismatches first inner variant (0x03 0x05)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x03, 0x05, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutant 3585: ZIP first inner variant with wrong byte 2 (0x00 0x04)
      it('should reject ZIP header where byte 2 mismatches first inner variant (0x00 0x04)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x00, 0x04, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3590, 3593: ZIP second inner variant with wrong byte 3 (0x05 0x07)
      it('should reject ZIP header where byte 3 mismatches second inner variant (0x05 0x07)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x05, 0x07, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutant 3591: ZIP second inner variant with wrong byte 2 (0x00 0x06)
      it('should reject ZIP header where byte 2 mismatches second inner variant (0x00 0x06)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x00, 0x06, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutants 3596, 3599: ZIP third inner variant with wrong byte 3 (0x07 0x09)
      it('should reject ZIP header where byte 3 mismatches third inner variant (0x07 0x09)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x07, 0x09, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutant 3597: ZIP third inner variant with wrong byte 2 (0x00 0x08)
      it('should reject ZIP header where byte 2 mismatches third inner variant (0x00 0x08)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x00, 0x08, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })

      // Kills mutant 3599: ZIP third inner variant with wrong byte 3 (0x07 0x00)
      it('should reject ZIP header where byte 3 mismatches third inner variant (0x07 0x00)', async () => {
        const dto = new ExtractDataDto('test-bucket', 'archive.zip')
        const buffer = new Uint8Array([0x50, 0x4b, 0x07, 0x00, ...Array(10).fill(0)])
        vi.mocked(mockBucketService.getFileUrl).mockResolvedValue(buffer)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid file type. Only PDF and ZIP files are supported.'
        )
      })
    })
  })
})
