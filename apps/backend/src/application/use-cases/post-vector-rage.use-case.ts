import type { AiRagRepositoryPost } from '../ports/ai.rag.repository.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'

export class PostVectorRageUseCase {
  constructor(
    private readonly aiRagRepositoryPost: AiRagRepositoryPost,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}
  async execute(
    data: any, // Replace with actual DTO type
    auditContext: any // Replace with actual AuditContext type
  ): Promise<void> {
    try {
      // Call the repository method to create a new RAG vector entry
      await this.aiRagRepositoryPost.createRagVectorEntry(data)
    } catch (error) {
      this.logger.error(
        'Error in PostVectorRageUseCase',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
}
