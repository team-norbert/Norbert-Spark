import type { UIMessage } from 'ai'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIServicePort } from '../../../src/application/ports/ai.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { AppendedChatUseCase } from '../../../src/application/use-cases/append-chat.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('AppendedChatUseCase', () => {
  let useCase: AppendedChatUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIService: AIServicePort
  let testChatId: ChatIdType
  let testUserId: UserIdType
  let auditContext: AuditContext

  const createMockMessages = (count = 2): UIMessage[] =>
    Array.from({ length: count }, (_, i) => ({
      id: uuidv7(),
      role: (i % 2 === 0 ? 'user' : 'assistant') as UIMessage['role'],
      content: `Message ${i + 1}`,
      parts: [],
    }))

  beforeEach(() => {
    vi.clearAllMocks()

    testChatId = new ChatId(uuidv7()).getValue()
    testUserId = new UserId(uuidv7()).getValue()

    auditContext = {
      userId: testUserId,
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent',
    }

    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockAIService = {
      appendToChatMessages: vi.fn().mockResolvedValue(testChatId),
      createChat: vi.fn(),
      getChatResponse: vi.fn(),
      getChatsByUserId: vi.fn(),
      getAIChatByChatId: vi.fn(),
    } as unknown as AIServicePort

    useCase = new AppendedChatUseCase(mockAIService, mockLogger, mockAuditLog)
  })

  // -----------------------------------------------------------------------
  // Successful execution
  // -----------------------------------------------------------------------

  describe('execute() - successful scenarios', () => {
    it('should return an AppendedChatResult with the correct chatId and messages', async () => {
      const messages = createMockMessages(2)

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result).not.toBeNull()
      expect(result?.chatId).toBe(testChatId)
      expect(result?.appendedMessages).toBe(messages)
    })

    it('should call aiService.appendToChatMessages with the correct chatId and messages', async () => {
      const messages = createMockMessages(3)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockAIService.appendToChatMessages).toHaveBeenCalledExactlyOnceWith(
        testChatId,
        messages
      )
    })

    it('should call aiService.appendToChatMessages before returning', async () => {
      const messages = createMockMessages()
      const callOrder: string[] = []

      vi.mocked(mockAIService.appendToChatMessages).mockImplementation(async () => {
        callOrder.push('appendToChatMessages')
        return testChatId
      })

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(callOrder).toContain('appendToChatMessages')
      expect(result).not.toBeNull()
    })

    it('should work with a single message', async () => {
      const messages = createMockMessages(1)

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result?.appendedMessages).toHaveLength(1)
      expect(result?.appendedMessages).toBe(messages)
    })

    it('should work with many messages', async () => {
      const messages = createMockMessages(20)

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result?.appendedMessages).toHaveLength(20)
    })

    it('should work with an empty messages array', async () => {
      const messages: UIMessage[] = []

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result?.chatId).toBe(testChatId)
      expect(result?.appendedMessages).toEqual([])
    })
  })

  // -----------------------------------------------------------------------
  // Invalid chatId guard (mutants 3513, 3514, 3515, 3516)
  // -----------------------------------------------------------------------

  describe('execute() - invalid chatId guard', () => {
    it('should return null when chatId is an empty string', async () => {
      const emptyChatId = '' as ChatIdType

      const result = await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(result).toBeNull()
    })

    it('should NOT call aiService.appendToChatMessages when chatId is falsy', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockAIService.appendToChatMessages).not.toHaveBeenCalled()
    })

    it('should NOT call auditLog.log when chatId is falsy', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    // Mutant 3517 — string literal for the logger message
    it('should log info with the exact message "Invalid chatId value received in AppendedChatUseCase"', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Invalid chatId value received in AppendedChatUseCase',
        expect.anything()
      )
    })

    // Mutant 3518 — ObjectLiteral for the logger second argument
    it('should log info with an object containing event and chatId when chatId is falsy', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(expect.anything(), {
        event: 'chat.append.invalid_id',
        chatId: emptyChatId,
      })
    })

    // Mutant 3519 — string literal for event property
    it('should log info with event "chat.append.invalid_id" when chatId is falsy', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ event: 'chat.append.invalid_id' })
      )
    })

    it('should log chatId value in the invalid id log entry', async () => {
      const emptyChatId = '' as ChatIdType

      await useCase.execute(emptyChatId, createMockMessages(), auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ chatId: emptyChatId })
      )
    })
  })

  // -----------------------------------------------------------------------
  // logger.info 'Appending chat messages' (mutants 3520, 3521, 3522)
  // -----------------------------------------------------------------------

  describe('execute() - logging "Appending chat messages"', () => {
    // Mutant 3522 — string literal for event 'chat.append.attempt'
    it('should log info with event "chat.append.attempt"', async () => {
      const messages = createMockMessages(3)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ event: 'chat.append.attempt' })
      )
    })

    // Mutant 3520 — string literal for the log message itself
    it('should log info with the exact message "Appending chat messages"', async () => {
      const messages = createMockMessages()

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith('Appending chat messages', expect.anything())
    })

    // Mutant 3521 — ObjectLiteral → {} for second argument
    it('should log info with the full context object containing chatId and messageCount', async () => {
      const messages = createMockMessages(4)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith('Appending chat messages', {
        event: 'chat.append.attempt',
        chatId: testChatId,
        messageCount: 4,
      })
    })

    it('should log the correct message count', async () => {
      const messages = createMockMessages(7)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appending chat messages',
        expect.objectContaining({ messageCount: 7 })
      )
    })

    it('should log the correct chatId', async () => {
      const messages = createMockMessages()

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appending chat messages',
        expect.objectContaining({ chatId: testChatId })
      )
    })
  })

  // -----------------------------------------------------------------------
  // logger.debug 'Appended chat' (mutants 3523, 3524, 3525)
  // -----------------------------------------------------------------------

  describe('execute() - logging "Appended chat" (debug)', () => {
    // Mutant 3525 — string literal for event 'chat.appended'
    it('should log debug with event "chat.appended"', async () => {
      const messages = createMockMessages()

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ event: 'chat.appended' })
      )
    })

    // Mutant 3523 — string literal for the debug message itself
    it('should log debug with the exact message "Appended chat"', async () => {
      const messages = createMockMessages()

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.debug).toHaveBeenCalledWith('Appended chat', expect.anything())
    })

    // Mutant 3524 — ObjectLiteral → {} for second argument
    it('should log debug with the full context object containing chatId and messageCount', async () => {
      const messages = createMockMessages(5)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.debug).toHaveBeenCalledWith('Appended chat', {
        event: 'chat.appended',
        chatId: testChatId,
        messageCount: 5,
      })
    })

    it('should log debug with the correct messageCount', async () => {
      const messages = createMockMessages(9)

      await useCase.execute(testChatId, messages, auditContext)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Appended chat',
        expect.objectContaining({ messageCount: 9 })
      )
    })
  })

  // -----------------------------------------------------------------------
  // Audit log entry (mutants 3527, 3528)
  // -----------------------------------------------------------------------

  describe('execute() - audit logging', () => {
    it('should call auditLog.log once', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledOnce()
    })

    it('should call auditLog.log with EntityType.CHAT and AuditAction.UPDATE', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: EntityType.CHAT,
          action: AuditAction.UPDATE,
        })
      )
    })

    it('should call auditLog.log with the correct userId', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ userId: testUserId }))
    })

    it('should call auditLog.log with the correct entityId', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: testChatId })
      )
    })

    // Mutant 3527 — ObjectLiteral → {} for changes field
    // Mutant 3528 — StringLiteral → "" for 'chat_successfully_appended'
    it('should call auditLog.log with changes reason "chat_successfully_appended"', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: { reason: 'chat_successfully_appended' },
        })
      )
    })

    it('should call auditLog.log with ipAddress from auditContext', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: auditContext.ipAddress })
      )
    })

    it('should call auditLog.log with userAgent as string when provided', async () => {
      await useCase.execute(testChatId, createMockMessages(), auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: 'test-user-agent' })
      )
    })

    it('should call auditLog.log with userAgent as undefined when auditContext.userAgent is null', async () => {
      const contextWithoutAgent: AuditContext = { ...auditContext, userAgent: null }

      await useCase.execute(testChatId, createMockMessages(), contextWithoutAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: undefined })
      )
    })

    it('should still return result even if auditLog.log resolves', async () => {
      vi.mocked(mockAuditLog.log).mockResolvedValue(undefined)
      const messages = createMockMessages()

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result).not.toBeNull()
      expect(result?.chatId).toBe(testChatId)
    })
  })

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('execute() - error handling', () => {
    it('should propagate errors thrown by aiService.appendToChatMessages', async () => {
      const error = new Error('Repository failure')
      vi.mocked(mockAIService.appendToChatMessages).mockRejectedValue(error)

      await expect(useCase.execute(testChatId, createMockMessages(), auditContext)).rejects.toThrow(
        'Repository failure'
      )
    })

    it('should not call auditLog.log when aiService throws', async () => {
      vi.mocked(mockAIService.appendToChatMessages).mockRejectedValue(new Error('DB error'))

      await expect(
        useCase.execute(testChatId, createMockMessages(), auditContext)
      ).rejects.toThrow()

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })
  })
})
