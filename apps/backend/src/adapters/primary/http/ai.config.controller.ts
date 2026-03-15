import type { components } from '@norberts-spark/shared/openapi-types'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { PostChatType } from '../../../application/dtos/post-chat-types.dto.js'
import { PutChatTypeDto } from '../../../application/dtos/put-chat-type.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { GetChatDetailsUseCase } from '../../../application/use-cases/get-chat-details.use-case.js'
import { PostChatTypesUseCase } from '../../../application/use-cases/post-chat-types.use-case.js'
import { PutChatDetailsUseCase } from '../../../application/use-cases/put-chat-details.use-case.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { safelyMaskIp } from '../../../shared/utils/mask-ip.js'

export class AIConfigController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly getChatDetailsUseCase: GetChatDetailsUseCase,
    private readonly putChatDetailsUseCase: PutChatDetailsUseCase,
    private readonly postChatTypesUseCase: PostChatTypesUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/ai/chats/config',
      {
        preHandler: [authMiddleware],
      },
      this.getAIChatDetails.bind(this)
    )
    app.put(
      '/ai/chats/config',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.updateAIChatDetails.bind(this)
    )
    app.post(
      '/ai/chats/config',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.createAIChatType.bind(this)
    )
  }

  /**
   * Retrieves all available chat types with their details and SEO-friendly identifiers.
   *
   * This endpoint fetches all chat type options from the database, ensuring each has
   * complete SEO-friendly fields (slug and base64 ID). The chat types are returned
   * in descending order by creation date. This endpoint requires authentication and
   * admin or moderator role and is typically used to populate chat type selection interfaces.
   *
   * The response includes:
   * - Chat type ID (UUIDv7)
   * - Name and description
   * - SEO-friendly ID (URL-safe slug)
   * - SEO-friendly base64 ID (22-character encoded UUID)
   * - Creation and update timestamps
   *
   * @param {FastifyRequest} request - The Fastify request object containing optional user information
   * @param {FastifyReply} reply - The Fastify reply object for sending responses
   *
   * @returns {Promise<void>} A promise that resolves when the response is sent
   *
   * @example
   * Response format:
   * ```json
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "019bda39-6197-7557-9071-d7ed1c719138",
   *       "name": "General Assistant",
   *       "description": "A general purpose AI assistant",
   *       "seoFriendlyId": "general-assistant",
   *       "seoFriendlyBase64Id": "AbCdEfGhIjKlMnOpQrStUv",
   *       "createdAt": "2024-01-01T00:00:00.000Z",
   *       "updatedAt": "2024-01-01T00:00:00.000Z"
   *     }
   *   ]
   * }
   * ```
   *
   * @throws {BaseException} When a domain-specific error occurs (returns appropriate status code)
   * @throws {Error} When an unexpected error occurs (returns 500 status code)
   */
  async getAIChatDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received getAIChatDetails request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const result = await this.getChatDetailsUseCase.execute(auditContext)

      this.logger.debug(JSON.stringify(result))

      reply.code(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      this.logger.error(
        'Error in getAIChatDetails',
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
   * Updates AI chat details (such as configuration or type) for the current tenant.
   *
   * Flow:
   * - Logs the incoming request and builds an audit context from the authenticated user,
   *   IP address, and User-Agent header.
   * - Performs an authorization check to ensure the caller is authenticated and has
   *   either the `admin` or `moderator` role.
   * - Validates the request body using {@link PutChatTypeDto.validate}, mapping it to a
   *   DTO that is passed to {@link PutChatDetailsUseCase}.
   * - Executes the {@link PutChatDetailsUseCase} with the audit context and DTO to
   *   persist the requested changes.
   * - Returns:
   *   - `401 Unauthorized` if the user is not authenticated.
   *   - `403 Forbidden` if the user lacks the required role.
   *   - `404 Not Found` if the AI chat type cannot be found or the update fails.
   *   - `204 No Content` on successful update.
   *   - `5xx` error codes with a JSON error payload on unexpected failures.
   *
   * The response body follows the convention used by other controller methods:
   * `{ success: boolean, error?: string }`.
   *
   * @param request - Fastify request containing the authenticated user, headers,
   *   and JSON body with the chat details to update.
   * @param reply - Fastify reply used to send the HTTP status code and response payload.
   * @returns A promise that resolves when the response has been sent.
   */
  async updateAIChatDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received updateAIChatDetails request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const body = request.body as components['schemas']['UpdateAIChatTypeRequest']
      const dto = PutChatTypeDto.validate(body)
      const result = await this.putChatDetailsUseCase.execute(auditContext, dto)
      if (!result) {
        reply.code(404).send({
          success: false,
          error: 'AI chat type not found or update failed',
        })
        return
      }
      reply.status(204).send()
    } catch (error) {
      this.logger.error(
        'Error in updateAIChatDetails',
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
   * Creates a new chat type.
   *
   * Validates the request body using {@link PostChatType.validate}, then delegates
   * to {@link PostChatTypesUseCase} to persist the record and write an audit log entry.
   *
   * **Route:** `POST /ai/chats/config`
   * **Auth:** Requires a valid JWT and one of the roles: `admin`, `moderator`.
   *
   * @param request - The Fastify request object. Expected body shape:
   *   ```json
   *   { "name": "General Assistant", "description": "A general-purpose AI assistant" }
   *   ```
   * @param reply - The Fastify reply object used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {400} When `name` or `description` fail DTO validation
   *   (missing, empty, whitespace-only, or exceeds length limits).
   * @throws {409} When a chat type with the same name or SEO identifier already exists.
   * @throws {500} When the request body is not a plain object, or an unexpected
   *   error occurs during persistence.
   *
   * @example
   * // Success — 201 Created
   * // POST /ai/chats/config
   * // Body: { "name": "Creative Writing", "description": "Helps with creative tasks" }
   * // Response: {
   * //   "success": true,
   * //   "data": {
   * //     "id": "01234567-89ab-cdef-0123-456789abcdef",
   * //     "name": "Creative Writing",
   * //     "description": "Helps with creative tasks",
   * //     "seoFriendlyId": "creative-writing",
   * //     "seoFriendlyBase64Id": "AbCdEfGhIjKlMnOpQrStUv",
   * //     "createdAt": "2024-01-01T00:00:00.000Z",
   * //     "updatedAt": "2024-01-01T00:00:00.000Z"
   * //   }
   * // }
   *
   * @example
   * // Validation failure — 400 Bad Request
   * // Body: { "name": "" }
   * // Response: { "success": false, "error": "Invalid name: must be a non-empty string" }
   *
   * @example
   * // Conflict — 409 Conflict
   * // Body: { "name": "Creative Writing", "description": "Duplicate" }
   * // Response: { "success": false, "error": "A chat type with this name or identifier already exists" }
   */
  async createAIChatType(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received createAIChatType request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const body = request.body as components['schemas']['CreateAIChatTypeRequest']
      const dto = PostChatType.validate(body)
      const createdChatType = await this.postChatTypesUseCase.execute(auditContext, dto)
      reply.code(201).send({
        success: true,
        data: {
          id: createdChatType.id,
          name: createdChatType.name,
          description: createdChatType.description,
          rag: createdChatType.rag,
          seoFriendlyId: createdChatType.seoFriendlyId,
          seoFriendlyBase64Id: createdChatType.seoFriendlyBase64Id,
          createdAt: createdChatType.createdAt,
          updatedAt: createdChatType.updatedAt,
        },
      })
    } catch (error) {
      this.logger.error(
        'Error in createAIChatType',
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
