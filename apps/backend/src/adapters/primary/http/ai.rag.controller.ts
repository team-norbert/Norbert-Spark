import type { components } from '@norberts-spark/shared/openapi-types'
import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'

export class AiRagController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase,
    private readonly pdfUtils: PDFUtils
  ) {}

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

  async getEmbeddingModels(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // TODO: Implement fetching embedding models from the repository
      reply.code(501).send({
        success: false,
        message: 'getEmbeddingModels is not implemented yet',
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
