import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIExtractDataController } from '../../../../src/adapters/primary/http/ai.extract-data.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { PresignedUploadUrlUseCase } from '../../../../src/application/use-cases/presigned-url-put.use-case.js'
import { UnprocessableEntityException } from '../../../../src/shared/exceptions/unprocessable-entity.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'
import {
  sanitizeFilename,
  validateFileExtension,
  validateMimeType,
} from '../../../../src/shared/utils/security-validation.util.js'

// Mock the security validation utilities
vi.mock('../../../../src/shared/utils/security-validation.util.js', () => ({
  sanitizeFilename: vi.fn(),
  validateFileExtension: vi.fn(),
  validateMimeType: vi.fn(),
}))

// Mock auth middleware
vi.mock('../../../../src/infrastructure/http/middleware/auth.middleware.js', () => ({
  authMiddleware: vi.fn((_request, _reply, done) => done()),
}))

// Helper to set up default mock implementations
function setupDefaultMocks() {
  vi.mocked(sanitizeFilename).mockImplementation((filename: string) => {
    if (!filename || typeof filename !== 'string') {
      throw new ValidationException('Filename is required')
    }
    if (filename.includes('..') || filename.includes('/')) {
      return filename.replace(/\.\./g, '').replace(/\//g, '')
    }
    return filename
  })

  vi.mocked(validateFileExtension).mockImplementation(
    (filename: string, allowedExtensions: string[]) => {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (!ext || !allowedExtensions.includes(ext)) {
        throw new ValidationException(
          `Invalid file extension: .${ext}. Allowed: ${allowedExtensions.map((e) => `.${e}`).join(', ')}`
        )
      }
      return true
    }
  )

  vi.mocked(validateMimeType).mockImplementation((mimeType: string, allowedMimeTypes: string[]) => {
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new ValidationException(
        `Invalid MIME type: ${mimeType}. Allowed: ${allowedMimeTypes.join(', ')}`
      )
    }
    return true
  })
}

