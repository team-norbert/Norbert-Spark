import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { GetCompanyDetailsUseCase } from '../../../application/use-cases/get-company-details.use-case.js'
import { UpdateCompanyDTO } from '../../../application/dtos/update-company.dto.js'
import { PutCompanyDetailsUseCase } from '../../../application/use-cases/put-company-details.use-case.js'
/**
 * HTTP controller for company-related operations.
 *
 * @remarks
 * This controller handles HTTP endpoints for retrieving company and key person details.
 * All routes require authentication via JWT and role-based authorization (admin or moderator).
 *
 * The controller follows the hexagonal architecture pattern, delegating business logic
 * to use cases and handling HTTP-specific concerns like request/response formatting,
 * error handling, and audit context extraction.
 *
 * @example
 * ```typescript
 * const controller = new CompanyController(logger, getCompanyDetailsUseCase)
 * controller.registerRoutes(fastifyApp)
 * ```
 */
export class CompanyController {
  /**
   * Creates an instance of CompanyController.
   *
   * @param logger - Logger port for logging HTTP events and errors
   * @param getCompanyDetailsUseCase - Use case for retrieving company and key person details
   *
   * @remarks
   * Dependencies are injected through the constructor following the dependency injection pattern.
   * The logger is used for tracking request flow and errors, while the use case handles
   * the business logic for fetching company data.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly getCompanyDetailsUseCase: GetCompanyDetailsUseCase,
    private readonly putCompanyDetailsUseCase: PutCompanyDetailsUseCase
  ) {}

  /**
   * Registers all company-related HTTP routes with the Fastify application.
   *
   * @param app - Fastify application instance
   *
   * @remarks
   * Registers the following routes:
   * - GET /company/details - Retrieves company and key person details
   *
   * All routes are protected with:
   * - Authentication middleware (JWT verification)
   * - Role-based authorization (admin or moderator roles required)
   *
   * Route handlers are bound to the controller instance to preserve the `this` context.
   *
   * @example
   * ```typescript
   * const fastifyApp = fastify()
   * controller.registerRoutes(fastifyApp)
   * ```
   */
  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/company/details',
      {
        preHandler: [authMiddleware],
      },
      this.getCompanyDetails.bind(this)
    )
    app.put(
      '/company/details',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.updateCompanyDetails.bind(this)
    )
  }

  async updateCompanyDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('updateCompanyDetails called')

    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    // Authorization check: User can only access their own chat history unless they have admin/moderator role
    const authenticatedUserId = request.user?.sub
    const userRoles = request.user?.roles || []

    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }

    // Check if user is accessing their own data OR has admin/moderator role
    const isOwnData = authenticatedUserId === auditContext.userId
    const hasElevatedRole = userRoles.includes('admin') || userRoles.includes('moderator')

    if (!isOwnData && !hasElevatedRole) {
      this.logger.warn(
        `Authorization check failed: User ${authenticatedUserId} attempted to access company details without required permissions`
      )
      return reply.code(403).send({
        success: false,
        error:
          'Access denied. You can only access your own chat history or must have admin/moderator role',
      })
    }

    try {
      const dto = UpdateCompanyDTO.validate(request.body)

      const result = await this.putCompanyDetailsUseCase.execute(auditContext, dto)
      if (result) {
        reply.status(204).send()
      }
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * HTTP handler for retrieving company and key person details.
   *
   * @param request - Fastify request object containing user authentication and client metadata
   * @param reply - Fastify reply object for sending HTTP responses
   *
   * @returns Promise resolving to HTTP response with company and key person data or error
   *
   * @remarks
   * This endpoint retrieves singleton company and key person records from the database.
   * Since both tables enforce single-row constraints, at most one record of each type is returned.
   *
   * **Authentication & Authorization:**
   * - Requires valid JWT authentication (handled by authMiddleware)
   * - Requires admin or moderator role (handled by requireRole middleware)
   *
   * **Audit Context:**
   * The handler extracts audit context from the request:
   * - `userId`: From JWT claims (request.user.sub)
   * - `ipAddress`: Client IP address
   * - `userAgent`: Client user agent header
   *
   * **Success Response (200):**
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "company": { companyId, legalName, displayName, ... } | null,
   *     "keyPerson": { keyPersonId, firstName, lastName, email, ... } | null
   *   }
   * }
   * ```
   *
   * **Error Response (4xx/5xx):**
   * ```json
   * {
   *   "success": false,
   *   "error": "Error message"
   * }
   * ```
   *
   * **Status Codes:**
   * - 200: Success - returns company and key person data (may be null)
   * - 400: Bad Request - validation error
   * - 401: Unauthorized - authentication failed
   * - 403: Forbidden - insufficient permissions
   * - 500: Internal Server Error - unexpected server error
   *
   * **Error Handling:**
   * - BaseException errors use their status code and message
   * - Generic errors default to 500 status code
   * - All errors are logged and sent with standardized format
   *
   * @throws {BaseException} When validation, authorization, or business logic errors occur
   * @throws {Error} For unexpected errors (returned as 500 status code)
   *
   * @example
   * ```typescript
   * // Request with authenticated user
   * GET /company/details
   * Headers: {
   *   Authorization: "Bearer <jwt_token>"
   * }
   *
   * // Response
   * {
   *   "success": true,
   *   "data": {
   *     "company": {
   *       "companyId": "uuid",
   *       "legalName": "Acme Corporation LLC",
   *       "displayName": "Acme Corp",
   *       "status": "active",
   *       ...
   *     },
   *     "keyPerson": {
   *       "keyPersonId": "uuid",
   *       "firstName": "John",
   *       "lastName": "Doe",
   *       "email": "john@example.com",
   *       ...
   *     }
   *   }
   * }
   * ```
   */
  async getCompanyDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('Received company GET request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }
    // Check authentication
    const authenticatedUserId = request.user?.sub
    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }
    try {
      const result = await this.getCompanyDetailsUseCase.execute(auditContext)
      return reply.code(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
