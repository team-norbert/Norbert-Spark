import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AIRepository,
  type ChatResponseResult,
} from '../../../src/adapters/secondary/repositories/ai.repository.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatUseCase } from '../../../src/application/use-cases/get-chat.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('GetChatUseCase', () => {
  let useCase: GetChatUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIRepository: AIRepository
  let testChatId: ChatIdType
  let testUserId: UserIdType
  let auditContext: AuditContext

  // Helper function to create mock chat response result
  const createMockChatResponse = (messageCount: number = 2): ChatResponseResult => {
    const chatId = new ChatId(uuidv7()).getValue()
    return Array.from({ length: messageCount }, (_, i) => ({
      chat: {
        id: chatId,
        userId: testUserId,
        chatTypeId: uuidv7(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: {
        id: uuidv7(),
        chatId: chatId,
        role: i % 2 === 0 ? 'user' : 'assistant',
        createdAt: new Date(),
      },
      part: {
        id: uuidv7(),
        messageId: uuidv7(),
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: `Message ${i + 1} content`,
        reasoningText: null,
        fileMediaType: null,
        fileFilename: null,
        fileUrl: null,
        sourceUrlSourceId: null,
        sourceUrlUrl: null,
        sourceUrlTitle: null,
        sourceDocumentSourceId: null,
        sourceDocumentMediaType: null,
        sourceDocumentTitle: null,
        sourceDocumentFilename: null,
        toolToolCallId: null,
        toolState: null,
        toolErrorText: null,
        toolHeartOfDarknessQAInput: null,
        toolHeartOfDarknessQAOutput: null,
        toolHeartOfDarknessQAErrorText: null,
        dataContent: null,
        providerMetadata: null,
      },
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test IDs
    testChatId = new ChatId(uuidv7()).getValue()
    testUserId = new UserId(uuidv7()).getValue()

    // Create audit context
    auditContext = {
      userId: testUserId,
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent',
    }

    // Create mock implementations
    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockAIRepository = {
      getChatResponse: vi.fn(),
    } as unknown as AIRepository

    // Create use case instance with mocks
    useCase = new GetChatUseCase(mockAIRepository, mockLogger, mockAuditLog)
  })

  describe('execute() - successful scenarios', () => {
    it('should retrieve chat data successfully', async () => {
      const mockChatData = createMockChatResponse(3)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      const result = await useCase.execute(testChatId, [], auditContext)

      expect(result).toEqual(mockChatData)
      expect(result).toHaveLength(3)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith('Getting chat', { chatID: testChatId })
      expect(mockLogger.info).toHaveBeenCalledWith('Chat data retrieved successfully', {
        chatID: testChatId,
        messageCount: 3,
      })
    })

    it('should retrieve chat with single message', async () => {
      const mockChatData = createMockChatResponse(1)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      const result = await useCase.execute(testChatId, [], auditContext)

      expect(result).toEqual(mockChatData)
      expect(result).toHaveLength(1)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
      expect(mockLogger.info).toHaveBeenCalledWith('Chat data retrieved successfully', {
        chatID: testChatId,
        messageCount: 1,
      })
    })

    it('should retrieve chat with many messages', async () => {
      const mockChatData = createMockChatResponse(50)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      const result = await useCase.execute(testChatId, [], auditContext)

      expect(result).toEqual(mockChatData)
      expect(result).toHaveLength(50)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
      expect(mockLogger.info).toHaveBeenCalledWith('Chat data retrieved successfully', {
        chatID: testChatId,
        messageCount: 50,
      })
    })

    it('should return null when no chat data found', async () => {
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(null)

      const result = await useCase.execute(testChatId, [], auditContext)

      expect(result).toBeNull()
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
      expect(mockLogger.info).toHaveBeenCalledWith('No chat data found for user', {
        chatID: testChatId,
      })
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should return null when chat data is empty array', async () => {
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue([])

      const result = await useCase.execute(testChatId, [], auditContext)

      expect(result).toBeNull()
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
      expect(mockLogger.info).toHaveBeenCalledWith('No chat data found for user', {
        chatID: testChatId,
      })
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should accept messages parameter', async () => {
      const mockChatData = createMockChatResponse(2)
      const messages = [
        { id: uuidv7(), role: 'user' as const, parts: [{ type: 'text' as const, text: 'Hello' }] },
        {
          id: uuidv7(),
          role: 'assistant' as const,
          parts: [{ type: 'text' as const, text: 'Hi there' }],
        },
      ]

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      const result = await useCase.execute(testChatId, messages, auditContext)

      expect(result).toEqual(mockChatData)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
    })

    it('should call repository with correct chatID', async () => {
      const specificChatId = new ChatId(uuidv7()).getValue()
      const mockChatData = createMockChatResponse(1)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      await useCase.execute(specificChatId, [], auditContext)

      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(specificChatId)
      expect(mockLogger.info).toHaveBeenCalledWith('Getting chat', { chatID: specificChatId })
    })
  })

  describe('execute() - audit logging', () => {
    it('should log audit when chat data is retrieved successfully', async () => {
      const mockChatData = createMockChatResponse(2)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      await useCase.execute(testChatId, [], auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: EntityType.CHAT,
        entityId: testChatId,
        action: AuditAction.FETCH,
        changes: {
          chatIds: mockChatData.map((chat) => chat.chat.id),
          reason: 'chat_successfully_retrieved',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
    })

    it('should not log audit when no chat data found', async () => {
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(null)

      await useCase.execute(testChatId, [], auditContext)

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should not log audit when chat data is empty array', async () => {
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue([])

      await useCase.execute(testChatId, [], auditContext)

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should handle audit context without userAgent', async () => {
      const mockChatData = createMockChatResponse(1)
      const contextWithoutUserAgent: AuditContext = {
        userId: testUserId,
        ipAddress: '127.0.0.1',
        userAgent: null,
      }

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      await useCase.execute(testChatId, [], contextWithoutUserAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: contextWithoutUserAgent.userId,
        entityType: EntityType.CHAT,
        entityId: testChatId,
        action: AuditAction.FETCH,
        changes: {
          chatIds: mockChatData.map((chat) => chat.chat.id),
          reason: 'chat_successfully_retrieved',
        },
        ipAddress: contextWithoutUserAgent.ipAddress,
        userAgent: undefined,
      })
    })

    it('should include correct audit context fields', async () => {
      const mockChatData = createMockChatResponse(1)
      const customContext: AuditContext = {
        userId: testUserId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      await useCase.execute(testChatId, [], customContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: customContext.userId,
        entityType: EntityType.CHAT,
        entityId: testChatId,
        action: AuditAction.FETCH,
        changes: {
          chatIds: mockChatData.map((chat) => chat.chat.id),
          reason: 'chat_successfully_retrieved',
        },
        ipAddress: customContext.ipAddress,
        userAgent: customContext.userAgent,
      })
    })
  })

  describe('execute() - error scenarios', () => {
    it('should throw error when repository fails', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockAIRepository.getChatResponse).mockRejectedValue(repositoryError)

      await expect(useCase.execute(testChatId, [], auditContext)).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
    })

    it('should propagate repository errors', async () => {
      const error = new Error('Query execution failed')
      vi.mocked(mockAIRepository.getChatResponse).mockRejectedValue(error)

      await expect(useCase.execute(testChatId, [], auditContext)).rejects.toThrow(error)
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
    })

    it('should throw error on network timeout', async () => {
      const timeoutError = new Error('Connection timeout')
      vi.mocked(mockAIRepository.getChatResponse).mockRejectedValue(timeoutError)

      await expect(useCase.execute(testChatId, [], auditContext)).rejects.toThrow(
        'Connection timeout'
      )
      expect(mockAIRepository.getChatResponse).toHaveBeenCalledWith(testChatId)
    })
  })

  describe('execute() - logger behavior', () => {
    it('should log correct info messages on successful retrieval', async () => {
      const mockChatData = createMockChatResponse(5)

      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)

      await useCase.execute(testChatId, [], auditContext)

      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Getting chat', { chatID: testChatId })
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Chat data retrieved successfully', {
        chatID: testChatId,
        messageCount: 5,
      })
    })

    it('should log when no data found', async () => {
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(null)

      await useCase.execute(testChatId, [], auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith('No chat data found for user', {
        chatID: testChatId,
      })
    })

    it('should throw if logger fails', async () => {
      const mockChatData = createMockChatResponse(1)
      vi.mocked(mockAIRepository.getChatResponse).mockResolvedValue(mockChatData)
      vi.mocked(mockLogger.info).mockImplementation(() => {
        throw new Error('Logger failed')
      })

      await expect(useCase.execute(testChatId, [], auditContext)).rejects.toThrow('Logger failed')
    })
  })
})
