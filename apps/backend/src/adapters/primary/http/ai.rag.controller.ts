import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { PresignedUploadUrlUseCase } from '../../../application/use-cases/presigned-url-put.use-case.js'
import { PDFUtils } from '../../../shared/utils/pdf.utils.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { DrizzleQueryError } from 'drizzle-orm'
import type { components } from '@norberts-spark/shared/openapi-types'
import { RagDto } from '../../../application/dtos/rag.dto.js'

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
      this.getAIChatSettingsById.bind(this)
    )
  }

  async getAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
    } catch (error) {
      this.logger.error(
        'Error in getAIChatSettingsById',
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
