import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAdminRepository } from '../../../../src/adapters/secondary/repositories/ai-admin.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { Uuid } from '../../../../src/domain/value-objects/uuid.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))

describe('AIAdminRepository', () => {
  let repository: AIAdminRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    repository = new AIAdminRepository(mockLogger)
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

  describe('putChatAIOptions', () => {
    it('should update chat AI options with all fields and return updated record', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Updated prompt',
        maxTokens: 4000,
        temperature: 1.5,
        topP: 0.8,
        frequencyPenalty: -0.5,
        presencePenalty: 0.5,
        topK: 50,
        stopSequences: ['STOP', 'END'],
        seed: 12345,
        maxRetries: 5,
      }

      const mockUpdatedOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Updated prompt',
        maxTokens: 4000,
        temperature: '1.5',
        topP: '0.8',
        frequencyPenalty: '-0.5',
        presencePenalty: '0.5',
        topK: 50,
        stopSequences: ['STOP', 'END'],
        seed: 12345,
        maxRetries: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedOptions])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toEqual(mockUpdatedOptions)
      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Updated prompt',
          maxTokens: 4000,
          temperature: '1.5',
          topP: '0.8',
          frequencyPenalty: '-0.5',
          presencePenalty: '0.5',
          topK: 50,
          stopSequences: ['STOP', 'END'],
          seed: 12345,
          maxRetries: 5,
          updatedAt: expect.any(Date),
        })
      )
      expect(mockWhere).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Updating chat AI options', { chatTypeId })
      expect(mockLogger.info).toHaveBeenCalledWith('Chat AI options updated successfully', {
        chatTypeId,
      })
    })

    it('should update with only prompt (required field) and skip undefined optional fields', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Only prompt updated',
        // All optional fields undefined
      }

      const mockUpdatedOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Only prompt updated',
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

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedOptions])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toEqual(mockUpdatedOptions)
      expect(mockSet).toHaveBeenCalledWith({
        prompt: 'Only prompt updated',
        updatedAt: expect.any(Date),
      })
      // Verify no optional fields were included
      const setCallArg = mockSet.mock.calls[0]?.[0]
      expect(setCallArg).not.toHaveProperty('maxTokens')
      expect(setCallArg).not.toHaveProperty('temperature')
      expect(setCallArg).not.toHaveProperty('topP')
      expect(setCallArg).not.toHaveProperty('frequencyPenalty')
      expect(setCallArg).not.toHaveProperty('presencePenalty')
      expect(setCallArg).not.toHaveProperty('topK')
      expect(setCallArg).not.toHaveProperty('stopSequences')
      expect(setCallArg).not.toHaveProperty('seed')
      expect(setCallArg).not.toHaveProperty('maxRetries')
    })

    it('should convert numeric fields to strings for database storage', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
        temperature: 0.123456,
        topP: 0.987654,
        frequencyPenalty: -1.5,
        presencePenalty: 1.75,
      }

      const mockUpdatedOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 1000,
        temperature: '0.123456',
        topP: '0.987654',
        frequencyPenalty: '-1.5',
        presencePenalty: '1.75',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedOptions])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toEqual(mockUpdatedOptions)
      // Verify numeric values were converted to strings
      const setCallArg = mockSet.mock.calls[0]?.[0]
      expect(setCallArg?.temperature).toBe('0.123456')
      expect(setCallArg?.topP).toBe('0.987654')
      expect(setCallArg?.frequencyPenalty).toBe('-1.5')
      expect(setCallArg?.presencePenalty).toBe('1.75')
      expect(typeof setCallArg?.temperature).toBe('string')
      expect(typeof setCallArg?.topP).toBe('string')
      expect(typeof setCallArg?.frequencyPenalty).toBe('string')
      expect(typeof setCallArg?.presencePenalty).toBe('string')
    })

    it('should keep integer fields as numbers (maxTokens, topK, seed, maxRetries)', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
        maxTokens: 5000,
        topK: 75,
        seed: 99999,
        maxRetries: 8,
      }

      const mockUpdatedOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 5000,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: 75,
        stopSequences: null,
        seed: 99999,
        maxRetries: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedOptions])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toEqual(mockUpdatedOptions)
      // Verify integer fields remain as numbers
      const setCallArg = mockSet.mock.calls[0]?.[0]
      expect(setCallArg?.maxTokens).toBe(5000)
      expect(setCallArg?.topK).toBe(75)
      expect(setCallArg?.seed).toBe(99999)
      expect(setCallArg?.maxRetries).toBe(8)
      expect(typeof setCallArg?.maxTokens).toBe('number')
      expect(typeof setCallArg?.topK).toBe('number')
      expect(typeof setCallArg?.seed).toBe('number')
      expect(typeof setCallArg?.maxRetries).toBe('number')
    })

    it('should return null when no chat AI options found to update', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
      }

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith('No chat AI options found to update', {
        chatTypeId,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Updating chat AI options', { chatTypeId })
      expect(mockLogger.info).not.toHaveBeenCalledWith('Chat AI options updated successfully', {
        chatTypeId,
      })
    })

    it('should handle stopSequences array correctly', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
        stopSequences: ['STOP', 'END', 'DONE'],
      }

      const mockUpdatedOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 1000,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: ['STOP', 'END', 'DONE'],
        seed: null,
        maxRetries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedOptions])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const result = await repository.putChatAIOptions(
        new Uuid(chatTypeId).getValue(),
        mockDto as any
      )

      expect(result).toEqual(mockUpdatedOptions)
      const setCallArg = mockSet.mock.calls[0]?.[0]
      expect(setCallArg?.stopSequences).toEqual(['STOP', 'END', 'DONE'])
      expect(Array.isArray(setCallArg?.stopSequences)).toBe(true)
    })

    it('should handle database errors and log audit event', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
      }

      const mockError = new Error('Database connection failed')

      const mockReturning = vi.fn().mockRejectedValue(mockError)
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(
        repository.putChatAIOptions(
          new Uuid(chatTypeId).getValue(),
          mockDto as any
        )
      ).rejects.toThrow('Database connection failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating chat AI options', mockError, {
        chatTypeId,
      })
    })

    it('should handle database errors and log them', async () => {
      const chatTypeId = uuidv7()
      const mockDto = {
        prompt: 'Test',
      }

      const mockDatabaseError = new Error('Database connection failed')

      const mockReturning = vi.fn().mockRejectedValue(mockDatabaseError)
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(
        repository.putChatAIOptions(
          new Uuid(chatTypeId).getValue(),
          mockDto as any
        )
      ).rejects.toThrow('Database connection failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating chat AI options',
        mockDatabaseError,
        { chatTypeId }
      )
    })
  })
})
