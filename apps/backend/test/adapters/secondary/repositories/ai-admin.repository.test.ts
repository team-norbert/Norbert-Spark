import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAdminRepository } from '../../../../src/adapters/secondary/repositories/ai-admin.repository.js'
import type { AuditLogPort } from '../../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { Uuid } from '../../../../src/domain/value-objects/uuid.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
  },
}))

describe('AIAdminRepository', () => {
  let repository: AIAdminRepository
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create mock audit log
    mockAuditLog = {
      log: vi.fn(),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    repository = new AIAdminRepository(mockLogger, mockAuditLog)
  })

  describe('getAllChatAIOptions', () => {
    it('should return chat AI options when found', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'You are a helpful assistant',
        maxTokens: 1000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: ['END', 'STOP'],
        seed: 12345,
        maxRetries: 3,
        createdAt: new Date('2026-01-21T10:00:00Z'),
        updatedAt: new Date('2026-01-21T10:00:00Z'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockOptions])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result).toEqual(mockOptions)
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return null when no options found', async () => {
      const chatTypeId = uuidv7()

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result).toBeNull()
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return options with null values for optional fields', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Basic prompt',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockOptions])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result).toEqual(mockOptions)
      expect(result?.maxTokens).toBeNull()
      expect(result?.temperature).toBeNull()
      expect(result?.topP).toBeNull()
      expect(result?.topK).toBeNull()
    })

    it('should handle database errors and log them', async () => {
      const chatTypeId = uuidv7()
      const dbError = new Error('Database connection failed')

      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())).rejects.toThrow(
        'Database connection failed'
      )

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching chat AI options', dbError, {
        id: chatTypeId,
      })
    })

    it('should handle query errors and rethrow them', async () => {
      const chatTypeId = uuidv7()
      const queryError = new Error('Invalid query')

      const mockLimit = vi.fn().mockRejectedValue(queryError)
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())).rejects.toThrow(
        'Invalid query'
      )
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should use eq operator with correct chatTypeId', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 100,
        temperature: '0.5',
        topP: '1.0',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockOptions])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(mockWhere).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should return first result when multiple results exist', async () => {
      const chatTypeId = uuidv7()
      const mockOptions1 = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'First option',
        maxTokens: 1000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOptions2 = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Second option',
        maxTokens: 500,
        temperature: '0.5',
        topP: '1.0',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock returns array with multiple items, but we should get first one
      const mockLimit = vi.fn().mockResolvedValue([mockOptions1, mockOptions2])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result).toEqual(mockOptions1)
      expect(result?.prompt).toBe('First option')
    })

    it('should handle empty stop sequences array', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: '0.5',
        topP: '1.0',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: null,
        stopSequences: [],
        seed: null,
        maxRetries: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockOptions])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result?.stopSequences).toEqual([])
    })

    it('should preserve numeric string values for temperature fields', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 100,
        temperature: '0.123456',
        topP: '0.987654',
        frequencyPenalty: '-1.5',
        presencePenalty: '1.75',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockOptions])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getAllChatAIOptions(new Uuid(chatTypeId).getValue())

      expect(result?.temperature).toBe('0.123456')
      expect(result?.topP).toBe('0.987654')
      expect(result?.frequencyPenalty).toBe('-1.5')
      expect(result?.presencePenalty).toBe('1.75')
    })
  })
})
