import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { Uuid } from '../../../domain/value-objects/uuid.js'
import { GetAIAdminUseCase } from '../../../application/use-cases/get-ai-admin.use-case.js'
import { PutAIAdminUseCase } from '../../../application/use-cases/put-ai-admin.use-case.js'
import { PutAIAdminDTO } from '../../../application/dtos/put-ai-admin.dto.js'

export class AIAdminController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly getAIAdminUseCase: GetAIAdminUseCase,
    private readonly putAIAdminUseCse: PutAIAdminUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/ai/chats/config/:id/settings',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getAIChatSettingsById.bind(this)
    )
    app.put(
      '/ai/chats/config/:id/settings',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.putAIChatSettingsById.bind(this)
    )
  }

  async putAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    this.logger.info('Received ai-admin PUT request')
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }
      const params = request.params as Record<string, unknown>
      const id = params.id as string
      const uuidID = new Uuid(id).getValue()
      const dto = PutAIAdminDTO.validate(request.body)
      const result = await this.putAIAdminUseCse.execute(uuidID, dto, auditContext)

      if (result) {
        reply.status(204).send()
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

  async getAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    this.logger.info('Received ai-admin request')
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      const params = request.params as Record<string, unknown>
      const id = params.id as string
      const uuidID = new Uuid(id).getValue()
      const result = await this.getAIAdminUseCase.execute(uuidID, auditContext)

      if (!result) {
        reply.code(404).send({
          success: false,
          error: 'AI Chat Configuration not found',
        })
        return
      }
      reply.code(200).send({
        success: true,
        data: result,
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
