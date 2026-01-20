import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIChatContentRepository } from '../../../../src/adapters/secondary/repositories/ai-chat-content.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
  },
}))

describe('AIChatContentRepository', () => {
  let repository: AIChatContentRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as LoggerPort

    repository = new AIChatContentRepository(mockLogger)
  })

  describe('fetchChatContent', () => {
    it('should fetch all chat types in descending order by createdAt', async () => {
      const mockChatTypes = [
        {
          id: uuidv7(),
          name: 'General Assistant',
          seoFriendlyId: 'general-assistant',
          seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
          description: 'A general-purpose AI assistant',
          createdAt: new Date('2026-01-20T10:00:00Z'),
          updatedAt: new Date('2026-01-20T10:00:00Z'),
        },
        {
          id: uuidv7(),
          name: 'Code Helper',
          seoFriendlyId: 'code-helper',
          seoFriendlyBase64Id: 'WxYzAbCdEfGhIjKlMnOpQr',
          description: 'Specialized in coding assistance',
          createdAt: new Date('2026-01-19T10:00:00Z'),
          updatedAt: new Date('2026-01-19T10:00:00Z'),
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockChatTypes)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      // Access the private method via reflection for testing
      const result = await (repository as any).fetchChatContent()

      expect(result).toEqual(mockChatTypes)
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalledTimes(1)
      expect(mockOrderBy).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no chat types exist', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await (repository as any).fetchChatContent()

      expect(result).toEqual([])
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed')
      const mockOrderBy = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect((repository as any).fetchChatContent()).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should fetch chat types with all required fields', async () => {
      const chatTypeId = uuidv7()
      const now = new Date()
      const mockChatType = {
        id: chatTypeId,
        name: 'Test Chat Type',
        seoFriendlyId: 'test-chat-type',
        seoFriendlyBase64Id: 'A1B2C3D4E5F6G7H8I9J0Kl',
        description: 'Test description',
        createdAt: now,
        updatedAt: now,
      }

      const mockOrderBy = vi.fn().mockResolvedValue([mockChatType])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await (repository as any).fetchChatContent()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', chatTypeId)
      expect(result[0]).toHaveProperty('name', 'Test Chat Type')
      expect(result[0]).toHaveProperty('seoFriendlyId', 'test-chat-type')
      expect(result[0]).toHaveProperty('seoFriendlyBase64Id', 'A1B2C3D4E5F6G7H8I9J0Kl')
      expect(result[0]).toHaveProperty('description', 'Test description')
      expect(result[0]).toHaveProperty('createdAt', now)
      expect(result[0]).toHaveProperty('updatedAt', now)
    })
  })
})
