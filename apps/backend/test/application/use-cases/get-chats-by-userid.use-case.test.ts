import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRepository } from '../../../src/adapters/secondary/repositories/ai.repository.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatsByUserIdUseCase } from '../../../src/application/use-cases/get-chats-by-userid.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'

describe('GetChatsByUserIdUseCase', () => {
  let useCase: GetChatsByUserIdUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIRepository: AIRepository
  let testUserId: UserIdType
  let auditContext: AuditContext

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test user ID
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
      getChatsByUserId: vi.fn(),
    } as unknown as AIRepository

    // Create use case instance with mocks
    useCase = new GetChatsByUserIdUseCase(mockAIRepository, mockLogger, mockAuditLog)
  })

  describe('execute() - successful scenarios', () => {
    it('should retrieve chats for a user successfully', async () => {
      const mockChats: ChatIdType[] = [
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
      ]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(3)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 3 chats for user ID: ${testUserId}`)
    })

    it('should return empty array when user has no chats', async () => {
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 0 chats for user ID: ${testUserId}`)
    })

    it('should return single chat when user has one chat', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(1)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 1 chat for user ID: ${testUserId}`)
    })

    it('should handle large number of chats', async () => {
      const mockChats: ChatIdType[] = Array.from({ length: 100 }, () =>
        new ChatId(uuidv7()).getValue()
      )

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(100)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 100 chats for user ID: ${testUserId}`)
    })

    it('should call logger with correct userId', async () => {
      const specificUserId = new UserId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(specificUserId, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${specificUserId}`)
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Retrieved 0 chats for user ID: ${specificUserId}`
      )
    })
  })

  describe('execute() - error scenarios', () => {
    it('should throw InternalErrorException when repository fails', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(repositoryError)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow()
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
    })

    it('should propagate repository errors', async () => {
      const error = new InternalErrorException('Failed to retrieve chats')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow(
        'Failed to retrieve chats'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(networkError)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow('Network timeout')
    })
  })

  describe('execute() - logging behavior', () => {
    it('should log before and after repository call', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockLogger.info).toHaveBeenNthCalledWith(1, `Getting chats for user ID: ${testUserId}`)
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        `Retrieved 1 chat for user ID: ${testUserId}`
      )
    })

    it('should only log initial message when error occurs', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow()

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
    })

    it('should call error logger on repository failure', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error retrieving chats for user',
        error,
        { userId: testUserId }
      )
    })
  })

  describe('execute() - integration with value objects', () => {
    it('should work with different valid user IDs', async () => {
      const userId1 = new UserId(uuidv7()).getValue()
      const userId2 = new UserId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(userId1, auditContext)
      await useCase.execute(userId2, auditContext)

      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(userId1)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(userId2)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledTimes(2)
    })

    it('should return ChatIdType array from repository', async () => {
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = [chatId1, chatId2]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual(mockChats)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      // Type assertion safe here because we just verified it's an array
      expect((result as ChatIdType[])[0]).toBe(chatId1)
      expect((result as ChatIdType[])[1]).toBe(chatId2)
    })
  })

  describe('execute() - audit logging', () => {
    it('should log audit event with correct parameters when chats are retrieved successfully', async () => {
      const mockChats: ChatIdType[] = [
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
      ]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: 'chat',
        entityId: testUserId,
        action: 'fetch',
        changes: {
          reason: 'chat_successfully_retrieved_by_userid',
          chatIds: mockChats,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-user-agent',
      })
    })

    it('should log audit event with empty chatIds when no chats found', async () => {
      const mockChats: ChatIdType[] = []
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            reason: 'chat_successfully_retrieved_by_userid',
            chatIds: [],
          },
        })
      )
    })

    it('should log audit event with null userAgent when not provided', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      const auditContextWithoutAgent = {
        userId: testUserId,
        ipAddress: '192.168.1.1',
        userAgent: null,
      }
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContextWithoutAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          ipAddress: '192.168.1.1',
          userAgent: undefined,
        })
      )
    })

    it('should still return chats successfully even if audit logging fails', async () => {
      const mockChats: ChatIdType[] = [
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
      ]
      const auditError = new Error('Audit service unavailable')
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(testUserId, auditContext)

      expect(result).toEqual(mockChats)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for chat retrieval',
        auditError,
        { userId: auditContext.userId }
      )
    })

    it('should log error when audit log throws exception', async () => {
      const mockChats: ChatIdType[] = []
      const auditError = new Error('Database connection failed')
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      await useCase.execute(testUserId, auditContext)

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for chat retrieval',
        expect.any(Error),
        expect.objectContaining({
          userId: testUserId,
        })
      )
    })

    it('should include correct entityId and entityType in audit log', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      const specificUserId = new UserId(uuidv7()).getValue()
      const specificAuditContext = {
        userId: specificUserId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(specificUserId, specificAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'chat',
          entityId: specificUserId,
          action: 'fetch',
        })
      )
    })

    it('should call audit log with failure details if repository fails', async () => {
      const repositoryError = new Error('Database error')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(repositoryError)

      await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow('Database error')

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: 'chat',
        entityId: testUserId,
        action: 'fetch_failed',
        changes: {
          reason: 'chat_retrieval_failed',
          errorMessage: 'Database error',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-user-agent',
      })
    })

    it('should log audit with correct changes structure', async () => {
      const mockChats: ChatIdType[] = [
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
      ]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            reason: 'chat_successfully_retrieved_by_userid',
            chatIds: mockChats,
          },
        })
      )
    })

    it('should pass complete auditContext to audit log', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      const customAuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '10.0.0.1',
        userAgent: 'Custom-Agent/1.0',
      }
      const customUserId = new UserId(uuidv7()).getValue()
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(customUserId, customAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: customAuditContext.userId,
        entityType: 'chat',
        entityId: customUserId,
        action: 'fetch',
        changes: {
          reason: 'chat_successfully_retrieved_by_userid',
          chatIds: mockChats,
        },
        ipAddress: customAuditContext.ipAddress,
        userAgent: customAuditContext.userAgent,
      })
    })

    it('should include all retrieved chatIds in audit log changes', async () => {
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()
      const chatId3 = new ChatId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = [chatId1, chatId2, chatId3]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            chatIds: [chatId1, chatId2, chatId3],
          }),
        })
      )
    })

    it('should log audit with fetch action for retrieval operation', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'fetch',
        })
      )
    })
  })
})
