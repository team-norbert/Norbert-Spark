import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRAGRepository } from '../../../../src/adapters/secondary/repositories/ai-rag.repository.js'
import type { CreateVectorStoreData } from '../../../../src/application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import type { DBEmbeddingModelSelect } from '../../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}))

describe('AIRAGRepository', () => {
  let repository: AIRAGRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = createMockLogger()

    repository = new AIRAGRepository(mockLogger)
  })

  describe('getAllEmbeddingModels', () => {
    it('should return all embedding models ordered by createdAt descending', async () => {
      const mockModels = [
        {
          id: '018e1234-0000-7000-8000-000000000001',
          name: 'text-embedding-3-large',
          provider: 'openai',
          dimension: 3072,
          createdAt: new Date('2026-02-01T10:00:00Z'),
          updatedAt: new Date('2026-02-01T10:00:00Z'),
        },
        {
          id: '018e1234-0000-7000-8000-000000000002',
          name: 'text-embedding-3-small',
          provider: 'openai',
          dimension: 1536,
          createdAt: new Date('2026-01-01T10:00:00Z'),
          updatedAt: new Date('2026-01-01T10:00:00Z'),
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllEmbeddingModels()

      expect(result).toEqual(mockModels)
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalled()
      expect(mockOrderBy).toHaveBeenCalled()
    })

    it('should return an empty array when no embedding models exist', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllEmbeddingModels()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should return all fields for each model', async () => {
      const mockModel = {
        id: '018e1234-0000-7000-8000-000000000001',
        name: 'nomic-embed-text-v1.5',
        provider: 'nomic',
        dimension: 768,
        createdAt: new Date('2026-02-10T08:30:00Z'),
        updatedAt: new Date('2026-02-10T08:30:00Z'),
      }

      const mockOrderBy = vi.fn().mockResolvedValue([mockModel])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllEmbeddingModels()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockModel.id,
        name: mockModel.name,
        provider: mockModel.provider,
        dimension: mockModel.dimension,
        createdAt: mockModel.createdAt,
        updatedAt: mockModel.updatedAt,
      })
    })

    it('should throw and log an error when the database throws', async () => {
      const dbError = new Error('Connection refused')

      const mockFrom = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(dbError),
      })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getAllEmbeddingModels()).rejects.toThrow('Connection refused')
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith('Error in getAllEmbeddingModels', dbError)
    })

    it('should wrap non-Error exceptions before passing to the logger and rethrow', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue('string error'),
      })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getAllEmbeddingModels()).rejects.toBe('string error')
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      const loggedError = vi.mocked(mockLogger.error).mock.calls[0]![1]
      expect(loggedError).toBeInstanceOf(Error)
      expect((loggedError as Error).message).toBe('string error')
    })
  })

  describe('getEmbeddingModelById', () => {
    const mockModel: DBEmbeddingModelSelect = {
      id: '018e1234-0000-7000-8000-000000000001',
      name: 'text-embedding-3-large',
      provider: 'openai',
      dimension: 1536,
      status: 'current',
      releaseYear: 2024,
      recommendedUsage: 'General-purpose semantic search',
      taskType: null,
      createdAt: new Date('2026-02-01T10:00:00Z'),
      updatedAt: new Date('2026-02-01T10:00:00Z'),
    }

    it('should return the model when found by id', async () => {
      const mockLimit = vi.fn().mockResolvedValue([mockModel])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getEmbeddingModelById(mockModel.id)

      expect(result).toEqual(mockModel)
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return undefined when no model matches the id', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getEmbeddingModelById('non-existent-id')

      expect(result).toBeUndefined()
    })

    it('should throw and log an error when the database throws', async () => {
      const dbError = new Error('DB connection failed')

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockRejectedValue(dbError),
      })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getEmbeddingModelById(mockModel.id)).rejects.toThrow(
        'DB connection failed'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith('Error in getEmbeddingModelById', dbError)
    })
  })

  describe('createVectorStore', () => {
    const MODEL_ID = '018e1234-0000-7000-8000-000000000001'
    const CHAT_TYPE_ID = '018e1234-0000-7000-8000-000000000002'
    const DOC_ID = '018e1234-0000-7000-8000-000000000003'
    const VS_ID = '018e1234-0000-7000-8000-000000000004'
    const CHAT_OPT_ID = '018e1234-0000-7000-8000-000000000005'
    const TS = new Date('2026-01-01T00:00:00.000Z')
    const CHECKSUM = 'a'.repeat(64)

    const makeCreateVectorStoreData = (
      overrides: Partial<CreateVectorStoreData> = {}
    ): CreateVectorStoreData => ({
      vectorStoreName: 'Test Vector Store',
      embeddingModelId: MODEL_ID,
      dimension: 1536,
      chunkSize: 512,
      chunkOverlap: 50,
      documents: [
        {
          title: 'Test Document',
          source: 'rag/test.pdf',
          checksum: CHECKSUM,
          records: [{ content: 'chunk one', embedding: [0.1, 0.2, 0.3] }],
        },
      ],
      chatAIOptions: {
        chatTypeId: CHAT_TYPE_ID,
        prompt: 'You are a helpful assistant',
        maxTokens: 1000,
        temperature: 0.7,
        stopSequences: ['END'],
        maxRetries: 3,
      },
      ...overrides,
    })

    it('should create a vector store and return the result', async () => {
      const insertedDoc = {
        id: DOC_ID,
        title: 'Test Document',
        source: 'rag/test.pdf',
        checksum: CHECKSUM,
        createdAt: TS,
        updatedAt: TS,
      }
      const vectorStore = { id: VS_ID, createdAt: TS, updatedAt: TS }
      const chatAIOptions = {
        id: CHAT_OPT_ID,
        prompt: 'You are a helpful assistant',
        maxTokens: 1000,
        temperature: '0.7',
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        stopSequences: ['END'],
        maxRetries: 3,
        createdAt: TS,
        updatedAt: TS,
      }

      // Build a Drizzle-like insert chain that is also thenable (awaitable via `values()`).
      // This covers both patterns used in the repository:
      //   1. await tx.insert(X).values(…).returning()
      //   2. await tx.insert(X).values(…)            ← join / embeddings tables
      const makeInsertChain = (returningValue: unknown[]) => {
        const chain = {
          returning: vi.fn().mockResolvedValue(returningValue),
          onConflictDoUpdate: vi.fn(),
          // Make the chain itself thenable so `await tx.insert(X).values(…)` resolves.
          then: (resolve: (v: unknown) => void) => resolve(returningValue),
        }
        chain.onConflictDoUpdate.mockReturnValue({
          returning: vi.fn().mockResolvedValue(returningValue),
        })
        return chain
      }

      let insertCallCount = 0
      const mockInsert = vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => {
          insertCallCount++
          if (insertCallCount === 1) return makeInsertChain([vectorStore]) // vectorStores
          if (insertCallCount === 2) return makeInsertChain([insertedDoc]) // documents
          if (insertCallCount === 3) return makeInsertChain([]) // vectorStoreDocuments
          if (insertCallCount === 4) return makeInsertChain([]) // vectorEmbeddings1536
          // chatAiOptions upsert (uses onConflictDoUpdate)
          const upsertReturning = vi.fn().mockResolvedValue([chatAIOptions])
          return {
            returning: upsertReturning,
            onConflictDoUpdate: vi.fn().mockReturnValue({ returning: upsertReturning }),
            then: (resolve: (v: unknown) => void) => resolve([chatAIOptions]),
          }
        }),
      }))

      vi.mocked(db.transaction).mockImplementation(async (callback) =>
        callback({ insert: mockInsert } as any)
      )

      const result = await repository.createVectorStore(makeCreateVectorStoreData())

      expect(result.vectorStore.id).toBe(VS_ID)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]!.checksum).toBe(CHECKSUM)
      expect(result.chatAIOptions.id).toBe(CHAT_OPT_ID)
    })

    it('should throw when the vector store insert returns no row', async () => {
      const mockReturning = vi.fn().mockResolvedValueOnce([]) // no row returned
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

      vi.mocked(db.transaction).mockImplementation(async (callback) =>
        callback({ insert: mockInsert } as any)
      )

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Failed to insert vector store record'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should throw when a document checksum is null after insert', async () => {
      const vectorStore = { id: VS_ID, createdAt: TS, updatedAt: TS }
      const insertedDocWithNullChecksum = {
        id: DOC_ID,
        title: 'Test Document',
        source: 'rag/test.pdf',
        checksum: null,
        createdAt: TS,
        updatedAt: TS,
      }

      const mockReturning = vi
        .fn()
        .mockResolvedValueOnce([vectorStore])
        .mockResolvedValueOnce([insertedDocWithNullChecksum])

      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

      vi.mocked(db.transaction).mockImplementation(async (callback) =>
        callback({ insert: mockInsert } as any)
      )

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Document checksum is null after insert for: Test Document'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should throw and log when the transaction throws', async () => {
      const dbError = new Error('Transaction failed')

      vi.mocked(db.transaction).mockRejectedValue(dbError)

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Transaction failed'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith('Error in createVectorStore', dbError)
    })
  })
})
