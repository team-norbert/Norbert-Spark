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

/**
 * HTTP controller responsible for AI chat configuration endpoints.
 *
 * Handles CRUD operations for chat types — the tenant-level configuration objects
 * that define the system prompt, SEO identifiers, and RAG settings used when
 * starting a new AI conversation.
 *
 * All routes registered by this controller require JWT authentication.
 * Mutating routes (`PUT`, `POST`) additionally require the `admin` or `moderator` role.
 *
 * @see {@link AIController} for routes that handle live chat sessions and history retrieval.
 */
export class AIConfigController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly getChatDetailsUseCase: GetChatDetailsUseCase,
    private readonly putChatDetailsUseCase: PutChatDetailsUseCase,
    private readonly postChatTypesUseCase: PostChatTypesUseCase
  ) {}

  /**
   * Registers the AI configuration routes on the given Fastify instance.
   *
   * Registers:
   * - `GET  /ai/chats/config` — retrieve all chat types (any authenticated user)
   * - `PUT  /ai/chats/config` — update an existing chat type (`admin` | `moderator`)
   * - `POST /ai/chats/config` — create a new chat type (`admin` | `moderator`)
   *
   * @param app - The Fastify instance to register routes on.
   */
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
   * Fetches all chat type options from the database, ensuring each entry has complete
   * SEO-friendly fields (URL slug and base64 ID). Results are returned in descending
   * order by creation date and are typically used to populate chat type selection
   * interfaces.
   *
   * **Route:** `GET /ai/chats/config`
   * **Auth:** Requires a valid JWT (any authenticated user).
   *
   * @param request - The Fastify request object. No body or query parameters required.
   * @param reply - The Fastify reply object used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {500} When an unexpected error occurs during retrieval.
   *
   * @example
   * // Success — 200 OK
   * // GET /ai/chats/config
   * // Response:
   * // {
   * //   "success": true,
   * //   "data": [
   * //     {
   * //       "id": "019bda39-6197-7557-9071-d7ed1c719138",
   * //       "name": "General Assistant",
   * //       "description": "A general purpose AI assistant",
   * //       "seoFriendlyId": "general-assistant",
   * //       "seoFriendlyBase64Id": "AbCdEfGhIjKlMnOpQrStUv",
   * //       "createdAt": "2024-01-01T00:00:00.000Z",
   * //       "updatedAt": "2024-01-01T00:00:00.000Z"
   * //     }
   * //   ]
   * // }
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
   * Updates the configuration for an existing AI chat type.
   *
   * Validates the request body using {@link PutChatTypeDto.validate}, then delegates
   * to {@link PutChatDetailsUseCase} to persist the changes and write an audit log entry.
   *
   * **Route:** `PUT /ai/chats/config`
   * **Auth:** Requires a valid JWT and one of the roles: `admin`, `moderator`.
   *
   * @param request - The Fastify request object. Expected body shape:
   *   ```json
   *   {
   *     "id": "019bda39-6197-7557-9071-d7ed1c719138",
   *     "name": "Updated Name",
   *     "description": "Updated description",
   *     "seoFriendlyId": "updated-name"
   *   }
   *   ```
   * @param reply - The Fastify reply object used to send the HTTP response.
   * @returns A promise that resolves once the response has been sent.
   *
   * @throws {400} When the request body fails DTO validation.
   * @throws {404} When no chat type matching the given ID is found.
   * @throws {500} When an unexpected error occurs during the update.
   *
   * @example
   * // Success — 204 No Content
   * // PUT /ai/chats/config
   * // Body: { "id": "019bda39-...", "name": "Updated Name", "description": "New description" }
   * // Response: (empty body)
   *
   * @example
   * // Not Found — 404
   * // Response: { "success": false, "error": "AI chat type not found or update failed" }
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
