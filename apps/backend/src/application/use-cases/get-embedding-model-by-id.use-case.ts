import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import type { LoggerPort } from '../ports/logger.port.js'

export class GetEmbeddingModelByIdUseCase {
  /**
   * @param logger - Structured logger used to record execution telemetry.
   * @param aiRagRepository - Repository that provides access to the `embedding_models` table.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRagRepository: AIRAGRepository
  ) {}
  public async execute(id: string): Promise<DBEmbeddingModelSelect | undefined> {
    this.logger.info('Fetching embedding models', { event: 'embedding_model.fetch.attempt' })
    return this.aiRagRepository.getEmbeddingModelById(id)
  }
}