describe('AIExtractDataController', () => {
  let controller: AIExtractDataController
  let mockPresignedUploadUrlUseCase: PresignedUploadUrlUseCase
  let mockExtractDataUseCase: any
  let mockLogger: LoggerPort
  let mockPdfUtils: any
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default mock implementations
    setupDefaultMocks()

    // Create mock use case
    mockPresignedUploadUrlUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create mock ExtractDataUseCase
    mockExtractDataUseCase = {
      execute: vi.fn(),
    }

    // Create mock PDFUtils
    mockPdfUtils = {
      extractFromBuffer: vi.fn(),
    }

    // Create controller instance
    controller = new AIExtractDataController(
      mockLogger,
      mockPresignedUploadUrlUseCase,
      mockExtractDataUseCase,
      mockPdfUtils
    )

    // Create mock Fastify reply with chainable methods
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
    } as any

    // Create mock Fastify request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-user-agent',
      },
      user: {
        sub: uuidv7(),
        email: 'user@example.com',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      const instance = new AIExtractDataController(
        mockLogger,
        mockPresignedUploadUrlUseCase,
        mockExtractDataUseCase,
        mockPdfUtils
      )

      expect(instance).toBeInstanceOf(AIExtractDataController)
      expect(instance).toBeDefined()
    })

    it('should accept LoggerPort and PresignedUploadUrlUseCase as dependencies', () => {
      const instance = new AIExtractDataController(
        mockLogger,
        mockPresignedUploadUrlUseCase,
        mockExtractDataUseCase,
        mockPdfUtils
      )

      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AIExtractDataController)
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /ai/presigned-urls route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.post).toHaveBeenCalledWith(
        '/ai/presigned-urls',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should register route with auth middleware', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const routeOptions = (mockApp.post as any).mock.calls[0][1]
      expect(routeOptions.preHandler).toBeDefined()
      expect(Array.isArray(routeOptions.preHandler)).toBe(true)
    })

    it('should bind controller context to route handler', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // The handler should be bound to the controller
      const handler = (mockApp.post as any).mock.calls[0][2]
      expect(typeof handler).toBe('function')
    })
  })

  describe('generatePresignedUrls()', () => {
    describe('successful operations', () => {
      it('should generate presigned URLs for valid PDF file', async () => {
        const mockResult = {
          uploadUrls: [
            {
              filename: 'document.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url',
              fileKey: 'data-extraction/uuid/document.pdf',
            },
          ],
        }

        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
          message: 'Presigned URLs generated successfully',
        })
      })

      it('should generate presigned URLs for valid ZIP file', async () => {
        const mockResult = {
          uploadUrls: [
            {
              filename: 'archive.zip',
              uploadUrl: 'https://r2.example.com/presigned-url',
              fileKey: 'data-extraction/uuid/archive.zip',
            },
          ],
        }

        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'archive.zip', mimetype: 'application/zip' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
          message: 'Presigned URLs generated successfully',
        })
      })

      it('should generate presigned URLs for multiple valid files', async () => {
        const mockResult = {
          uploadUrls: [
            {
              filename: 'document1.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url-1',
              fileKey: 'data-extraction/uuid1/document1.pdf',
            },
            {
              filename: 'document2.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url-2',
              fileKey: 'data-extraction/uuid2/document2.pdf',
            },
          ],
        }

        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [
            { filename: 'document1.pdf', mimetype: 'application/pdf' },
            { filename: 'document2.pdf', mimetype: 'application/pdf' },
          ],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
          message: 'Presigned URLs generated successfully',
        })
      })

      it('should accept application/x-zip-compressed MIME type', async () => {
        const mockResult = {
          uploadUrls: [
            {
              filename: 'archive.zip',
              uploadUrl: 'https://r2.example.com/presigned-url',
              fileKey: 'data-extraction/uuid/archive.zip',
            },
          ],
        }

        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'archive.zip', mimetype: 'application/x-zip-compressed' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
      })

      it('should log file information when generating presigned URLs', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Generating presigned URLs from metadata',
          expect.objectContaining({
            fileCount: 1,
            files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
          })
        )
      })

      it('should pass audit context to use case', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        const userId = uuidv7()
        mockRequest = {
          body: {
            files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
          },
          params: {},
          query: {},
          ip: '192.168.1.1',
          headers: { 'user-agent': 'TestAgent/1.0' },
          user: { sub: userId, email: 'test@example.com' },
        } as any

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockPresignedUploadUrlUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: userId,
            ipAddress: '192.168.1.1',
            userAgent: 'TestAgent/1.0',
          })
        )
      })

      it('should handle request without user (null userId)', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }
        mockRequest.user = undefined

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockPresignedUploadUrlUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: null,
          })
        )
      })

      it('should handle missing user-agent header', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }
        mockRequest.headers = {}

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockPresignedUploadUrlUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userAgent: null,
          })
        )
      })
    })

    describe('validation errors', () => {
      it('should return 422 when body is undefined', async () => {
        mockRequest.body = undefined

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No files provided. Expected { files: [...] }',
        })
      })

      it('should return 422 when files array is missing', async () => {
        mockRequest.body = {}

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No files provided. Expected { files: [...] }',
        })
      })

      it('should return 422 when files is not an array', async () => {
        mockRequest.body = { files: 'not-an-array' }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No files provided. Expected { files: [...] }',
        })
      })

      it('should return 422 when files array is empty', async () => {
        mockRequest.body = { files: [] }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No files provided. Expected { files: [...] }',
        })
      })

      it('should return 422 when file is missing filename', async () => {
        mockRequest.body = {
          files: [{ mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Each file must have filename and mimetype properties',
        })
      })

      it('should return 422 when file is missing mimetype', async () => {
        mockRequest.body = {
          files: [{ filename: 'document.pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Each file must have filename and mimetype properties',
        })
      })

      it('should return 422 when file has empty filename', async () => {
        mockRequest.body = {
          files: [{ filename: '', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Each file must have filename and mimetype properties',
        })
      })

      it('should return 422 when file has empty mimetype', async () => {
        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: '' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Each file must have filename and mimetype properties',
        })
      })

      it('should return 422 for invalid file extension', async () => {
        vi.mocked(validateFileExtension).mockImplementation(() => {
          throw new ValidationException('Invalid file extension: .exe. Allowed: .pdf, .zip')
        })

        mockRequest.body = {
          files: [{ filename: 'malware.exe', mimetype: 'application/octet-stream' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid file: malware.exe'),
        })
      })

      it('should return 422 for invalid MIME type', async () => {
        vi.mocked(validateMimeType).mockImplementation(() => {
          throw new ValidationException('Invalid MIME type: text/plain')
        })

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'text/plain' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid file: document.pdf'),
        })
      })

      it('should log warning for validation failures', async () => {
        vi.mocked(validateFileExtension).mockImplementation(() => {
          throw new ValidationException('Invalid file extension')
        })

        mockRequest.body = {
          files: [{ filename: 'script.js', mimetype: 'application/javascript' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'File validation failed',
          expect.objectContaining({
            filename: 'script.js',
            mimeType: 'application/javascript',
          })
        )
      })
    })

    describe('security validation', () => {
      it('should sanitize filenames with path traversal attempts', async () => {
        mockRequest.body = {
          files: [{ filename: '../../../etc/passwd.pdf', mimetype: 'application/pdf' }],
        }

        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(sanitizeFilename).toHaveBeenCalledWith('../../../etc/passwd.pdf')
      })

      it('should validate file extension against allowlist', async () => {
        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(validateFileExtension).toHaveBeenCalledWith('document.pdf', ['pdf', 'zip'])
      })

      it('should validate MIME type against allowlist', async () => {
        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(validateMimeType).toHaveBeenCalledWith('application/pdf', [
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
        ])
      })

      it('should process all files and fail fast on first invalid file', async () => {
        // First call succeeds, second fails
        vi.mocked(validateFileExtension)
          .mockReturnValueOnce(true)
          .mockImplementationOnce(() => {
            throw new ValidationException('Invalid file extension')
          })

        mockRequest.body = {
          files: [
            { filename: 'valid.pdf', mimetype: 'application/pdf' },
            { filename: 'invalid.exe', mimetype: 'application/octet-stream' },
          ],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
      })
    })

    describe('error handling', () => {
      it('should return 500 for unexpected errors', async () => {
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockRejectedValue(
          new Error('Database error')
        )

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          expect.any(Error)
        )
      })

      it('should return appropriate status code for BaseException errors', async () => {
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockRejectedValue(
          new UnprocessableEntityException('Custom validation error')
        )

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Custom validation error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          expect.any(Error)
        )
      })

      it('should handle error without message', async () => {
        const errorWithoutMessage = new Error()
        errorWithoutMessage.message = ''
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockRejectedValue(errorWithoutMessage)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to generate presigned URLs due to a database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          expect.any(Error)
        )
      })

      it('should handle null error', async () => {
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockRejectedValue(null)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to generate presigned URLs due to a database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          expect.any(Error)
        )
      })

      it('should return a safe error message when a DrizzleQueryError is thrown', async () => {
        const drizzleError = new DrizzleQueryError('SELECT chat_id FROM chats WHERE id = $1', [])
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockRejectedValue(drizzleError)

        mockRequest.body = {
          files: [{ filename: 'document.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to generate presigned URLs due to a database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error generating presigned URLs',
          expect.any(Error)
        )
      })
    })

    describe('edge cases', () => {
      it('should handle files with special characters in filename', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'my file (1).pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
      })

      it('should handle files with unicode characters in filename', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [{ filename: 'документ.pdf', mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
      })

      it('should handle very long filenames', async () => {
        const mockResult = { uploadUrls: [] }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        const longFilename = 'a'.repeat(200) + '.pdf'
        mockRequest.body = {
          files: [{ filename: longFilename, mimetype: 'application/pdf' }],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
      })

      it('should handle large number of files', async () => {
        const mockResult = {
          uploadUrls: Array(100)
            .fill(null)
            .map((_, i) => ({
              filename: `document${i}.pdf`,
              uploadUrl: `https://r2.example.com/presigned-url-${i}`,
              fileKey: `data-extraction/uuid${i}/document${i}.pdf`,
            })),
        }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: Array(100)
            .fill(null)
            .map((_, i) => ({
              filename: `document${i}.pdf`,
              mimetype: 'application/pdf',
            })),
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
        expect(mockPresignedUploadUrlUseCase.execute).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ filename: 'document0.pdf' })]),
          expect.any(Object)
        )
      })

      it('should handle mixed valid file types', async () => {
        const mockResult = {
          uploadUrls: [
            {
              filename: 'document.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url-1',
              fileKey: 'data-extraction/uuid1/document.pdf',
            },
            {
              filename: 'archive.zip',
              uploadUrl: 'https://r2.example.com/presigned-url-2',
              fileKey: 'data-extraction/uuid2/archive.zip',
            },
          ],
        }
        vi.mocked(mockPresignedUploadUrlUseCase.execute).mockResolvedValue(mockResult)

        mockRequest.body = {
          files: [
            { filename: 'document.pdf', mimetype: 'application/pdf' },
            { filename: 'archive.zip', mimetype: 'application/zip' },
          ],
        }

        await controller.generatePresignedUrls(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
      })
    })
  })
})
