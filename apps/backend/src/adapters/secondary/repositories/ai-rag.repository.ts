import { desc } from 'drizzle-orm'

import { RagDto } from '../../../application/dtos/rag.dto.js'
import type { AiRagRepositoryPost } from '../../../application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import {
  type DBEmbeddingModelSelect,
  embeddingModels,
} from '../../../infrastructure/database/schema.js'

/**
 * Secondary adapter (repository) for Retrieval-Augmented Generation data access.
 *
 * Implements the {@link AiRagRepositoryPost} port and provides all database
 * I/O for RAG-related features: storing vector embeddings and querying the
 * catalogue of available embedding models.
 *
 * All methods interact directly with the PostgreSQL database via Drizzle ORM.
 * Business logic must not reside here — this class is concerned only with
 * translating application-layer requests into database operations and
 * returning well-typed results.
 */
export class AIRAGRepository implements AiRagRepositoryPost {
  /**
   * @param logger - Structured logger used to record errors during database operations.
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Persists a new RAG vector entry derived from the provided DTO.
   *
   * @param _data - The validated RAG DTO containing the document metadata and
   *   embedding configuration required to create the vector entry.
   * @returns A promise that resolves when the entry has been written.
   *
   * @todo Implement the actual vector insertion logic using `_data`.
   */
  async createRagVectorEntry(_data: RagDto): Promise<void> {
    // TODO: Implement vector entry creation using _data
  }

  /**
   * Retrieves all embedding models from the `embedding_models` table, ordered
   * by `createdAt` descending (most recently added first).
   *
   * Returns `undefined` instead of throwing when a database error occurs —
   * the error is logged and callers should treat `undefined` as an empty
   * result (the use case layer applies the `|| []` fallback).
   *
   * @returns A promise that resolves to an array of `DBEmbeddingModelSelect`
   *   records, or `undefined` if a database error occurred.
   */
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
