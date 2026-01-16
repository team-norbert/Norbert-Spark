import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { UnprocessableEntityException } from '../../../shared/exceptions/unprocessable-entity.exception.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import type { MultipartFile } from '@fastify/multipart'
import { ExtractDataDto } from '../../../application/dtos/extract-data.dto.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import {
  sanitizeFilename,
  validateFileExtension,
  validateMimeType,
} from '../../../shared/utils/security-validation.util.js'
import { ExtractDataUseCase } from '../../../application/use-cases/extract-data.use-case.js'
import { generateText, Output, streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { pdfSchema } from '@norberts-spark/shared'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'

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
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly extractDataUseCase: ExtractDataUseCase,
    private readonly pdfUtils: PDFUtils
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Generate presigned URLs from file metadata (JSON) - no file upload neededva
    app.post(
      '/ai/extract-data/presigned-urls',
      {
        preHandler: [authMiddleware],
      },
      this.generatePresignedUrls.bind(this)
    )
    // Use AI to extract data after successful to pre-signed URLs {fileId}
    app.get(
      '/ai/extract-data/:fileId',
      {
        preHandler: [authMiddleware],
      },
      this.extractData.bind(this)
    )
  }

  async extractData(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<{ output: any } | boolean | void> {
    this.logger.debug('Received getAIChatsByUserId request')
    const params = request.params as Record<string, unknown>
    const fileKey = params.fileId as string

    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      const dto = ExtractDataDto.validate({ fileKey, bucketName: EnvConfig.BUCKET })

      const { buffer, fileType } = await this.extractDataUseCase.execute(dto, auditContext)

      if (fileType === 'zip') {
        const { totalEntries, pdfFilesFound, pdfPaths, pdfFiles } =
          await this.pdfUtils.extractFromBuffer(Buffer.from(buffer))

        // Set headers for streaming newline-delimited JSON
        reply.raw.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
        reply.raw.setHeader('Transfer-Encoding', 'chunked')

        for (const fileEntry of pdfFiles) {
          this.logger.debug('Processing PDF from zip', { path: fileEntry.path })

          try {
            const fileBuffer = await fileEntry.buffer()
            const result = streamText({
              model: google(EnvConfig.MODEL_NAME as string),
              system: `You will receive an invoice. Please extract the data from the invoice.`,
              output: Output.object({ schema: pdfSchema }),
              experimental_telemetry: {
                isEnabled: EnvConfig.SENTRY_ENABLED === 'true',
                recordInputs: true,
                recordOutputs: true,
              },
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'file',
                      data: fileBuffer,
                      mediaType: 'application/pdf',
                    },
                  ],
                },
              ],
            })

            // Stream extracted text to client as it arrives, then write NDJSON summary
            let extractedText = ''
            for await (const textPart of result.textStream) {
              extractedText += textPart
            }

            // Write result as NDJSON line
            const data = JSON.stringify({
              fileName: fileEntry.path,
              data: extractedText,
              success: true,
            })

            this.logger.info('Extracted data from PDF', {
              data,
            })
            reply.raw.write(data + '\n')
          } catch (pdfError) {
            this.logger.error(
              'Failed to process PDF',
              pdfError instanceof Error ? pdfError : new Error(String(pdfError)),
              { filePath: fileEntry.path }
            )
            // Stream error for this PDF
            const errorLine = JSON.stringify({
              fileName: fileEntry.path,
              data: null,
              success: false,
              error: pdfError instanceof Error ? pdfError.message : String(pdfError),
            })
            reply.raw.write(errorLine + '\n')
          }
        }

        // End the stream after all PDFs are processed
        reply.raw.end()
        return
      }

      if (fileType === 'pdf') {
        const result = streamText({
          model: google(EnvConfig.MODEL_NAME as string),
          system: `You will receive an invoice. Please extract the data from the invoice.`,
          output: Output.object({ schema: pdfSchema }),
          experimental_telemetry: {
            isEnabled: EnvConfig.SENTRY_ENABLED === 'true',
            recordInputs: true,
            recordOutputs: true,
          },
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'file',
                  data: Buffer.from(buffer),
                  mediaType: 'application/pdf',
                },
              ],
            },
          ],
        })
        this.logger.info('Data extraction completed successfully for PDF', {
          result: result,
        })

        for await (const textPart of result.textStream) {
          process.stdout.write(textPart)
        }

        // Mark the response as a v1 data stream:
        reply.header('X-Vercel-AI-Data-Stream', 'v1')
        reply.header('Content-Type', 'text/plain; charset=utf-8')

        return reply.send(result.toTextStreamResponse())
      }
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

  /**
   * Generate presigned URLs for direct R2 upload from file metadata.
   * This endpoint accepts JSON with file metadata and returns presigned URLs
   * for the client to upload files directly to R2.
   */
  async generatePresignedUrls(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
      const result = await this.presignedUploadUrlUseCase.execute(fileMetadata, auditContext)

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
