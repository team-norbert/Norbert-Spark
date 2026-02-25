import { RagDto } from '../dtos/rag.dto.js'

export interface AiRagRepositoryPost {
  createRagVectorEntry(data: RagDto): Promise<void>
}
