import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { UnprocessableEntityException } from '../../../shared/exceptions/unprocessable-entity.exception.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { ExtractDataUseCase } from '../../../application/use-cases/extract-data.use-case.js'
import type { MultipartFile } from '@fastify/multipart'
import {
  sanitizeFilename,
  validateFileExtension,
  validateMimeType,
} from '../../../shared/utils/security-validation.util.js'

/**
 * Allowed file extensions for upload
 */
const ALLOWED_EXTENSIONS = ['pdf', 'zip']

/**
 * Allowed MIME types for upload
 */
const ALLOWED_MIME_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed']

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

      // Validate and sanitize each file's metadata using security utilities
      const sanitizedFiles: FileMetadata[] = []

      for (const file of body.files) {
        if (!file.filename || !file.mimetype) {
          throw new UnprocessableEntityException(
            'Each file must have filename and mimetype properties'
          )
        }

        try {
          // Sanitize filename to remove dangerous characters
          const sanitizedFilename = sanitizeFilename(file.filename)

          // Validate file extension against allowlist
          validateFileExtension(sanitizedFilename, ALLOWED_EXTENSIONS)

          // Validate MIME type against allowlist
          validateMimeType(file.mimetype, ALLOWED_MIME_TYPES)

          sanitizedFiles.push({
            filename: sanitizedFilename,
            mimetype: file.mimetype,
          })
        } catch (validationError) {
          this.logger.warn('File validation failed', {
            filename: file.filename,
            mimeType: file.mimetype,
            error: (validationError as Error).message,
          })
          throw new UnprocessableEntityException(
            `Invalid file: ${file.filename}. ${(validationError as Error).message}`
          )
        }
      }

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Create file-like objects for the use case with sanitized filenames
      const fileMetadata = sanitizedFiles.map((f) => ({
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
      const sanitizedFilenames: Map<string, string> = new Map()

      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            // Sanitize filename to remove dangerous characters
            const sanitizedFilename = sanitizeFilename(part.filename)

            // Validate file extension against allowlist
            validateFileExtension(sanitizedFilename, ALLOWED_EXTENSIONS)

            // Validate MIME type against allowlist
            validateMimeType(part.mimetype, ALLOWED_MIME_TYPES)

            // Store the sanitized filename mapping
            sanitizedFilenames.set(part.filename, sanitizedFilename)

            files.push(part)
          } catch (validationError) {
            this.logger.warn('File validation failed', {
              filename: part.filename,
              mimeType: part.mimetype,
              error: (validationError as Error).message,
            })
            throw new UnprocessableEntityException(
              `Invalid file: ${part.filename}. ${(validationError as Error).message}`
            )
          }
        }
      }

      if (files.length === 0) {
        throw new UnprocessableEntityException('No files provided for upload')
      }

      this.logger.info('Initializing multipart upload', {
        fileCount: files.length,
        files: files.map((f) => ({
          originalFilename: f.filename,
          sanitizedFilename: sanitizedFilenames.get(f.filename),
          mimetype: f.mimetype,
        })),
      })

      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Create file objects with sanitized filenames for the use case
      const sanitizedFiles = files.map((f) => ({
        ...f,
        filename: sanitizedFilenames.get(f.filename) || f.filename,
      })) as MultipartFile[]

      // Execute use case to generate presigned URLs for upload
      const result = await this.extractDataUseCase.execute(sanitizedFiles, auditContext)

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
