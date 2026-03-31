import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import { RagDto } from '../dtos/rag.dto.js'

export interface CreateVectorStoreDocumentWithRecords {
  title: string
  source: string
  checksum: string
  records: Array<{ content: string; embedding: number[] }>
}

export interface CreateVectorStoreChatAIOptions {
  chatTypeId: string
  prompt: string
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  maxRetries?: number
}

export interface CreateVectorStoreData {
  vectorStoreName: string
  embeddingModelId: string
  dimension: 384 | 768 | 1024 | 1536 | 3072
  documents: CreateVectorStoreDocumentWithRecords[]
  chunkSize: number
  chunkOverlap: number
  chatAIOptions: CreateVectorStoreChatAIOptions
}

export interface CreateVectorStoreResult {
  documents: Array<{
    id: string
    title: string
    source: string
    checksum: string
    createdAt: Date
    updatedAt: Date
  }>
  vectorStore: {
    id: string
    createdAt: Date
    updatedAt: Date
  }
  /** Drizzle returns `numeric` columns as strings; the caller converts to numbers. */
  chatAIOptions: {
    id: string
    prompt: string
    maxTokens: number | null
    temperature: string | null
    topP: string | null
    frequencyPenalty: string | null
    presencePenalty: string | null
    stopSequences: string[] | null
    maxRetries: number | null
    createdAt: Date
    updatedAt: Date
  }
}

export interface AiRagRepositoryPost {
  createRagVectorEntry(data: RagDto): Promise<void>
  getAllEmbeddingModels(): Promise<DBEmbeddingModelSelect[]>
  getEmbeddingModelById(id: string): Promise<DBEmbeddingModelSelect | undefined>
  createVectorStore(data: CreateVectorStoreData): Promise<CreateVectorStoreResult>
}
