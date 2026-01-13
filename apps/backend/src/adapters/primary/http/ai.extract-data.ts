import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { UnprocessableEntityException } from '../../../shared/exceptions/unprocessable-entity.exception.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { ExtractDataUseCase } from '../../../application/use-cases/extract-data.use-case.js'
import type { MultipartFile } from '@fastify/multipart'

/**
 * File metadata for presigned URL generation
 */
interface FileMetadata {
  filename: string
  mimetype: string
}

/**
 * Request body for presigned URL generation endpoint
 */
interface PresignedUrlRequestBody {
  files: FileMetadata[]
}

export class AIExtractDataController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly extractDataUseCase: ExtractDataUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Initialize multipart upload - using @fastify/multipart for file handling
    app.post(
      '/ai/extract-data',
      {
        preHandler: [authMiddleware],
      },
      this.initializeUpload.bind(this)
    )

    // Generate presigned URLs from file metadata (JSON) - no file upload needed
    app.post(
      '/ai/extract-data/presigned-urls',
      {
        preHandler: [authMiddleware],
      },
      this.generatePresignedUrls.bind(this)
    )
  }

  /**
   * Generate presigned URLs for direct R2 upload from file metadata.
   * This endpoint accepts JSON with file metadata and returns presigned URLs
   * for the client to upload files directly to R2.
   */
  async generatePresignedUrls(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as PresignedUrlRequestBody

      if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
        throw new UnprocessableEntityException('No files provided. Expected { files: [...] }')
      }

      this.logger.info('Generating presigned URLs from metadata', {
        fileCount: body.files.length,
        files: body.files.map((f) => ({ filename: f.filename, mimetype: f.mimetype })),
      })

      // Validate file types - only PDF and ZIP files are allowed
      const allowedMimeTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ]
      const allowedExtensions = ['pdf', 'zip']

      for (const file of body.files) {
        if (!file.filename || !file.mimetype) {
          throw new UnprocessableEntityException(
            'Each file must have filename and mimetype properties'
          )
        }

        const fileExtension = file.filename.toLowerCase().split('.').pop()
        if (
          !allowedMimeTypes.includes(file.mimetype) &&
          !allowedExtensions.includes(fileExtension || '')
        ) {
          this.logger.warn('Invalid file type rejected', {
            filename: file.filename,
            mimeType: file.mimetype,
            fileExtension,
          })
          throw new UnprocessableEntityException(
            `Invalid file type for ${file.filename}. Only PDF and ZIP files are allowed.`
          )
        }
      }

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Create file-like objects for the use case
      const fileMetadata = body.files.map((f) => ({
        filename: f.filename,
        mimetype: f.mimetype,
      })) as MultipartFile[]

      // Execute use case to generate presigned URLs
      const result = await this.extractDataUseCase.execute(fileMetadata, auditContext)

      return reply.status(200).send({
        success: true,
        data: result,
        message: 'Presigned URLs generated successfully',
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

  async initializeUpload(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if request is multipart
      if (!request.isMultipart()) {
        throw new UnprocessableEntityException('Request must be multipart/form-data')
      }

      // Extract files using @fastify/multipart
      const parts = request.parts()
      const files: MultipartFile[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          files.push(part)
        }
      }

      if (files.length === 0) {
        throw new UnprocessableEntityException('No files provided for upload')
      }

      this.logger.info('Initializing multipart upload', {
        fileCount: files.length,
        files: files.map((f) => ({ filename: f.filename, mimetype: f.mimetype })),
      })

      // Validate file types - only PDF and ZIP files are allowed
      const allowedMimeTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ]
      const allowedExtensions = ['pdf', 'zip']

      for (const file of files) {
        const fileExtension = file.filename.toLowerCase().split('.').pop()
        if (
          !allowedMimeTypes.includes(file.mimetype) &&
          !allowedExtensions.includes(fileExtension || '')
        ) {
          this.logger.warn('Invalid file type rejected', {
            filename: file.filename,
            mimeType: file.mimetype,
            fileExtension,
          })
          throw new UnprocessableEntityException(
            `Invalid file type for ${file.filename}. Only PDF and ZIP files are allowed.`
          )
        }
      }

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Execute use case to generate presigned URLs for upload
      const result = await this.extractDataUseCase.execute(files, auditContext)

      return reply.status(200).send({
        success: true,
        data: result,
        message: 'Presigned URLs generated successfully',
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
