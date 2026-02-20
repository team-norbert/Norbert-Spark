import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { Uuid } from '../../../domain/value-objects/uuid.js'
import type { UUIDType } from '../../../domain/value-objects/uuid.js'
import type { GetAIAdminUseCase } from '../../../application/use-cases/get-ai-admin.use-case.js'
import type { PutAIAdminUseCase } from '../../../application/use-cases/put-ai-admin.use-case.js'
import { PutAIAdminDTO } from '../../../application/dtos/put-ai-admin.dto.js'
import { PostAIAdminDTO } from '../../../application/dtos/post-ai-admin.dto.js'
import type { PostAIAdminUseCase } from '../../../application/use-cases/post-ai-admin.use-case.js'
import { DrizzleQueryError } from 'drizzle-orm'

export class AIAdminController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly getAIAdminUseCase: GetAIAdminUseCase,
    private readonly putAIAdminUseCase: PutAIAdminUseCase,
    private readonly postAIAdminUseCase: PostAIAdminUseCase
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
    app.post(
      '/ai/chats/config/:id/settings',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.postAIChatSettingsById.bind(this)
    )
  }

  async postAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('Received ai-admin POST request')
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }
      const params = request.params as Record<string, unknown>
      this.logger.debug(`Request params: ${JSON.stringify(params)}`)
      const id = params.id as string
      this.logger.debug(`Request id: ${id}`)
      let uuidID: UUIDType
      try {
        uuidID = new Uuid(id).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid id format',
          details: 'incorrect UUID format',
        })
      }
      const dto = PostAIAdminDTO.validate(request.body)
      const result = await this.postAIAdminUseCase.execute(uuidID, dto, auditContext)

      if (!result) {
        reply.code(500).send({
          success: false,
          error: 'Failed to create AI chat settings: no record was returned',
        })
        return
      }

      return reply.code(201).send({
        success: true,
        data: result,
      })
    } catch (error) {
      this.logger.error(
        'Error processing ai-admin POST request',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to create AI chat settings due to a database error'
          : err?.message || 'Failed to create AI chat settings due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  async putAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('Received ai-admin PUT request')
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }
      const params = request.params as Record<string, unknown>
      this.logger.debug(`Request params: ${JSON.stringify(params)}`)
      const id = params.id as string
      this.logger.debug(`Request id: ${id}`)
      let uuidID: UUIDType
      try {
        uuidID = new Uuid(id).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid id format',
          details: 'incorrect UUID format',
        })
      }
      this.logger.debug(`Request uuidID: ${uuidID}`)
      const dto = PutAIAdminDTO.validate(request.body)
      const result = await this.putAIAdminUseCase.execute(uuidID, dto, auditContext)

      if (!result) {
        reply.code(404).send({
          success: false,
          error: 'AI Chat Configuration not found',
        })
        return
      }

      reply.status(204).send()
    } catch (error) {
      this.logger.error(
        'Error processing ai-admin PUT request',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to update AI chat settings due to a database error'
          : err?.message || 'Failed to update AI chat settings due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  async getAIChatSettingsById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('Received ai-admin request')
    try {
      // Extract audit context from request
      const auditContext = {
        userId: request.user?.sub ?? null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      const params = request.params as Record<string, unknown>
      this.logger.debug(`Request params: ${JSON.stringify(params)}`)
      const id = params.id as string
      this.logger.debug(`Request id: ${id}`)

      let uuidID: UUIDType
      try {
        uuidID = new Uuid(id).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid id format',
          details: 'incorrect UUID format',
        })
      }

      this.logger.debug(`Request uuidID: ${uuidID}`)
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
      this.logger.error(
        'Error handling ai-admin request',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to retrieve AI chat settings due to a database error'
          : err?.message || 'Failed to retrieve AI chat settings due to a database error'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
