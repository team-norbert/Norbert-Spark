import type { AiRagRepositoryPost } from '../ports/ai.rag.repository.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'

export class PostVectorRageUseCase {
  constructor(
    private readonly aiRagRepositoryPost: AiRagRepositoryPost,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}
  async execute() {}
}
