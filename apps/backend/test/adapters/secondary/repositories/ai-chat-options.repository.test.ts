import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIChatOptionsRepository } from '../../../../src/adapters/secondary/repositories/ai-chat-options.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { ChatId } from '../../../../src/domain/value-objects/chatID.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
  },
}))

describe('AIChatOptionsRepository', () => {
  let repository: AIChatOptionsRepository
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

    repository = new AIChatOptionsRepository(mockLogger)
  })

  describe('getChatOptionsByChatOptionsByChatTypeId', () => {
    it('should return prompt when chat AI options are found', async () => {
      const chatTypeId = uuidv7()
      const mockPrompt = 'You are a helpful AI assistant specialized in literary analysis.'

      const mockLimit = vi.fn().mockResolvedValue([{ prompt: mockPrompt }])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())

      expect(result).toEqual({ prompt: mockPrompt })
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching chat AI options by chat type ID', {
        chatTypeId: chatTypeId,
      })
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return null when no options are found', async () => {
      const chatTypeId = uuidv7()

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())

      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching chat AI options by chat type ID', {
        chatTypeId: chatTypeId,
      })
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should log error and throw when database query fails', async () => {
      const chatTypeId = uuidv7()
      const mockError = new Error('Database connection failed')

      const mockLimit = vi.fn().mockRejectedValue(mockError)
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(
        repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())
      ).rejects.toThrow('Database connection failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching chat AI options', mockError, {
        chatTypeId: chatTypeId,
      })
    })

    it('should handle empty prompt string', async () => {
      const chatTypeId = uuidv7()
      const mockPrompt = ''

      const mockLimit = vi.fn().mockResolvedValue([{ prompt: mockPrompt }])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())

      expect(result).toEqual({ prompt: '' })
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching chat AI options by chat type ID', {
        chatTypeId: chatTypeId,
      })
    })

    it('should handle long prompt text', async () => {
      const chatTypeId = uuidv7()
      const mockPrompt = 'A'.repeat(10000) // 10k character prompt

      const mockLimit = vi.fn().mockResolvedValue([{ prompt: mockPrompt }])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())

      expect(result).toEqual({ prompt: mockPrompt })
      expect(result?.prompt.length).toBe(10000)
    })

    it('should use correct query builder chain', async () => {
      const chatTypeId = uuidv7()
      const mockSelect = vi.fn()
      const mockFrom = vi.fn()
      const mockWhere = vi.fn()
      const mockLimit = vi.fn().mockResolvedValue([{ prompt: 'test' }])

      mockSelect.mockReturnValue({ from: mockFrom })
      mockFrom.mockReturnValue({ where: mockWhere })
      mockWhere.mockReturnValue({ limit: mockLimit })

      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await repository.getChatOptionsByChatTypeId(new ChatId(chatTypeId).getValue())

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(mockLimit).toHaveBeenCalledWith(1)
    })
  })

  describe('constructor', () => {
    it('should create instance with logger', () => {
      const instance = new AIChatOptionsRepository(mockLogger)
      expect(instance).toBeInstanceOf(AIChatOptionsRepository)
      expect(instance).toBeDefined()
    })
  })
})
