import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIChatOptionsPort } from '../../../src/application/ports/ai-chat-options.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatAiOptionsUseCase } from '../../../src/application/use-cases/get-chat-ai-options.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { ChatId } from '../../../src/domain/value-objects/chatID.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('GetChatAiOptionsUseCase', () => {
  let useCase: GetChatAiOptionsUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiChatOptions: AIChatOptionsPort
  let mockAuditContext: AuditContext

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockAiChatOptions = {
      getChatOptionsByChatTypeId: vi.fn(),
    }

    mockAuditContext = {
      userId: new UserId(uuidv7()).getValue(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new GetChatAiOptionsUseCase(mockLogger, mockAuditLog, mockAiChatOptions)
  })

  describe('execute() - successful scenarios', () => {
    it('should fetch and return chat AI options when found', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const mockPrompt = { prompt: 'You are a helpful AI assistant' }

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockResolvedValue(mockPrompt)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(mockAiChatOptions.getChatOptionsByChatTypeId).toHaveBeenCalledTimes(1)
      expect(mockAiChatOptions.getChatOptionsByChatTypeId).toHaveBeenCalledWith(chatTypeId)
      expect(result).toEqual(mockPrompt)
    })

    it('should return null when chat AI options are not found', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockResolvedValue(null)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(mockAiChatOptions.getChatOptionsByChatTypeId).toHaveBeenCalledWith(chatTypeId)
      expect(result).toBeNull()
    })

    it('should handle empty prompt string', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const mockPrompt = { prompt: '' }

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockResolvedValue(mockPrompt)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(result).toEqual(mockPrompt)
      expect(result?.prompt).toBe('')
    })

    it('should handle long prompt text', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const longPrompt = 'A'.repeat(10000)
      const mockPrompt = { prompt: longPrompt }

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockResolvedValue(mockPrompt)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(result).toEqual(mockPrompt)
      expect(result?.prompt.length).toBe(10000)
    })
  })

  describe('execute() - error handling', () => {
    it('should log error and return null when repository throws error', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const repositoryError = new Error('Database connection failed')

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockRejectedValue(repositoryError)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in GetChatAiOptionsUseCase.execute',
        repositoryError,
        { chatTypeId }
      )
    })

    it('should handle repository throwing non-Error objects', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const nonErrorThrown = 'String error'

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockRejectedValue(nonErrorThrown)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle timeout errors gracefully', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const timeoutError = new Error('Query timeout')

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockRejectedValue(timeoutError)

      const result = await useCase.execute(mockAuditContext, chatTypeId)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in GetChatAiOptionsUseCase.execute',
        timeoutError,
        { chatTypeId }
      )
    })
  })

  describe('execute() - edge cases', () => {
    it('should handle concurrent requests for different chat types', async () => {
      const chatTypeId1 = new ChatId(uuidv7()).getValue()
      const chatTypeId2 = new ChatId(uuidv7()).getValue()
      const mockPrompt1 = { prompt: 'Prompt 1' }
      const mockPrompt2 = { prompt: 'Prompt 2' }

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId)
        .mockResolvedValueOnce(mockPrompt1)
        .mockResolvedValueOnce(mockPrompt2)

      const [result1, result2] = await Promise.all([
        useCase.execute(mockAuditContext, chatTypeId1),
        useCase.execute(mockAuditContext, chatTypeId2),
      ])

      expect(result1).toEqual(mockPrompt1)
      expect(result2).toEqual(mockPrompt2)
      expect(mockAiChatOptions.getChatOptionsByChatTypeId).toHaveBeenCalledTimes(2)
    })

    it('should handle null userId in audit context', async () => {
      const chatTypeId = new ChatId(uuidv7()).getValue()
      const mockPrompt = { prompt: 'Test prompt' }
      const auditContextWithoutUserId = {
        userId: null,
        ipAddress: '192.168.1.100',
        userAgent: 'Test Agent',
      }

      vi.mocked(mockAiChatOptions.getChatOptionsByChatTypeId).mockResolvedValue(mockPrompt)

      const result = await useCase.execute(auditContextWithoutUserId, chatTypeId)

      expect(result).toEqual(mockPrompt)
    })
  })

  describe('constructor', () => {
    it('should create instance with all required dependencies', () => {
      const instance = new GetChatAiOptionsUseCase(mockLogger, mockAuditLog, mockAiChatOptions)
      expect(instance).toBeInstanceOf(GetChatAiOptionsUseCase)
      expect(instance).toBeDefined()
    })
  })
})
