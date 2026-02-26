import type { components } from '@norberts-spark/shared/openapi-types'
import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { GetEmbeddingModelUseCase } from '../../../application/use-cases/get-embedding-model.use-case.js'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'

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
   * @param presignedUploadUrlUseCase - Use case that generates a pre-signed S3 upload URL for a document.
   * @param pdfUtils - PDF utility helpers used during document ingestion.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly getEmbeddingModelUseCase: GetEmbeddingModelUseCase,
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly pdfUtils: PDFUtils
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
        error instanceof DrizzleQueryError
          ? 'Failed to fetch embedding models due to a database error'
          : err?.message || 'Failed to fetch embedding models due to a database error'
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
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      const body = request.body as components['schemas']['CreateVectorStoreRequest']
      const ragDto = RagDto.validate(body)
      // TODO: Implement the logic to handle the RAG request, such as processing the uploaded file, extracting text, and generating embeddings.
      // const { buffer, fileType } = await this.extractDataUseCase.execute(ragDto, auditContext)

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
        error instanceof DrizzleQueryError
          ? 'Failed to create vector store due to a database error'
          : err?.message || 'Failed to create vector store due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
