import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRAGRepository } from '../../../../src/adapters/secondary/repositories/ai-rag.repository.js'
import type { CreateVectorStoreData } from '../../../../src/application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import type { DBEmbeddingModelSelect } from '../../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}))

const MODEL_ID = '018e1234-0000-7000-8000-000000000001'
const CHAT_TYPE_ID = '018e1234-0000-7000-8000-000000000002'
const DOC_ID = '018e1234-0000-7000-8000-000000000003'
const VS_ID = '018e1234-0000-7000-8000-000000000004'
const CHAT_OPT_ID = '018e1234-0000-7000-8000-000000000005'
const TS = new Date('2026-01-01T00:00:00.000Z')
const CHECKSUM = 'a'.repeat(64)

const makeInsertChain = (returningValue: unknown[]) => {
  const chain: any = {
    returning: vi.fn().mockResolvedValue(returningValue),
    onConflictDoUpdate: vi.fn(),
    then: (resolve: (v: unknown) => void) => resolve(returningValue),
  }
  chain.onConflictDoUpdate.mockReturnValue({
    returning: vi.fn().mockResolvedValue(returningValue),
  })
  return chain
}

function buildInsertMock(
  insertCallCount: { count: number },
  insertedDoc: any,
  vectorStore: any,
  chatAIOptions: any
) {
  return vi.fn().mockImplementation(() => ({
    values: vi.fn().mockImplementation(() => {
      insertCallCount.count++
      if (insertCallCount.count === 1) return makeInsertChain([vectorStore])
      if (insertCallCount.count === 2) return makeInsertChain([insertedDoc])
      if (insertCallCount.count === 3) return makeInsertChain([])
      if (insertCallCount.count === 4) return makeInsertChain([])
      const upsertReturning = vi.fn().mockResolvedValue([chatAIOptions])
      return {
        returning: upsertReturning,
        onConflictDoUpdate: vi.fn().mockReturnValue({ returning: upsertReturning }),
        then: (resolve: (v: unknown) => void) => resolve([chatAIOptions]),
      }
    }),
  }))
}

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

  describe('createRagVectorEntry', () => {
    it('should throw not implemented error', async () => {
      const ragDto = { id: 'test' } as any

      await expect(repository.createRagVectorEntry(ragDto)).rejects.toThrow(
        'createRagVectorEntry is not implemented yet'
      )
    })

    it('should log error before throwing', async () => {
      const ragDto = { id: 'test' } as any

      await expect(repository.createRagVectorEntry(ragDto)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'createRagVectorEntry called before implementation',
        expect.objectContaining({ message: 'createRagVectorEntry is not implemented yet' })
      )
    })

    it('should reject the promise', async () => {
      const ragDto = { id: 'test' } as any

      const result = repository.createRagVectorEntry(ragDto)
      expect(result).toBeInstanceOf(Promise)
      await expect(result).rejects.toThrow()
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

    it('should wrap non-Error rejection in Error before logging', async () => {
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockRejectedValue('string db error'),
      })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getEmbeddingModelById(mockModel.id)).rejects.toBe('string db error')
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      const loggedError = vi.mocked(mockLogger.error).mock.calls[0]![1]
      expect(loggedError).toBeInstanceOf(Error)
      expect((loggedError as Error).message).toBe('string db error')
    })
  })

  describe('createVectorStore', () => {
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

    function setupTransactionMock(mockInsert: any) {
      vi.mocked(db.transaction).mockImplementation(async (callback) =>
        callback({ insert: mockInsert } as any)
      )
    }

    it('should create a vector store and return the result', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(makeCreateVectorStoreData())

      expect(result.vectorStore.id).toBe(VS_ID)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]!.checksum).toBe(CHECKSUM)
      expect(result.chatAIOptions.id).toBe(CHAT_OPT_ID)
    })

    it('should throw when the vector store insert returns no row', async () => {
      const mockReturning = vi.fn().mockResolvedValueOnce([])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      setupTransactionMock(mockInsert)

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Failed to insert vector store record'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should throw when a document checksum is null after insert', async () => {
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
      setupTransactionMock(mockInsert)

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Document checksum is null after insert for: Test Document'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should throw when document insert returns no row', async () => {
      const insertedDoc: any = undefined
      const mockInsert = buildInsertMock({ count: 0 }, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Failed to insert document record for: Test Document'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should handle empty document records', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => {
          insertCallCount.count++
          if (insertCallCount.count === 1) return makeInsertChain([vectorStore])
          if (insertCallCount.count === 2) return makeInsertChain([insertedDoc])
          if (insertCallCount.count === 3) return makeInsertChain([])
          // Embeddings insert is skipped when records.length === 0,
          // so the 4th call is the chatAiOptions upsert.
          const upsertReturning = vi.fn().mockResolvedValue([chatAIOptions])
          return {
            returning: upsertReturning,
            onConflictDoUpdate: vi.fn().mockReturnValue({ returning: upsertReturning }),
            then: (resolve: (v: unknown) => void) => resolve([chatAIOptions]),
          }
        }),
      }))
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({
          documents: [{ ...makeCreateVectorStoreData().documents[0]!, records: [] }],
        })
      )

      expect(result.vectorStore.id).toBe(VS_ID)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]!.checksum).toBe(CHECKSUM)
    })

    it('should insert embeddings into dimension 384 table', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({ dimension: 384 })
      )

      expect(result.documents).toHaveLength(1)
      expect(result.vectorStore.id).toBe(VS_ID)
    })

    it('should insert embeddings into dimension 768 table', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({ dimension: 768 })
      )

      expect(result.documents).toHaveLength(1)
      expect(result.vectorStore.id).toBe(VS_ID)
    })

    it('should insert embeddings into dimension 1024 table', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({ dimension: 1024 })
      )

      expect(result.documents).toHaveLength(1)
      expect(result.vectorStore.id).toBe(VS_ID)
    })

    it('should insert embeddings into dimension 3072 table', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({ dimension: 3072 })
      )

      expect(result.documents).toHaveLength(1)
      expect(result.vectorStore.id).toBe(VS_ID)
    })

    it('should throw when dimension is unsupported', async () => {
      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(insertCallCount, insertedDoc, vectorStore, chatAIOptions)
      setupTransactionMock(mockInsert)

      await expect(
        repository.createVectorStore(makeCreateVectorStoreData({ dimension: 999 as any }))
      ).rejects.toThrow('Unsupported embedding dimension: 999')
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should handle all optional chat AI options as null', async () => {
      const chatAIOptionsAllNull = {
        id: CHAT_OPT_ID,
        prompt: 'You are a helpful assistant',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        stopSequences: null,
        maxRetries: null,
        createdAt: TS,
        updatedAt: TS,
      }

      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(
        insertCallCount,
        insertedDoc,
        vectorStore,
        chatAIOptionsAllNull
      )
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({
          chatAIOptions: {
            chatTypeId: CHAT_TYPE_ID,
            prompt: 'You are a helpful assistant',
            maxTokens: undefined,
            temperature: undefined,
            topP: undefined,
            frequencyPenalty: undefined,
            presencePenalty: undefined,
            stopSequences: undefined,
            maxRetries: undefined,
          },
        })
      )

      expect(result.vectorStore.id).toBe(VS_ID)
      expect(result.chatAIOptions.maxTokens).toBeNull()
      expect(result.chatAIOptions.temperature).toBeNull()
      expect(result.chatAIOptions.topP).toBeNull()
      expect(result.chatAIOptions.frequencyPenalty).toBeNull()
      expect(result.chatAIOptions.presencePenalty).toBeNull()
      expect(result.chatAIOptions.stopSequences).toBeNull()
      expect(result.chatAIOptions.maxRetries).toBeNull()
    })

    it('should handle all optional chat AI options with values', async () => {
      const chatAIOptionsFull = {
        id: CHAT_OPT_ID,
        prompt: 'You are a helpful assistant',
        maxTokens: 2000,
        temperature: '0.5',
        topP: '0.9',
        frequencyPenalty: '0.1',
        presencePenalty: '0.2',
        stopSequences: ['STOP', 'END'],
        maxRetries: 5,
        createdAt: TS,
        updatedAt: TS,
      }

      const insertCallCount = { count: 0 }
      const mockInsert = buildInsertMock(
        insertCallCount,
        insertedDoc,
        vectorStore,
        chatAIOptionsFull
      )
      setupTransactionMock(mockInsert)

      const result = await repository.createVectorStore(
        makeCreateVectorStoreData({
          chatAIOptions: {
            chatTypeId: CHAT_TYPE_ID,
            prompt: 'You are a helpful assistant',
            maxTokens: 2000,
            temperature: 0.5,
            topP: 0.9,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            stopSequences: ['STOP', 'END'],
            maxRetries: 5,
          },
        })
      )

      expect(result.vectorStore.id).toBe(VS_ID)
      expect(result.chatAIOptions.maxTokens).toBe(2000)
      expect(result.chatAIOptions.temperature).toBe('0.5')
      expect(result.chatAIOptions.topP).toBe('0.9')
      expect(result.chatAIOptions.frequencyPenalty).toBe('0.1')
      expect(result.chatAIOptions.presencePenalty).toBe('0.2')
      expect(result.chatAIOptions.stopSequences).toEqual(['STOP', 'END'])
      expect(result.chatAIOptions.maxRetries).toBe(5)
    })

    it('should throw when chat AI options upsert fails', async () => {
      const upsertInsertMock = vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => {
          const upsertReturning = vi.fn().mockResolvedValue([])
          return {
            returning: upsertReturning,
            onConflictDoUpdate: vi.fn().mockReturnValue({ returning: upsertReturning }),
            then: (resolve: (v: unknown) => void) => resolve([]),
          }
        }),
      }))

      const insertCallCount = { count: 0 }
      const baseInsertMock = buildInsertMock(
        insertCallCount,
        insertedDoc,
        vectorStore,
        chatAIOptions
      )
      const mockInsert = vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => {
          insertCallCount.count++
          if (insertCallCount.count <= 4) {
            const chain = makeInsertChain(
              insertCallCount.count === 1
                ? [vectorStore]
                : insertCallCount.count === 2
                  ? [insertedDoc]
                  : []
            )
            return chain
          }
          const upsertReturning = vi.fn().mockResolvedValue([])
          return {
            returning: upsertReturning,
            onConflictDoUpdate: vi.fn().mockReturnValue({ returning: upsertReturning }),
            then: (resolve: (v: unknown) => void) => resolve([]),
          }
        }),
      }))
      setupTransactionMock(mockInsert)

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toThrow(
        'Failed to insert or update chat AI options record'
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

    it('should wrap non-Error rejection in Error before logging', async () => {
      vi.mocked(db.transaction).mockRejectedValue('string error from transaction')

      await expect(repository.createVectorStore(makeCreateVectorStoreData())).rejects.toBe(
        'string error from transaction'
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      const loggedError = vi.mocked(mockLogger.error).mock.calls[0]![1]
      expect(loggedError).toBeInstanceOf(Error)
      expect((loggedError as Error).message).toBe('string error from transaction')
    })
  })
})
