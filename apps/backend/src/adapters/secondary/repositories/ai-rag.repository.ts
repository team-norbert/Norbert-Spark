import { desc, eq } from 'drizzle-orm'

import { RagDto } from '../../../application/dtos/rag.dto.js'
import type {
  AiRagRepositoryPost,
  CreateVectorStoreData,
  CreateVectorStoreResult,
} from '../../../application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import {
  chatAiOptions,
  type DBEmbeddingModelSelect,
  documents,
  embeddingModels,
  vectorEmbeddings384,
  vectorEmbeddings768,
  vectorEmbeddings1024,
  vectorEmbeddings1536,
  vectorEmbeddings3072,
  vectorStoreDocuments,
  vectorStores,
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
    const error = new Error('createRagVectorEntry is not implemented yet')
    this.logger.error('createRagVectorEntry called before implementation', error)
    throw error
  }

  /**
   * Retrieves all embedding models from the `embedding_models` table, ordered
   * by `createdAt` descending (most recently added first).
   *
   * Logs and rethrows any database error so callers receive a rejected promise
   * and the HTTP layer can respond with a 500 status instead of silently
   * returning an empty list.
   *
   * @returns A promise that resolves to an array of `DBEmbeddingModelSelect`
   *   records.
   * @throws The original database error after logging it.
   */
  async getAllEmbeddingModels(): Promise<DBEmbeddingModelSelect[]> {
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
      throw error
    }
  }

  async createVectorStore(data: CreateVectorStoreData): Promise<CreateVectorStoreResult> {
    try {
      return await db.transaction(async (tx) => {
        // Step 1: Create the vector store record.
        const [vectorStore] = await tx
          .insert(vectorStores)
          .values({
            name: data.vectorStoreName,
            embeddingModelId: data.embeddingModelId,
          })
          .returning({
            id: vectorStores.id,
            createdAt: vectorStores.createdAt,
            updatedAt: vectorStores.updatedAt,
          })

        if (!vectorStore) {
          throw new Error('Failed to insert vector store record')
        }

        // Step 2: For each document insert the document row, link it to the
        //         vector store, then persist its chunks as vector embeddings.
        const insertedDocuments: CreateVectorStoreResult['documents'] = []

        for (const doc of data.documents) {
          // 2a. Persist source document metadata.
          const [insertedDoc] = await tx
            .insert(documents)
            .values({
              title: doc.title,
              source: doc.source,
              checksum: doc.checksum,
              status: 'indexed',
            })
            .returning({
              id: documents.id,
              title: documents.title,
              source: documents.source,
              checksum: documents.checksum,
              createdAt: documents.createdAt,
              updatedAt: documents.updatedAt,
            })

          if (!insertedDoc) {
            throw new Error(`Failed to insert document record for: ${doc.title}`)
          }

          if (insertedDoc.checksum == null) {
            throw new Error(`Document checksum is null after insert for: ${doc.title}`)
          }

          insertedDocuments.push({
            id: insertedDoc.id,
            title: insertedDoc.title,
            source: insertedDoc.source,
            checksum: insertedDoc.checksum,
            createdAt: insertedDoc.createdAt,
            updatedAt: insertedDoc.updatedAt,
          })

          // 2b. Link the document to the vector store (join table).
          await tx.insert(vectorStoreDocuments).values({
            vectorStoreId: vectorStore.id,
            documentId: insertedDoc.id,
          })

          // 2c. Persist chunk embeddings in the dimension-specific table.
          if (doc.records.length > 0) {
            const embeddingRows = doc.records.map((record, index) => ({
              documentId: insertedDoc.id,
              embeddingModelId: data.embeddingModelId,
              chunkIndex: index,
              content: record.content,
              embedding: record.embedding,
              chunkSize: data.chunkSize,
              chunkOverlap: data.chunkOverlap,
            }))

            switch (data.dimension) {
              case 384:
                await tx.insert(vectorEmbeddings384).values(embeddingRows)
                break
              case 768:
                await tx.insert(vectorEmbeddings768).values(embeddingRows)
                break
              case 1024:
                await tx.insert(vectorEmbeddings1024).values(embeddingRows)
                break
              case 1536:
                await tx.insert(vectorEmbeddings1536).values(embeddingRows)
                break
              case 3072:
                await tx.insert(vectorEmbeddings3072).values(embeddingRows)
                break
              default:
                throw new Error(`Unsupported embedding dimension: ${String(data.dimension)}`)
            }
          }
        }

        // Step 3: Persist AI chat options linked to the chosen chat type.
        //         Use upsert (onConflictDoUpdate) because chatTypeId is unique —
        //         a second vector store creation for the same chatTypeId must
        //         update the existing row rather than fail with a unique violation.
        //         Numeric columns (temperature, topP, etc.) must be strings in PG.
        const [upsertedChatAIOptions] = await tx
          .insert(chatAiOptions)
          .values({
            chatTypeId: data.chatAIOptions.chatTypeId,
            prompt: data.chatAIOptions.prompt,
            maxTokens: data.chatAIOptions.maxTokens ?? null,
            temperature:
              data.chatAIOptions.temperature != null
                ? String(data.chatAIOptions.temperature)
                : null,
            topP: data.chatAIOptions.topP != null ? String(data.chatAIOptions.topP) : null,
            frequencyPenalty:
              data.chatAIOptions.frequencyPenalty != null
                ? String(data.chatAIOptions.frequencyPenalty)
                : null,
            presencePenalty:
              data.chatAIOptions.presencePenalty != null
                ? String(data.chatAIOptions.presencePenalty)
                : null,
            stopSequences: data.chatAIOptions.stopSequences ?? null,
            maxRetries: data.chatAIOptions.maxRetries ?? null,
          })
          .onConflictDoUpdate({
            target: chatAiOptions.chatTypeId,
            set: {
              prompt: data.chatAIOptions.prompt,
              maxTokens: data.chatAIOptions.maxTokens ?? null,
              temperature:
                data.chatAIOptions.temperature != null
                  ? String(data.chatAIOptions.temperature)
                  : null,
              topP: data.chatAIOptions.topP != null ? String(data.chatAIOptions.topP) : null,
              frequencyPenalty:
                data.chatAIOptions.frequencyPenalty != null
                  ? String(data.chatAIOptions.frequencyPenalty)
                  : null,
              presencePenalty:
                data.chatAIOptions.presencePenalty != null
                  ? String(data.chatAIOptions.presencePenalty)
                  : null,
              stopSequences: data.chatAIOptions.stopSequences ?? null,
              maxRetries: data.chatAIOptions.maxRetries ?? null,
            },
          })
          .returning({
            id: chatAiOptions.id,
            prompt: chatAiOptions.prompt,
            maxTokens: chatAiOptions.maxTokens,
            temperature: chatAiOptions.temperature,
            topP: chatAiOptions.topP,
            frequencyPenalty: chatAiOptions.frequencyPenalty,
            presencePenalty: chatAiOptions.presencePenalty,
            stopSequences: chatAiOptions.stopSequences,
            maxRetries: chatAiOptions.maxRetries,
            createdAt: chatAiOptions.createdAt,
            updatedAt: chatAiOptions.updatedAt,
          })

        if (!upsertedChatAIOptions) {
          throw new Error('Failed to insert or update chat AI options record')
        }

        return {
          documents: insertedDocuments,
          vectorStore: {
            id: vectorStore.id,
            createdAt: vectorStore.createdAt,
            updatedAt: vectorStore.updatedAt,
          },
          chatAIOptions: upsertedChatAIOptions,
        }
      })
    } catch (error) {
      this.logger.error(
        'Error in createVectorStore',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  async getEmbeddingModelById(id: string): Promise<DBEmbeddingModelSelect | undefined> {
    try {
      const rows: DBEmbeddingModelSelect[] = await db
        .select()
        .from(embeddingModels)
        .where(eq(embeddingModels.id, id))
        .limit(1)
      return rows[0]
    } catch (error) {
      this.logger.error(
        'Error in getEmbeddingModelById',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
}
