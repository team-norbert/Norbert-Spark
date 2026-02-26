import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { AiRagRepositoryPost } from '../../../application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'

export class AIRAGRepository implements AiRagRepositoryPost {
  constructor(private readonly logger: LoggerPort) {}

  async createRagVectorEntry(data: RagDto): Promise<void> {
    throw new Error('Not implemented')
  }
}
