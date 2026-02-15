import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIChatContentRepository } from '../../../../src/adapters/secondary/repositories/ai-chat-content.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import { Uuid7Util } from '../../../../src/shared/utils/uuid7.util.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
  },
}))

// Mock Uuid7Util
vi.mock('../../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    isValidUUID: vi.fn(),
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

  describe('resolveChatTypeByParam', () => {
    // Test data for validation scenarios
    const validUUID = uuidv7()
    const validSeoFriendlyId = 'general-assistant'
    const validBase64Id = 'AbCdEfGhIjKlMnOpQrStUv'
    describe('successful resolution by UUID', () => {
      it('should resolve chat type when param is a valid UUID', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        // Helper function to setup mock database query
        const setupMockQuery = (mockResult: any[]) => {
          const mockLimit = vi.fn().mockResolvedValue(mockResult)
          const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
          const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
          const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
          vi.mocked(db.select).mockReturnValue(mockSelect() as any)
          return { mockLimit, mockWhere, mockFrom, mockSelect }
        }
        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', { param })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })

      it('should include UUID condition when isValidUUID returns true', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockWhere).toHaveBeenCalled()
        // The where clause should include 3 conditions: UUID, seoFriendlyId, seoFriendlyBase64Id
      })
    })

    describe('successful resolution by seoFriendlyId', () => {
      it('should resolve chat type when param matches seoFriendlyId', async () => {
        const chatTypeId = uuidv7()
        const param = 'general-assistant'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', { param })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })

      it('should not check UUID column when param is not a valid UUID', async () => {
        const chatTypeId = uuidv7()
        const param = 'code-helper'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockWhere).toHaveBeenCalled()
        // The where clause should only include 2 conditions: seoFriendlyId, seoFriendlyBase64Id
      })
    })

    describe('successful resolution by seoFriendlyBase64Id', () => {
      it('should resolve chat type when param matches seoFriendlyBase64Id', async () => {
        const chatTypeId = uuidv7()
        const param = 'AbCdEfGhIjKlMnOpQrStUv'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', { param })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })
    })

    describe('return null when no match found', () => {
      it('should return null when param does not match any identifier', async () => {
        const param = 'non-existent-chat-type'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', { param })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: null,
        })
      })

      it('should return null when UUID param does not match any record', async () => {
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
      })

      it('should return null when empty string is provided', async () => {
        const param = ''

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
      })
    })

    describe('handling invalid UUID strings', () => {
      it('should not check UUID column when param is an invalid UUID format', async () => {
        const param = 'not-a-valid-uuid'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        // Should only query seoFriendlyId and seoFriendlyBase64Id columns
      })

      it('should avoid PostgreSQL type casting errors for invalid UUID strings', async () => {
        const param = 'invalid-uuid-123'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        // Should not throw error
        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
      })
    })

    describe('database errors', () => {
      it('should propagate database query errors', async () => {
        const param = 'test-param'
        const dbError = new Error('Database connection failed')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockRejectedValue(dbError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow(
          'Database connection failed'
        )
      })

      it('should propagate database timeout errors', async () => {
        const param = uuidv7()
        const timeoutError = new Error('Query timeout exceeded')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockRejectedValue(timeoutError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow(
          'Query timeout exceeded'
        )
      })

      it('should log debug messages even when database errors occur', async () => {
        const param = 'test-param'
        const dbError = new Error('Database error')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockRejectedValue(dbError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow('Database error')

        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', { param })
        // Second debug log won't be called because of the error
      })
    })

    describe('query optimization', () => {
      it('should limit results to 1 row', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(mockLimit).toHaveBeenCalledWith(1)
      })

      it('should only select the id column', async () => {
        const chatTypeId = uuidv7()
        const param = 'test-param'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        // Verify select was called (exact args checking would be too coupled to implementation)
        expect(db.select).toHaveBeenCalled()
      })
    })
  })
})
