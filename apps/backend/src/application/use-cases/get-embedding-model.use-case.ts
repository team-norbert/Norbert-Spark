import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

export class GetEmbeddingModelUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiRagRepository: AIRAGRepository
  ) {}

  public async execute(): Promise<DBEmbeddingModelSelect[]> {
    this.logger.info('GetEmbeddingModelUseCase.execute', {})
    return (await this.aiRagRepository.getAllEmbeddingModels()) || []
  }
}
