import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case.js'
import { GetAllUsersUseCase } from '../../../application/use-cases/get-all-users.use-case.js'
import { RegisterUserDto } from '../../../application/dtos/register-user.dto.js'
import { DeleteUsersDto } from '../../../application/dtos/delete-users.dto.js'
import { UserId } from '../../../domain/value-objects/userID.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { DeleteUsersUseCase } from '../../../application/use-cases/delete-users.use-case.js'
/**
 * HTTP controller for user-related endpoints
 *
 * Handles user registration, retrieval, and management through RESTful API endpoints.
 * Acts as the primary adapter in the hexagonal architecture, translating HTTP requests
 * into use case executions and formatting responses.
 *
 * @class UserController
 * @example
 * ```typescript
 * const controller = new UserController(registerUseCase, getAllUsersUseCase)
 * controller.registerRoutes(fastifyApp)
 * ```
 */
export class UserController {
  /**
   * Creates an instance of UserController
   * @param {RegisterUserUseCase} registerUserUseCase - Use case for registering new users
   * @param {GetAllUsersUseCase} getAllUsersUseCase - Use case for retrieving all users
   * @param {DeleteUsersUseCase} deleteUsersUseCase - Use case for deleting users
   */
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly deleteUsersUseCase: DeleteUsersUseCase
  ) {}

  /**
   * Registers all user-related routes with the Fastify application
   *
   * Configures the following endpoints:
   * - POST /users/register - Register a new user
   * - GET /users - Retrieve all users with pagination
   * - GET /users/:id - Retrieve a specific user by ID (incomplete - returns stub response)
   *
   * @param {FastifyInstance} app - The Fastify application instance
   * @example
   * ```typescript
   * const app = fastify()
   * userController.registerRoutes(app)
   * ```
   */
  registerRoutes(app: FastifyInstance): void {
    app.post('/users/register', this.register.bind(this))
    app.get(
      '/users',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getAllUsers.bind(this)
    )
    app.get(
      '/users/:id',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getUser.bind(this)
    )
    app.delete(
      '/users',
      {
        preHandler: [authMiddleware, requireRole(['admin'])],
      },
      this.deleteUsers.bind(this)
    )
  }

  /**
   * Handles DELETE /users endpoint to delete multiple users in a batch operation.
   *
   * This endpoint performs batch user deletion with the following workflow:
   * 1. Validates the request body to ensure all user IDs are valid UUIDv7 format
   * 2. Extracts audit context (IP address and user agent) from the request
   * 3. Converts user IDs to the appropriate domain type
   * 4. Executes the deletion through the use case
   * 5. Returns success response with confirmation message
   *
   * **Authentication**: Required (JWT token)
   * **Authorization**: Admin role only
   *
   * @param request - Fastify request object containing user IDs in the body
   * @param request.body - Request body with user IDs
   * @param request.body.userIds - Array of user IDs (UUIDv7 strings) to delete
   * @param request.ip - Client IP address for audit logging
   * @param reply - Fastify reply object for sending the response
   *
   * @returns Promise<void> - Resolves when the response has been sent
   *
   * @throws {TypeException} Returns 500 if request body validation fails
   * @throws {TypeException} Returns 500 if userIds field is missing or invalid
   * @throws {TypeException} Returns 500 if any user ID is not a valid UUIDv7
   * @throws {DatabaseException} Returns 500 if database deletion operation fails
   * @throws {BaseException} Returns exception's statusCode for custom exceptions
   * @throws {Error} Returns 500 for any unexpected errors
   *
   * @example
   * ```typescript
   * // Request body
   * {
   *   "userIds": [
   *     "019b8589-7670-725e-b51b-2fcb23f9c593",
   *     "019b8589-7670-725e-b51b-2fcb23f9c594"
   *   ]
   * }
   *
   * // Success response (200)
   * {
   *   "success": true,
   *   "data": "Users have been successfully deleted"
   * }
   *
   * // Error response (500)
   * {
   *   "success": false,
   *   "error": "Invalid UUIDv7 format for userId: not-a-uuid"
   * }
   *
   * // Error response (401) - Unauthorized
   * {
   *   "success": false,
   *   "error": "Unauthorized"
   * }
   *
   * // Error response (403) - Forbidden
   * {
   *   "success": false,
   *   "error": "Forbidden: Insufficient permissions"
   * }
   * ```
   *
   * @remarks
   * - Empty array is valid and will result in no deletions
   * - Duplicate user IDs in the array are allowed
   * - All deletions are performed in a single database transaction
   * - Audit log is created after successful deletion
   * - If audit logging fails, deletion is still considered successful
   */
  async deleteUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = DeleteUsersDto.validate(request.body)

      // Extract audit context from request
      const auditContext = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      if (!request.user?.sub) {
        return reply.code(401).send({
          success: false,
          error: 'User not authenticated',
        })
      }

      // Convert UserIdType
      const userIds = dto.userIds.map((id) => new UserId(id).getValue())
      const result = await this.deleteUsersUseCase.execute(userIds, auditContext)

      if (result) {
        reply.code(200).send({
          success: true,
          data: 'Users have been successfully deleted',
        })
        return
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
  /**
   * Handles GET /users endpoint to retrieve all users with pagination
   *
   * Accepts optional query parameters for pagination:
   * - limit: Number of users per page (1-100, default varies by use case)
   * - offset: Number of users to skip (0 or greater)
   *
   * @param {FastifyRequest} request - Fastify request with query parameters
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>}
   * @example
   * ```
   * GET /users?limit=20&offset=0
   * Response: {
   *   success: true,
   *   data: [...],
   *   pagination: { total: 150, limit: 20, offset: 0 }
   * }
   * ```
   */
  async getAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const query = request.query as { limit?: string; offset?: string }
      const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
      const offset = query.offset ? Number.parseInt(query.offset, 10) : undefined

      // Validate pagination parameters
      if (limit !== undefined && (Number.isNaN(limit) || limit < 1 || limit > 100)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        })
        return
      }

      if (offset !== undefined && (Number.isNaN(offset) || offset < 0)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid offset parameter. Must be 0 or greater.',
        })
        return
      }

      if (!request.user?.sub) {
        return reply.code(401).send({
          success: false,
          error: 'User not authenticated',
        })
      }

      const result = await this.getAllUsersUseCase.execute({ limit, offset })

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
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

  /**
   * Handles POST /users/register endpoint to register a new user
   *
   * Validates the request body using RegisterUserDto, executes the registration
   * use case, and returns the created user with authentication token.
   *
   * @param {FastifyRequest} request - Fastify request with user registration data in body
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>}
   * @example
   * ```
   * POST /users/register
   * Body: {
   *   email: 'user@example.com',
   *   password: 'SecurePass123',
   *   name: 'John Doe',
   *   role: 'member'
   * }
   * Response: {
   *   success: true,
   *   data: {
   *     userId: 'uuid',
   *     access_token: 'jwt.token.here',
   *     token_type: 'Bearer',
   *     expires_in: 3600
   *   }
   * }
   * ```
   */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = RegisterUserDto.validate(request.body)

      // Extract audit context from request
      const auditContext = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Execute use case
      const result = await this.registerUserUseCase.execute(dto, auditContext)

      // Convert result to HTTP response
      reply.code(201).send({
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

  /**
   * Handles GET /users/:id endpoint to retrieve a specific user by ID
   *
   * **Note:** This endpoint is currently incomplete and returns a minimal stub response.
   * Full implementation is pending.
   *
   * @param {FastifyRequest} request - Fastify request with user ID in params
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>} Currently returns only the user ID as a stub response
   * @todo Implement full user retrieval logic with complete user data
   * @example
   * ```
   * GET /users/abc123
   * Current Response: { id: 'abc123' }  // Stub response only
   * ```
   */
  async getUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract and validate params with runtime type checking
      const params = request.params as Record<string, unknown>

      if (typeof params.id !== 'string') {
        reply.code(400).send({
          success: false,
          error: 'Invalid user ID parameter',
        })
        return
      }

      const trimmedId = params.id.trim()

      if (trimmedId === '') {
        reply.code(400).send({
          success: false,
          error: 'Invalid user ID parameter',
        })
        return
      }

      if (!request.user?.sub) {
        return reply.code(401).send({
          success: false,
          error: 'User not authenticated',
        })
      }

      reply.code(200).send({
        success: true,
        data: { id: trimmedId },
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
