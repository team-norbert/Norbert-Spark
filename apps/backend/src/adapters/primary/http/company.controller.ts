import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { GetCompanyDetailsUseCase } from '../../../application/use-cases/get-company-details.use-case.js'
import { UpdateCompanyDTO } from '../../../application/dtos/update-company.dto.js'
import { PutCompanyDetailsUseCase } from '../../../application/use-cases/put-company-details.use-case.js'
import { DrizzleQueryError } from 'drizzle-orm'
/**
 * HTTP controller for company-related operations.
 *
 * @remarks
 * This controller handles HTTP endpoints for managing company and key person data:
 * - GET /company/details - Retrieve company and key person details
 * - PUT /company/details - Update company and/or key person details
 *
 * All routes require authentication via JWT. The PUT endpoint additionally requires
 * admin or moderator role, or the user must be updating their own data.
 *
 * The controller follows the hexagonal architecture pattern, delegating business logic
 * to use cases and handling HTTP-specific concerns like request/response formatting,
 * error handling, and audit context extraction.
 *
 * **Architecture:**
 * - Primary Adapter (HTTP Layer)
 * - Uses GetCompanyDetailsUseCase for retrieving data
 * - Uses PutCompanyDetailsUseCase for updating data
 * - Extracts audit context for all operations
 * - Implements authentication and authorization checks
 *
 * **Singleton Pattern:**
 * Both company and key_person tables enforce single-row constraints at the database level.
 * All GET/PUT operations work with these singleton records.
 *
 * @example
 * ```typescript
 * const controller = new CompanyController(
 *   logger,
 *   getCompanyDetailsUseCase,
 *   putCompanyDetailsUseCase
 * )
 * controller.registerRoutes(fastifyApp)
 * ```
 */
export class CompanyController {
  /**
   * Creates an instance of CompanyController.
   *
   * @param logger - Logger port for logging HTTP events and errors
   * @param getCompanyDetailsUseCase - Use case for retrieving company and key person details
   * @param putCompanyDetailsUseCase - Use case for updating company and key person details
   *
   * @remarks
   * Dependencies are injected through the constructor following the dependency injection pattern.
   * The logger is used for tracking request flow and errors, while the use cases handle
   * the business logic for fetching and updating company data.
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
   * - GET /company/details - Retrieves company and key person details (requires authentication)
   * - PUT /company/details - Updates company and key person details (requires authentication + admin/moderator role)
   *
   * All routes are protected with:
   * - Authentication middleware (JWT verification)
   * - GET: Authentication only
   * - PUT: Authentication + Role-based authorization (admin or moderator roles required)
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

  /**
   * HTTP handler for updating company and key person details.
   *
   * @param request - Fastify request object containing user authentication, client metadata, and update data
   * @param reply - Fastify reply object for sending HTTP responses
   *
   * @returns Promise resolving to HTTP 204 No Content on success, or error response
   *
   * @remarks
   * This endpoint updates singleton company and/or key person records in the database.
   * Both tables enforce single-row constraints, so updates always target the single existing record.
   *
   * **Authentication & Authorization:**
   * - Requires valid JWT authentication (handled by authMiddleware)
   * - Requires admin or moderator role (enforced by requireRole middleware)
   *
   * **Request Body:**
   * The request body must match UpdateCompanyDTO schema and can contain:
   * - `company`: Object with company fields to update (companyId required)
   * - `keyPerson`: Object with key person fields to update (keyPersonId required)
   * - Both, one, or neither (empty object is valid)
   *
   * **Audit Context:**
   * The handler extracts audit context from the request for audit logging:
   * - `userId`: From JWT claims (request.user.sub)
   * - `ipAddress`: Client IP address
   * - `userAgent`: Client user agent header (null if missing)
   *
   * **Success Response (204 No Content):**
   * Empty response body with HTTP 204 status code.
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
   * - 204: Success - company/key person updated, no content returned
   * - 400: Bad Request - validation error (invalid UUID, missing required fields, etc.)
   * - 401: Unauthorized - authentication failed (no JWT or invalid token)
   * - 403: Forbidden - insufficient permissions (user does not have admin or moderator role)
   * - 500: Internal Server Error - unexpected server error
   *
   * **Validation:**
   * Request body is validated using UpdateCompanyDTO.validate() which checks:
   * - Valid UUIDv7 format for companyId and keyPersonId
   * - Valid email format for key person email
   * - Valid URL format for company website
   * - Valid country code for billing country
   * - Enum values for status, industry, company size, timezone
   *
   * **Audit Logging:**
   * All successful updates are logged to the audit log with:
   * - Entity type (COMPANY or KEY_PERSON)
   * - Action (UPDATE)
   * - Entity ID
   * - Audit context (userId, ipAddress, userAgent)
   *
   * **Error Handling:**
   * - ValidationException: Returns 400 with validation error message
   * - BaseException: Uses exception's status code and message
   * - Generic errors: Default to 500 status code
   * - All errors are logged and sent with standardized format
   *
   * @throws {ValidationException} When request body fails validation (invalid format, missing fields)
   * @throws {UnauthorizedException} When authentication fails or permissions are insufficient
   * @throws {BaseException} When business logic errors occur
   * @throws {Error} For unexpected errors (returned as 500 status code)
   *
   * @example
   * ```typescript
   * // Update company details only
   * PUT /company/details
   * Headers: {
   *   Authorization: "Bearer <jwt_token>"
   * }
   * Body: {
   *   "company": {
   *     "companyId": "019c0027-c91d-7ea6-b833-e44d18ac8021",
   *     "legalName": "Updated Company LLC",
   *     "displayName": "Updated Co",
   *     "status": "active"
   *   }
   * }
   *
   * // Update key person details only
   * PUT /company/details
   * Body: {
   *   "keyPerson": {
   *     "keyPersonId": "019c0027-c91d-7ea6-b833-e44d18ac8022",
   *     "firstName": "Jane",
   *     "lastName": "Doe",
   *     "email": "jane.doe@example.com"
   *   }
   * }
   *
   * // Update both company and key person
   * PUT /company/details
   * Body: {
   *   "company": {
   *     "companyId": "019c0027-c91d-7ea6-b833-e44d18ac8021",
   *     "legalName": "Updated Company LLC"
   *   },
   *   "keyPerson": {
   *     "keyPersonId": "019c0027-c91d-7ea6-b833-e44d18ac8022",
   *     "email": "newemail@example.com"
   *   }
   * }
   *
   * // All requests return 204 No Content on success
   * ```
   */
  async updateCompanyDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('updateCompanyDetails called')

    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const dto = UpdateCompanyDTO.validate(request.body)

      const result = await this.putCompanyDetailsUseCase.execute(auditContext, dto)

      if (!result || (!result.company && !result.keyPerson)) {
        this.logger.warn('No update data provided for company details')
        return reply.code(400).send({
          success: false,
          error: 'No update data provided',
        })
      }

      return reply.status(204).send()
    } catch (error) {
      this.logger.error(
        'Error updating company details',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to update company details due to a database error'
          : err?.message || 'Failed to update company details due to a database error'
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
      this.logger.error(
        'Error in getCompanyDetails handler',
        error instanceof Error ? error : new Error(String(error))
      )
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage =
        error instanceof DrizzleQueryError
          ? 'Failed to retrieve company details due to a database error'
          : err?.message || 'Failed to retrieve company details due to a database error'
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
