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

/**
 * HTTP controller for AI admin configuration endpoints.
 *
 * Handles CRUD operations for per-chat-type AI settings (model parameters, system prompt, etc.).
 * All routes require authentication and one of the roles: `admin` or `moderator`.
 *
 * **Base resource:** `/ai/chats/config/:id/settings`
 *
 * | Method | Route                            | Handler                   |
 * |--------|----------------------------------|---------------------------|
 * | GET    | /ai/chats/config/:id/settings    | getAIChatSettingsById     |
 * | PUT    | /ai/chats/config/:id/settings    | putAIChatSettingsById     |
 * | POST   | /ai/chats/config/:id/settings    | postAIChatSettingsById    |
 */
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

  /**
   * Creates AI chat settings for the specified chat type.
   *
   * Validates the `:id` path parameter as a UUID, then delegates to
   * {@link PostAIAdminUseCase} to persist a new settings record.
   *
   * **Route:** `POST /ai/chats/config/:id/settings`
   * **Auth:** Requires a valid JWT and one of the roles: `admin`, `moderator`.
   *
   * @param request - Fastify request. Path param `:id` must be a valid UUID.
   *   Body is validated by {@link PostAIAdminDTO}.
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {400} When `:id` is not a valid UUID.
   * @throws {500} When the request body fails DTO validation or a type error occurs during DTO processing.
   * @throws {500} When the use-case returns no record or an unexpected error occurs.
   *
   * @example
   * // Success — 201 Created
   * // POST /ai/chats/config/01933c89-6f67-7b3a-8e4c-123456789abc/settings
   * // Body: { "prompt": "You are a helpful assistant.", "maxTokens": 4096, ... }
   * // Response: { "success": true, "data": { ...createdSettings } }
   *
   * @example
   * // Validation failure — 400 Bad Request
   * // Response: { "success": false, "error": "Invalid id format", "details": "incorrect UUID format" }
   */
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

  /**
   * Updates AI chat settings for the specified chat type.
   *
   * Validates the `:id` path parameter as a UUID, then delegates to
   * {@link PutAIAdminUseCase} to update the existing settings record.
   *
   * **Route:** `PUT /ai/chats/config/:id/settings`
   * **Auth:** Requires a valid JWT and one of the roles: `admin`, `moderator`.
   *
   * @param request - Fastify request. Path param `:id` must be a valid UUID.
   *   Body is validated by {@link PutAIAdminDTO}.
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {400} When `:id` is not a valid UUID.
   * @throws {400} When the request body fails DTO validation with well-formed types.
   * @throws {404} When no settings record exists for the given chat type ID.
   * @throws {500} When the request body contains invalid types that cause DTO validation
   *   to fail internally, or when an unexpected error occurs during the update.
   *
   * @example
   * // Success — 204 No Content
   * // PUT /ai/chats/config/01933c89-6f67-7b3a-8e4c-123456789abc/settings
   * // Body: { "prompt": "Updated system prompt.", "temperature": 0.5 }
   *
   * @example
   * // Not found — 404
   * // Response: { "success": false, "error": "AI Chat Configuration not found" }
   */
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

  /**
   * Retrieves AI chat settings for the specified chat type.
   *
   * Validates the `:id` path parameter as a UUID, then delegates to
   * {@link GetAIAdminUseCase} to fetch the settings record.
   *
   * **Route:** `GET /ai/chats/config/:id/settings`
   * **Auth:** Requires a valid JWT and one of the roles: `admin`, `moderator`.
   *
   * @param request - Fastify request. Path param `:id` must be a valid UUID.
   * @param reply - Fastify reply used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {400} When `:id` is not a valid UUID.
   * @throws {404} When no settings record exists for the given chat type ID.
   * @throws {500} When an unexpected error occurs while retrieving settings.
   *
   * @example
   * // Success — 200 OK
   * // GET /ai/chats/config/01933c89-6f67-7b3a-8e4c-123456789abc/settings
   * // Response:
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "id": "01933c89-6f67-7b3a-8e4c-123456789abc",
   * //     "prompt": "You are a helpful assistant.",
   * //     "maxTokens": 4096,
   * //     "temperature": 0.7,
   * //     "createdAt": "2026-02-17T10:30:00Z",
   * //     "updatedAt": "2026-02-17T10:30:00Z"
   * //   }
   * // }
   *
   * @example
   * // Not found — 404
   * // Response: { "success": false, "error": "AI Chat Configuration not found" }
   */
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
