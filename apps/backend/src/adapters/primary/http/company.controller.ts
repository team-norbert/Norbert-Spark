import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import type { FastifyInstance } from 'fastify'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { GetCompanyDetailsUseCase } from '../../../application/use-cases/get-company-details.use-case.js'
import type { DBCompanySelect, DBKeyPersonSelect } from '../../../infrastructure/database/schema.js'

export class CompanyController {
  constructor(
    private readonly logger: LoggerPort,
    private readonly getCompanyDetailsUseCase: GetCompanyDetailsUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/company/details',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getCompanyDetails.bind(this)
    )
  }

  async getCompanyDetails(
    request: any,
    reply: any
  ): Promise<{
    company: DBCompanySelect | null
    keyPerson: DBKeyPersonSelect | null
  }> {
    this.logger.info('Received company GET request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
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
