import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRAGRepository } from '../../../../src/adapters/secondary/repositories/ai-rag.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
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
})
