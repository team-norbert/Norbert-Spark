import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRepository } from '../../../src/adapters/secondary/repositories/ai.repository.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { SaveChatUseCase } from '../../../src/application/use-cases/save-chat.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'

describe('SaveChatUseCase', () => {
  let useCase: SaveChatUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIRepository: AIRepository
  let testChatId: ChatIdType
  let testChatTypeId: ChatIdType
  let testUserId: UserIdType
  let auditContext: AuditContext

  // Helper function to create mock messages
  const createMockMessages = (count: number = 2) => {
    return Array.from({ length: count }, (_, i) => ({
      id: uuidv7(),
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}`,
      createdAt: new Date(),
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test IDs
    testChatId = new ChatId(uuidv7()).getValue()
    testChatTypeId = new ChatId(uuidv7()).getValue()
    testUserId = new UserId(uuidv7()).getValue()

    // Create audit context
    auditContext = {
      userId: testUserId,
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent',
    }

    // Create mock implementations
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockAIRepository = {
      createChat: vi.fn(),
      getChatResponse: vi.fn(),
    } as unknown as AIRepository

    // Create use case instance with mocks
    useCase = new SaveChatUseCase(mockLogger, mockAIRepository, mockAuditLog)
  })

  describe('execute() - successful scenarios', () => {
    it('should save a chat successfully with messages', async () => {
      const messages = createMockMessages(3)

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )
      expect(mockAIRepository.createChat).toHaveBeenCalledTimes(1)
    })

    it('should save a chat with empty messages array', async () => {
      const messages: any[] = []

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )
    })

    it('should save a chat with single message', async () => {
      const messages = createMockMessages(1)

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )
    })

    it('should save a chat with many messages', async () => {
      const messages = createMockMessages(50)

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )
    })

    it('should return the saved chat ID', async () => {
      const messages = createMockMessages()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(typeof result).toBe('string')
    })

    it('should handle different chat IDs correctly', async () => {
      const messages = createMockMessages()
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()

      vi.mocked(mockAIRepository.createChat)
        .mockResolvedValueOnce(chatId1)
        .mockResolvedValueOnce(chatId2)

      const result1 = await useCase.execute(
        chatId1,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )
      const result2 = await useCase.execute(
        chatId2,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result1).toBe(chatId1)
      expect(result2).toBe(chatId2)
      expect(result1).not.toBe(result2)
    })

    it('should handle different user IDs correctly', async () => {
      const messages = createMockMessages()
      const userId1 = new UserId(uuidv7()).getValue()
      const userId2 = new UserId(uuidv7()).getValue()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, userId1, messages, auditContext)
      await useCase.execute(testChatId, testChatTypeId, userId2, messages, auditContext)

      expect(mockAIRepository.createChat).toHaveBeenNthCalledWith(
        1,
        testChatId,
        testChatTypeId,
        userId1,
        messages
      )
      expect(mockAIRepository.createChat).toHaveBeenNthCalledWith(
        2,
        testChatId,
        testChatTypeId,
        userId2,
        messages
      )
    })
  })

  describe('execute() - logging', () => {
    it('should log info message before saving chat', async () => {
      const messages = createMockMessages(3)

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Saving chat ${testChatId} for user ${testUserId} with ${messages.length} messages.`
      )
    })

    it('should log info message after successfully saving chat', async () => {
      const messages = createMockMessages()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(`Chat saved with ID: ${testChatId}`)
    })

    it('should log correct message count', async () => {
      const messages = createMockMessages(10)

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('with 10 messages'))
    })

    it('should log correct chat ID and user ID', async () => {
      const messages = createMockMessages()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`chat ${testChatId}`))
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`user ${testUserId}`))
    })

    it('should log twice - before and after save', async () => {
      const messages = createMockMessages()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledTimes(3) // Before save, messages log, after save
    })

    it('should log with empty messages array', async () => {
      const messages: any[] = []

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('with 0 messages'))
    })
  })

  describe('execute() - error handling', () => {
    it('should throw error when repository fails', async () => {
      const messages = createMockMessages()
      const error = new Error('Database connection failed')

      vi.mocked(mockAIRepository.createChat).mockRejectedValue(error)

      await expect(
        useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)
      ).rejects.toThrow('Database connection failed')
    })

    it('should throw InternalErrorException when repository throws generic error', async () => {
      const messages = createMockMessages()
      const error = new InternalErrorException('Failed to save chat')

      vi.mocked(mockAIRepository.createChat).mockRejectedValue(error)

      await expect(
        useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)
      ).rejects.toThrow(InternalErrorException)
    })

    it('should propagate repository errors to caller', async () => {
      const messages = createMockMessages()
      const customError = new Error('Custom repository error')

      vi.mocked(mockAIRepository.createChat).mockRejectedValue(customError)

      await expect(
        useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)
      ).rejects.toThrow('Custom repository error')
    })

    it('should not log success message when repository fails', async () => {
      const messages = createMockMessages()
      const error = new Error('Repository error')

      vi.mocked(mockAIRepository.createChat).mockRejectedValue(error)

      try {
        await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)
      } catch {
        // Expected to throw
      }

      expect(mockLogger.info).toHaveBeenCalledTimes(2) // Initial log and messages log only
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Chat saved with ID:')
      )
    })

    it('should handle repository returning null or undefined', async () => {
      const messages = createMockMessages()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(null as any)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBeNull()
    })

    it('should handle concurrent save operations', async () => {
      const messages1 = createMockMessages()
      const messages2 = createMockMessages()
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()

      vi.mocked(mockAIRepository.createChat)
        .mockResolvedValueOnce(chatId1)
        .mockResolvedValueOnce(chatId2)

      const [result1, result2] = await Promise.all([
        useCase.execute(chatId1, testChatTypeId, testUserId, messages1, auditContext),
        useCase.execute(chatId2, testChatTypeId, testUserId, messages2, auditContext),
      ])

      expect(result1).toBe(chatId1)
      expect(result2).toBe(chatId2)
      expect(mockAIRepository.createChat).toHaveBeenCalledTimes(2)
    })
  })

  describe('execute() - message validation', () => {
    it('should accept messages with various structures', async () => {
      const messages = [
        { id: uuidv7(), role: 'user', content: 'Hello' },
        { id: uuidv7(), role: 'assistant', content: 'Hi there' },
        { id: uuidv7(), role: 'system', content: 'System message' },
      ]
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(expectedChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )
    })

    it('should pass messages array as-is to repository', async () => {
      const messages = createMockMessages(5)
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      const callArgs = vi.mocked(mockAIRepository.createChat).mock.calls[0]
      expect(callArgs?.[3]).toBe(messages) // Same reference
    })

    it('should handle messages with additional properties', async () => {
      const messages = [
        {
          id: uuidv7(),
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
          metadata: { source: 'web' },
        },
      ]
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(expectedChatId)
    })
  })

  describe('execute() - integration scenarios', () => {
    it('should complete full save flow successfully', async () => {
      const messages = createMockMessages(3)
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      // Execute
      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      // Verify repository was called
      expect(mockAIRepository.createChat).toHaveBeenCalledWith(
        testChatId,
        testChatTypeId,
        testUserId,
        messages
      )

      // Verify result
      expect(result).toBe(expectedChatId)

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledTimes(3) // Before save, messages log, after save
    })

    it('should handle rapid sequential saves', async () => {
      const messages = createMockMessages()
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      const results = []
      for (let i = 0; i < 5; i++) {
        const chatId = new ChatId(uuidv7()).getValue()
        results.push(
          await useCase.execute(chatId, testChatTypeId, testUserId, messages, auditContext)
        )
      }

      expect(results).toHaveLength(5)
      expect(mockAIRepository.createChat).toHaveBeenCalledTimes(5)
    })

    it('should maintain state independence between calls', async () => {
      const messages1 = createMockMessages(2)
      const messages2 = createMockMessages(3)
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()

      vi.mocked(mockAIRepository.createChat)
        .mockResolvedValueOnce(chatId1)
        .mockResolvedValueOnce(chatId2)

      await useCase.execute(chatId1, testChatTypeId, testUserId, messages1, auditContext)
      await useCase.execute(chatId2, testChatTypeId, testUserId, messages2, auditContext)

      // Verify each call was independent
      expect(mockAIRepository.createChat).toHaveBeenNthCalledWith(
        1,
        chatId1,
        testChatTypeId,
        testUserId,
        messages1
      )
      expect(mockAIRepository.createChat).toHaveBeenNthCalledWith(
        2,
        chatId2,
        testChatTypeId,
        testUserId,
        messages2
      )
    })
  })

  describe('execute() - edge cases', () => {
    it('should handle very long message arrays', async () => {
      const messages = createMockMessages(1000)
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(expectedChatId)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('with 1000 messages'))
    })

    it('should handle messages with complex nested structures', async () => {
      const messages = [
        {
          id: uuidv7(),
          role: 'user',
          content: {
            type: 'text',
            data: { text: 'Hello', metadata: { lang: 'en' } },
          },
        },
      ]
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(expectedChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(expectedChatId)
    })

    it('should handle repository returning different ID than input', async () => {
      const messages = createMockMessages()
      const differentChatId = uuidv7()

      vi.mocked(mockAIRepository.createChat).mockResolvedValue(differentChatId)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(differentChatId)
      expect(result).not.toBe(testChatId)
    })

    it('should handle slow repository responses', async () => {
      const messages = createMockMessages()
      const expectedChatId = testChatId

      vi.mocked(mockAIRepository.createChat).mockImplementation(
        () =>
          new Promise((resolve) => {
            global.setTimeout(() => resolve(testChatId), 100)
          })
      )

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(expectedChatId)
    })
  })

  describe('execute() - audit logging', () => {
    it('should log audit event with correct parameters when chat is saved successfully', async () => {
      const messages = createMockMessages(2)
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: 'chat',
        entityId: testChatId,
        action: 'create',
        changes: { reason: 'chat_successfully_saved' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-user-agent',
      })
    })

    it('should log audit event with null userAgent when not provided', async () => {
      const messages = createMockMessages()
      const auditContextWithoutAgent = {
        userId: testUserId,
        ipAddress: '192.168.1.1',
        userAgent: null,
      }
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContextWithoutAgent
      )

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          ipAddress: '192.168.1.1',
          userAgent: undefined,
        })
      )
    })

    it('should still save chat successfully even if audit logging fails', async () => {
      const messages = createMockMessages()
      const auditError = new Error('Audit service unavailable')
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(
        testChatId,
        testChatTypeId,
        testUserId,
        messages,
        auditContext
      )

      expect(result).toBe(testChatId)
      expect(mockAIRepository.createChat).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for creating chat',
        auditError,
        { userId: auditContext.userId }
      )
    })

    it('should log error when audit log throws exception', async () => {
      const messages = createMockMessages()
      const auditError = new Error('Database connection failed')
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for creating chat',
        expect.any(Error),
        expect.objectContaining({
          userId: testUserId,
        })
      )
    })

    it('should include correct entityId and entityType in audit log', async () => {
      const messages = createMockMessages()
      const specificChatId = new ChatId(uuidv7()).getValue()
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(specificChatId)

      await useCase.execute(specificChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'chat',
          entityId: specificChatId,
          action: 'create',
        })
      )
    })

    it('should not call audit log if repository fails', async () => {
      const messages = createMockMessages()
      const repositoryError = new Error('Database error')
      vi.mocked(mockAIRepository.createChat).mockRejectedValue(repositoryError)

      await expect(
        useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)
      ).rejects.toThrow('Database error')

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should log audit with correct changes reason', async () => {
      const messages = createMockMessages()
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: { reason: 'chat_successfully_saved' },
        })
      )
    })

    it('should pass complete auditContext to audit log', async () => {
      const messages = createMockMessages()
      const customAuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '10.0.0.1',
        userAgent: 'Custom-Agent/1.0',
      }
      vi.mocked(mockAIRepository.createChat).mockResolvedValue(testChatId)

      await useCase.execute(testChatId, testChatTypeId, testUserId, messages, customAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: customAuditContext.userId,
        entityType: 'chat',
        entityId: testChatId,
        action: 'create',
        changes: { reason: 'chat_successfully_saved' },
        ipAddress: customAuditContext.ipAddress,
        userAgent: customAuditContext.userAgent,
      })
    })
  })
})
