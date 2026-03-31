import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import type { CreateVectorStoreData, CreateVectorStoreResult } from '../ports/ai.rag.repository.js'
import type { LoggerPort } from '../ports/logger.port.js'

export class CreateVectorStoreUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRagRepository: AIRAGRepository
  ) {}
  execute(data: CreateVectorStoreData): Promise<CreateVectorStoreResult> {
    this.logger.info('Creating vector store', { event: 'vector_store.create.attempt' })
    return this.aiRagRepository.createVectorStore(data)
  }
}
