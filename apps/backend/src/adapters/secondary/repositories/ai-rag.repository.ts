import type { AiRagRepositoryPost } from '../../../application/ports/ai.rag.repository.js'
import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'

export class AIRAGRepository implements AiRagRepositoryPost {
  constructor(private readonly logger: LoggerPort) {}

  async createRagVectorEntry(data: RagDto): Promise<void> {
    // Here is the drizzle query based on the provided schema
  }
}
