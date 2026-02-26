import { desc } from 'drizzle-orm'

import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { AiRagRepositoryPost } from '../../../application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import {
  type DBEmbeddingModelSelect,
  embeddingModels,
} from '../../../infrastructure/database/schema.js'

export class AIRAGRepository implements AiRagRepositoryPost {
  constructor(private readonly logger: LoggerPort) {}

  async createRagVectorEntry(_data: RagDto): Promise<void> {
    // TODO: Implement vector entry creation using _data
  }

  async getAllEmbeddingModels(): Promise<DBEmbeddingModelSelect[] | undefined> {
    try {
      const rows: DBEmbeddingModelSelect[] = await db
        .select()
        .from(embeddingModels)
        .orderBy(desc(embeddingModels.createdAt))
      return rows
    } catch (error) {
      this.logger.error(
        'Error in getAllEmbeddingModels',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
}
