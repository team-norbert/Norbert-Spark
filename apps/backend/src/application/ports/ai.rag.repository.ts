import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import { RagDto } from '../dtos/rag.dto.js'

export interface AiRagRepositoryPost {
  createRagVectorEntry(data: RagDto): Promise<void>
  getAllEmbeddingModels(): Promise<DBEmbeddingModelSelect[]>
}
