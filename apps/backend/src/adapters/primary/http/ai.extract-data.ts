import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'

export class AIExtractDataController {
  constructor(private readonly logger: LoggerPort) {}

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/ai/extract-data',
      {
        preHandler: [authMiddleware],
      },
      this.extractDataFromText.bind(this)
    )
  }

  async extractDataFromText(request: FastifyRequest, reply: FastifyReply) {
    this.logger.info('Received request to extract data from text')
  }
}
