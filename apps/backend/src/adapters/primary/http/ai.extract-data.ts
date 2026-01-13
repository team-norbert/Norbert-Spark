import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { UnprocessableEntityException } from '../../../shared/exceptions/unprocessable-entity.exception.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'

interface InitUploadBody {
  filename: string
  fileSize: number
  mimeType: string
  totalChunks: number
}

interface CompleteUploadBody {
  uploadId: string
  filename: string
}

export class AIExtractDataController {
  constructor(private readonly logger: LoggerPort) {}

  registerRoutes(app: FastifyInstance): void {
    // Initialize multipart upload
    app.post(
      '/ai/extract-data',
      {
        preHandler: [authMiddleware],
      },
      this.initializeUpload.bind(this)
    )
  }

  async initializeUpload(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { filename, fileSize, mimeType, totalChunks } = request.body as InitUploadBody

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      this.logger.info('Initializing multipart upload', {
        filename,
        fileSize,
        mimeType,
        totalChunks,
      })

      // Validate file type - only PDF and ZIP files are allowed
      const allowedMimeTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ]
      const fileExtension = filename.toLowerCase().split('.').pop()
      const allowedExtensions = ['pdf', 'zip']

      if (
        !allowedMimeTypes.includes(mimeType) &&
        !allowedExtensions.includes(fileExtension || '')
      ) {
        this.logger.warn('Invalid file type rejected', { filename, mimeType, fileExtension })
        throw new UnprocessableEntityException(
          'Invalid file type. Only PDF and ZIP files are allowed.'
        )
      }

      return reply.status(200).send({
        success: true,
        message: 'Upload initialized successfully',
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
