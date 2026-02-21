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
import { Output, streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { pdfSchema } from '@norberts-spark/shared'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'
import { DrizzleQueryError } from 'drizzle-orm'

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

/**
 * HTTP controller for AI-powered data extraction endpoints.
 *
 * Handles file ingestion (PDF / ZIP) and structured data extraction using
 * Google Gemini via the AI SDK. Files are uploaded directly to R2 object
 * storage by the client using presigned URLs; this controller then streams
 * extracted results back as newline-delimited JSON (NDJSON).
 *
 * All routes require a valid JWT (`authMiddleware`).
 *
 * | Method | Route                    | Handler                 |
 * |--------|--------------------------|-------------------------|
 * | POST   | /ai/presigned-urls       | generatePresignedUrls   |
 * | GET    | /ai/extract-data/:fileId | extractData             |
 */
export class AIExtractDataController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly extractDataUseCase: ExtractDataUseCase,
    private readonly pdfUtils: PDFUtils
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Generate presigned URLs from file metadata (JSON) - no file upload needed
    app.post(
      '/ai/presigned-urls',
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

  /**
   * Streams structured data extracted from a previously uploaded file.
   *
   * Fetches the file identified by `:fileId` from R2 storage via
   * {@link ExtractDataUseCase}, then uses Google Gemini (`streamText`) to
   * extract invoice data conforming to `pdfSchema`.
   *
   * **Supported file types:**
   * - `pdf` — processes the single PDF and streams one NDJSON line.
   * - `zip` — iterates over every PDF inside the archive and streams one
   *   NDJSON line per file.
   *
   * **Route:** `GET /ai/extract-data/:fileId`
   * **Auth:** Requires a valid JWT.
   *
   * **Response format** (`Content-Type: application/x-ndjson`):
   * Each line is a JSON object:
   * ```json
   * { "fileName": "invoice.pdf", "data": "<extracted text>", "success": true }
   * ```
   * On per-file errors:
   * ```json
   * { "fileName": "invoice.pdf", "data": null, "success": false, "error": "..." }
   * ```
   *
   * @param request - Fastify request. Path param `:fileId` is the R2 object key.
   * @param reply - Fastify reply. Uses raw Node.js response for NDJSON streaming.
   * @returns A promise that resolves once all NDJSON lines have been written and
   *   the stream is closed, or a JSON error response if the request itself fails.
   *
   * @throws {400} When `ExtractDataDto` validation fails (missing/invalid `fileId`).
   * @throws {422} When the file type is unsupported.
   * @throws {500} When an unexpected error occurs during extraction.
   *
   * @example
   * // Success (single PDF) — 200 OK  application/x-ndjson
   * // GET /ai/extract-data/invoices%2Finvoice-2026.pdf
   * // Stream output (one line):
   * // {"fileName":"invoices/invoice-2026.pdf","data":"Invoice #123...","success":true}
   *
   * @example
   * // Success (ZIP with two PDFs) — 200 OK  application/x-ndjson
   * // GET /ai/extract-data/batch%2Finvoices.zip
   * // Stream output (two lines):
   * // {"fileName":"invoice-a.pdf","data":"Invoice A data...","success":true}
   * // {"fileName":"invoice-b.pdf","data":"Invoice B data...","success":true}
   */
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

      this.logger.debug('Audit context for extractData', auditContext)

      const dto = ExtractDataDto.validate({ fileKey, bucketName: EnvConfig.BUCKET })

      const { buffer, fileType } = await this.extractDataUseCase.execute(dto, auditContext)

      if (fileType === 'zip') {
        const { pdfFiles } = await this.pdfUtils.extractFromBuffer(Buffer.from(buffer))

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
              onFinish: ({ text, finishReason, usage, response, totalUsage, sources }) => {
                // Called once when the full output is complete
                // The reason the model finished generating the text.
                // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
                this.logger.debug('Stream finished', { finishReason })
                this.logger.debug('Stream usage info', { usage, totalUsage })
                this.logger.debug('streamText.onFinish')

                this.logger.debug('Stream sources', { sources })

                // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
                // which are the model messages that were generated during the stream.
                // This is useful if you don't need UIMessages - for simpler applications.
                this.logger.debug('Stream response', { response: JSON.stringify(response) })
              },
              onError: ({ error }) => {
                this.logger.error('Stream error', error as Error)
              },
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
        // Set headers for streaming newline-delimited JSON
        reply.raw.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
        reply.raw.setHeader('Transfer-Encoding', 'chunked')

        this.logger.debug('Processing PDF file', { path: fileKey })

        try {
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
            onFinish: ({ text, finishReason, usage, response, totalUsage, sources }) => {
              // Called once when the full output is complete
              // The reason the model finished generating the text.
              // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
              this.logger.debug('Stream finished', { finishReason })
              this.logger.debug('Stream usage info', { usage, totalUsage })
              this.logger.debug('streamText.onFinish')

              this.logger.debug('Stream sources', { sources })

              // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
              // which are the model messages that were generated during the stream.
              // This is useful if you don't need UIMessages - for simpler applications.
              this.logger.debug('Stream response', { response })
            },
            onError: ({ error }) => {
              this.logger.error('Stream error', error as Error)
            },
          })

          // Stream extracted text to client as it arrives, then write NDJSON summary
          let extractedText = ''
          for await (const textPart of result.textStream) {
            extractedText += textPart
          }

          // Write result as NDJSON line
          const data = JSON.stringify({
            fileName: fileKey,
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
            { fileKey }
          )
          // Stream error for this PDF
          const errorLine = JSON.stringify({
            fileName: fileKey,
            data: null,
            success: false,
            error: pdfError instanceof Error ? pdfError.message : String(pdfError),
          })
          reply.raw.write(errorLine + '\n')
        }

        // End the stream
        reply.raw.end()
        return
      }
    } catch (error) {
      this.logger.error(
        'Error in extractData endpoint',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to extract data due to a database error'
          : err?.message || 'Failed to extract data due to a server error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Generates presigned R2 upload URLs from client-supplied file metadata.
   *
   * The client sends a list of `{ filename, mimetype }` descriptors; this
   * handler validates and sanitises each entry (extension allowlist, MIME-type
   * allowlist, filename sanitisation), then delegates to
   * {@link PresignedUploadUrlUseCase} to generate short-lived PUT URLs that
   * allow the client to upload files directly to R2 without proxying through
   * the server.
   *
   * **Allowed extensions:** `pdf`, `zip`
   * **Allowed MIME types:** `application/pdf`, `application/zip`,
   * `application/x-zip-compressed`
   *
   * **Route:** `POST /ai/presigned-urls`
   * **Auth:** Requires a valid JWT.
   *
   * @param request - Fastify request. Expected body:
   *   ```json
   *   { "files": [ { "filename": "invoice.pdf", "mimetype": "application/pdf" } ] }
   *   ```
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {422} When `files` is missing, empty, or not an array.
   * @throws {422} When any file entry is missing `filename` or `mimetype`.
   * @throws {422} When a file has a disallowed extension or MIME type.
   * @throws {500} When an unexpected error occurs while generating URLs.
   *
   * @example
   * // Success — 200 OK
   * // POST /ai/presigned-urls
   * // Body: { "files": [{ "filename": "invoice.pdf", "mimetype": "application/pdf" }] }
   * // Response:
   * // {
   * //   "success": true,
   * //   "data": [
   * //     { "filename": "invoice.pdf", "presignedUrl": "https://r2.example.com/..." }
   * //   ],
   * //   "message": "Presigned URLs generated successfully"
   * // }
   *
   * @example
   * // Validation failure — 422 Unprocessable Entity
   * // Body: { "files": [] }
   * // Response: { "success": false, "error": "No files provided. Expected { files: [...] }" }
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
      this.logger.error(
        'Error generating presigned URLs',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to generate presigned URLs due to a database error'
          : err?.message || 'Failed to generate presigned URLs due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
