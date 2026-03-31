import { isArray } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { PDFParse } from 'pdf-parse'

import { ExtractDataDto } from '../../../application/dtos/extract-data.dto.js'
import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { ExtractDataUseCase } from '../../../application/use-cases/extract-data.use-case.js'
import { GetEmbeddingModelUseCase } from '../../../application/use-cases/get-embedding-model.use-case.js'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { safelyMaskIp } from '../../../shared/utils/mask-ip.js'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'
import { RAGUtils } from '../../../shared/utils/rag.utils.js'

/**
 * Primary HTTP adapter for Retrieval-Augmented Generation (RAG) operations.
 *
 * Handles all HTTP concerns for the RAG feature — request parsing, response
 * formatting, and error handling — then delegates business logic to the
 * appropriate use cases. All routes require authentication and the
 * `admin` or `moderator` role.
 *
 * Routes registered:
 * - `POST /ai/create-vector-store`  — ingest a document and create vector embeddings
 * - `GET  /ai/embedding-models`     — list all available embedding models
 */
export class AiRagController {
  /**
   * @param logger - Structured logger for request and error telemetry.
   * @param getEmbeddingModelUseCase - Use case that retrieves all embedding models from the database.
   * @param extractDataUseCase - Use case that extracts data from a PDF document and prepares it for ingestion.
   * @param presignedUploadUrlUseCase - Use case that generates a pre-signed S3 upload URL for a document.
   * @param pdfUtils - PDF utility helpers used during document ingestion.
   * @param ragUtils - RAG utility functions for generating checksums and other RAG-related tasks.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly getEmbeddingModelUseCase: GetEmbeddingModelUseCase,
    private readonly extractDataUseCase: ExtractDataUseCase,
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly pdfUtils: PDFUtils,
    private readonly ragUtils: RAGUtils
  ) {}

  /**
   * Registers all RAG-related routes with the Fastify instance.
   *
   * Called once during application bootstrap by the DI container. Each route
   * applies `authMiddleware` and `requireRole(['admin', 'moderator'])` as
   * pre-handlers, so unauthenticated or insufficiently privileged requests are
   * rejected before the handler runs.
   *
   * @param app - The Fastify instance (or scoped sub-instance) to register routes on.
   */
  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/ai/create-vector-store',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.createRagVectorStore.bind(this)
    )
    app.get(
      '/ai/embedding-models',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getEmbeddingModels.bind(this)
    )
  }

  /**
   * Handles `GET /ai/embedding-models`.
   *
   * Returns the full list of embedding models available in the system, ordered
   * by creation date descending. Each model record includes its id, name,
   * provider, dimension, and timestamps.
   *
   * **Success response — 200 OK:**
   * ```json
   * { "success": true, "data": [ { "id": "...", "name": "...", ... } ] }
   * ```
   *
   * **Error responses:**
   * - `404` — resource not found (propagated from a `NotFoundException`)
   * - `500` — unexpected server or database error
   *
   * @param request - Incoming Fastify request (unused beyond middleware context).
   * @param reply - Fastify reply used to send the HTTP response.
   */
  async getEmbeddingModels(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const results = await this.getEmbeddingModelUseCase.execute()
      reply.code(200).send({
        success: true,
        data: results,
      })
    } catch (error) {
      this.logger.error(
        'Error in getEmbeddingModels',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof BaseException
          ? error.message // These are intentionally user-facing
          : 'An unexpected error occurred' // Everything else: hide internals
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Handles `POST /ai/create-vector-store`.
   *
   * Validates the incoming request body against the `CreateVectorStoreRequest`
   * OpenAPI schema, extracts an audit context from the request (user ID, IP,
   * user-agent), and delegates to the RAG pipeline use case.
   *
   * **Currently returns 501 Not Implemented** while the underlying vector
   * ingestion logic is being built out. Once implemented, the expected success
   * response will be:
   * ```json
   * { "success": true, "data": { ... } }
   * ```
   *
   * **Error responses:**
   * - `400` — validation failure (`ValidationException` from `RagDto.validate`)
   * - `500` — unexpected server or database error
   *
   * @param request - Incoming Fastify request containing a `CreateVectorStoreRequest` body.
   * @param reply - Fastify reply used to send the HTTP response.
   */
  async createRagVectorStore(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: safelyMaskIp(request.ip),
        userAgent: request.headers['user-agent'] ?? null,
      }

      const body = request.body as components['schemas']['CreateVectorStoreRequest']
      const ragDto = RagDto.validate(body)

      // example of ragDto data
      const result = {
        id: '019d3e6e-2d1d-765c-ab4f-07d429e8a613',
        documents: [
          {
            title: 'Sample-Handbook',
            source: 'rag/019d3ead-9941-7625-bfe4-ef798304bacd/Sample-Handbook.pdf',
          },
        ],
        embeddingModels: { existingModelId: '019d3458-36c1-7af0-8ca7-f46c2f2922bd' },
        vectorEmbeddings: { chunkSize: 300, chunkOverlap: 40 },
        chatAIOptions: {
          chatTypeId: '019d3e6e-2d1d-765c-ab4f-07d429e8a613',
          maxTokens: 1000,
          temperature: 0.7,
          topP: 1,
          stopSequences: [],
          maxRetries: 2,
        },
      }

      let textToChunk: string = ''

      for (const doc of ragDto.documents) {
        const dto = ExtractDataDto.validate({ fileKey: doc.source, bucketName: EnvConfig.BUCKET })
        const { buffer, fileType } = await this.extractDataUseCase.execute(dto, auditContext)
        this.logger.debug('Extracted data from S3', { fileType, bufferLength: buffer.length })
        if (fileType === 'zip') {
          const { pdfFiles } = await this.pdfUtils.extractFromBuffer(Buffer.from(buffer))
          for (const fileEntry of pdfFiles) {
            this.logger.debug('Processing PDF from zip', { path: fileEntry.path })
            const fileBuffer = await fileEntry.buffer()
            const parser = new PDFParse({ data: fileBuffer })
            const result = await parser.getInfo({ parsePageInfo: true })
            const textResult = await parser.getText()
            const checksum = this.ragUtils.generateChecksum(textResult.text)
            textToChunk += textResult.text
            // for entry into documents table
            // title: result.info?.Title || fileEntry.path
            // source: could be `doc.source + '::' + fileEntry.path` to maintain uniqueness and traceability back to the original zip and the file within it
            // checksum: checksum
            this.logger.debug('Generated checksum for PDF', { checksum })
            await parser.destroy()
          }
        }
        if (fileType === 'pdf') {
          this.logger.debug('Processing PDF from S3', { path: doc.source })
          const parser = new PDFParse({ data: buffer })
          const result = await parser.getText()
          textToChunk += result.text
          const checksum = this.ragUtils.generateChecksum(result.text)
          // for entry into documents table
          // title: doc.title
          // source: doc.source
          // checksum: checksum
          this.logger.debug('Generated checksum for PDF', { checksum })
          await parser.destroy()
        }
      }

      // text to chunk: textToChunk

      //ragDto.chatAIOptions.stopSequences

      //ragDto.vectorEmbeddings.chunkSize
      //ragDto.vectorEmbeddings.chunkOverlap.

      const chunks = await this.ragUtils.chunking(
        ragDto.vectorEmbeddings.chunkSize,
        ragDto.vectorEmbeddings.chunkOverlap,
        textToChunk,
        isArray(ragDto.chatAIOptions.stopSequences) && ragDto.chatAIOptions.stopSequences.length > 0
          ? ragDto.chatAIOptions.stopSequences
          : undefined
      )

      // In the following order
      // 1. Retrieve the content of the PDF file
      // 2. Extract text from the PDF
      // 3. Use the RAGUtils.generateChecksum to create a checksum for the database entry
      // 4.

      /* ragDto.documents.forEach(doc => {

      })*/

      //const dto = ExtractDataDto.validate({ ragDto, bucketName: EnvConfig.BUCKET })

      //const { buffer, fileType } = await this.extractDataUseCase.execute(ragDto, auditContext)

      // Placeholder response until RAG vector store creation is fully implemented
      reply.code(501).send({
        success: false,
        message: 'createRagVectorStore is not implemented yet',
        data: {
          auditContext,
          ragRequest: ragDto,
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in createRagVectorStore',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof BaseException
          ? error.message // These are intentionally user-facing
          : 'An unexpected error occurred' // Everything else: hide internals
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
