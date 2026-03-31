import type { components } from '@norberts-spark/shared/openapi-types'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { PDFParse } from 'pdf-parse'

import { ExtractDataDto } from '../../../application/dtos/extract-data.dto.js'
import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { CreateVectorStoreDocumentWithRecords } from '../../../application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { CreateVectorStoreUseCase } from '../../../application/use-cases/create-vector-store.use-case.js'
import { ExtractDataUseCase } from '../../../application/use-cases/extract-data.use-case.js'
import { GetEmbeddingModelUseCase } from '../../../application/use-cases/get-embedding-model.use-case.js'
import { GetEmbeddingModelByIdUseCase } from '../../../application/use-cases/get-embedding-model-by-id.use-case.js'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import type { DBEmbeddingModelSelect } from '../../../infrastructure/database/schema.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { NotFoundException } from '../../../shared/exceptions/not-found.exception.js'
import { ValidationException } from '../../../shared/exceptions/validation.exception.js'
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
   * @param getEmbeddingModelByIdUseCase - Use case that retrieves all embedding models from the database.
   * @param createVectorStoreUseCase - Use case that creates a new vector store and ingests documents.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly getEmbeddingModelUseCase: GetEmbeddingModelUseCase,
    private readonly extractDataUseCase: ExtractDataUseCase,
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly pdfUtils: PDFUtils,
    private readonly ragUtils: RAGUtils,
    private readonly getEmbeddingModelByIdUseCase: GetEmbeddingModelByIdUseCase,
    private readonly createVectorStoreUseCase: CreateVectorStoreUseCase
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
   * Ingests documents (PDF or ZIP of PDFs), generates vector embeddings, and
   * persists everything to the database via the vector store use case.
   *
   * **Success response — 201 Created:**
   * ```json
   * { "success": true, "data": { ... } }
   * ```
   *
   * **Error responses:**
   * - `400` — validation failure (`ValidationException` from `RagDto.validate` or empty document set)
   * - `404` — embedding model not found (`NotFoundException`)
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

      // 1. Resolve the embedding model before processing documents so it is
      //    available for per-document chunking and embedding generation below.
      let embeddedModels: DBEmbeddingModelSelect | undefined

      if ('existingModelId' in ragDto.embeddingModels) {
        embeddedModels = await this.getEmbeddingModelByIdUseCase.execute(
          ragDto.embeddingModels.existingModelId
        )
      } else {
        // ragDto.embeddingModels.modelName, .modelProvider, .dimension etc. are available here
        // New-model creation is not yet implemented
      }

      if (!embeddedModels) {
        throw new NotFoundException('EmbeddingModel')
      }

      // 2. Determine chunking parameters once, reused for every document.
      const chunkSize = ragDto.vectorEmbeddings.chunkSize
      const chunkOverlap = ragDto.vectorEmbeddings.chunkOverlap
      // Allow downstream utilities (e.g., RAGUtils) to apply their own default
      // chunk separators; we do not define any custom separators here.
      const chunkSeparators = undefined

      // 3. Process each document individually to maintain per-document attribution
      //    in the vector_embeddings table (documentId FK).
      const documentInputs: CreateVectorStoreDocumentWithRecords[] = []

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
            try {
              const infoResult = await parser.getInfo({ parsePageInfo: true })
              const textResult = await parser.getText()
              const checksum = this.ragUtils.generateChecksum(textResult.text)
              this.logger.debug('Generated checksum for PDF', { checksum })

              const docChunks = await this.ragUtils.chunking(
                chunkSize,
                chunkOverlap,
                textResult.text,
                chunkSeparators
              )
              const docEmbeddings = await this.ragUtils.generateEmbeddings(
                docChunks,
                embeddedModels.name,
                embeddedModels.provider
              )

              if (docEmbeddings.length !== docChunks.length) {
                throw new ValidationException(
                  `Embedding count mismatch for "${fileEntry.path}": expected ${docChunks.length} embeddings but received ${docEmbeddings.length}`
                )
              }

              documentInputs.push({
                title: (infoResult.info?.Title as string | undefined) ?? fileEntry.path,
                source: `${doc.source}::${fileEntry.path}`,
                checksum,
                records: docChunks.map((content, i) => ({
                  content,
                  // eslint-disable-next-line security/detect-object-injection
                  embedding: docEmbeddings[i] as number[],
                })),
              })
            } finally {
              await parser.destroy()
            }
          }
        }

        if (fileType === 'pdf') {
          this.logger.debug('Processing PDF from S3', { path: doc.source })
          const parser = new PDFParse({ data: buffer })
          try {
            const textResult = await parser.getText()
            const checksum = this.ragUtils.generateChecksum(textResult.text)
            this.logger.debug('Generated checksum for PDF', { checksum })

            const docChunks = await this.ragUtils.chunking(
              chunkSize,
              chunkOverlap,
              textResult.text,
              chunkSeparators
            )
            const docEmbeddings = await this.ragUtils.generateEmbeddings(
              docChunks,
              embeddedModels.name,
              embeddedModels.provider
            )

            if (docEmbeddings.length !== docChunks.length) {
              throw new ValidationException(
                `Embedding count mismatch for "${doc.source}": expected ${docChunks.length} embeddings but received ${docEmbeddings.length}`
              )
            }

            documentInputs.push({
              title: doc.title,
              source: doc.source,
              checksum,
              records: docChunks.map((content, i) => ({
                content,
                // eslint-disable-next-line security/detect-object-injection
                embedding: docEmbeddings[i] as number[],
              })),
            })
          } finally {
            await parser.destroy()
          }
        }
      }

      // 4. Ensure at least one document was successfully processed before persisting.
      if (documentInputs.length === 0) {
        throw new ValidationException(
          'No valid documents were found to process. Ensure your upload contains at least one valid PDF file.'
        )
      }

      // 5. Delegate persistence to the use case / repository layer.
      const result = await this.createVectorStoreUseCase.execute({
        vectorStoreName: documentInputs[0]?.title ?? ragDto.id,
        embeddingModelId: embeddedModels.id,
        dimension: embeddedModels.dimension as 384 | 768 | 1024 | 1536 | 3072,
        documents: documentInputs,
        chunkSize,
        chunkOverlap,
        chatAIOptions: ragDto.chatAIOptions,
      })

      // 6. Map the persisted DB records to the OpenAPI response shape.
      const responseData: components['schemas']['CreateVectorStoreResponse']['data'] = {
        documents: result.documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          source: doc.source,
          checksum: doc.checksum,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        })),
        embeddingModels: {
          id: embeddedModels.id,
          modelName: embeddedModels.name,
          modelProvider:
            embeddedModels.provider as components['schemas']['CreateVectorStoreResponse']['data']['embeddingModels']['modelProvider'],
          status: embeddedModels.status,
          recommendedUsage: embeddedModels.recommendedUsage,
          releaseYear: embeddedModels.releaseYear,
          dimension:
            embeddedModels.dimension as components['schemas']['CreateVectorStoreResponse']['data']['embeddingModels']['dimension'],
          taskType: (embeddedModels.taskType ??
            'RETRIEVAL_QUERY') as components['schemas']['CreateVectorStoreResponse']['data']['embeddingModels']['taskType'],
          createdAt: embeddedModels.createdAt.toISOString(),
          updatedAt: embeddedModels.updatedAt.toISOString(),
        },
        vectorEmbeddings: {
          id: result.vectorStore.id,
          chunkSize,
          chunkOverlap,
          createdAt: result.vectorStore.createdAt.toISOString(),
          updatedAt: result.vectorStore.updatedAt.toISOString(),
        },
        chatAIOptions: {
          id: result.chatAIOptions.id,
          prompt: result.chatAIOptions.prompt,
          ...(result.chatAIOptions.maxTokens != null && {
            maxTokens: result.chatAIOptions.maxTokens,
          }),
          ...(result.chatAIOptions.temperature != null && {
            temperature: Number(result.chatAIOptions.temperature),
          }),
          ...(result.chatAIOptions.topP != null && { topP: Number(result.chatAIOptions.topP) }),
          ...(result.chatAIOptions.frequencyPenalty != null && {
            frequencyPenalty: Number(result.chatAIOptions.frequencyPenalty),
          }),
          ...(result.chatAIOptions.presencePenalty != null && {
            presencePenalty: Number(result.chatAIOptions.presencePenalty),
          }),
          ...(result.chatAIOptions.stopSequences != null && {
            stopSequences: result.chatAIOptions.stopSequences,
          }),
          ...(result.chatAIOptions.maxRetries != null && {
            maxRetries: result.chatAIOptions.maxRetries,
          }),
          createdAt: result.chatAIOptions.createdAt.toISOString(),
          updatedAt: result.chatAIOptions.updatedAt.toISOString(),
        },
      }

      this.logger.debug('Created vector store', { responseData, event: 'rag.vector_store.created' })

      return reply.code(201).send({
        success: true,
        data: responseData,
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
