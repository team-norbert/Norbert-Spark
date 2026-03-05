import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatResponseResult } from '../../../src/adapters/secondary/repositories/ai.repository.js'
import type { AIServicePort } from '../../../src/application/ports/ai.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatContentByChatIdUseCase } from '../../../src/application/use-cases/get-chat-content-by-chat-id.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import type {
  DBMessageSelect,
  MyDBUIMessagePartSelect,
} from '../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('GetChatContentByChatIdUseCase', () => {
  let useCase: GetChatContentByChatIdUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIService: AIServicePort
  let testChatId: ChatIdType
  let mockChat: {
    id: string
    userId: string
    chatTypeId: string
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
  }
  let auditContext: AuditContext

  beforeEach(() => {
    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockAIService = {
      getChatResponse: vi.fn(),
      getAIChatByChatId: vi.fn(),
    } as unknown as AIServicePort

    testChatId = new ChatId(uuidv7()).getValue()
    mockChat = {
      id: testChatId,
      userId: 'test-user-id',
      chatTypeId: uuidv7(),
      name: 'Test Chat',
      description: 'Test chat description',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    auditContext = {
      userId: new UserId(uuidv7()).getValue(),
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent',
    }

    useCase = new GetChatContentByChatIdUseCase(mockAIService, mockLogger, mockAuditLog)
  })

  describe('Successful scenarios', () => {
    it('should return chat content with single message and part', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result).toEqual(mockResponse)
      expect(result![0]!.message.role).toBe('user')
      expect(result![0]!.part?.textText).toBe('Hello')
      expect(mockAIService.getAIChatByChatId).toHaveBeenCalledWith(testChatId)
    })

    it('should return chat content with multiple messages', async () => {
      const mockMessage1: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockMessage2: DBMessageSelect = {
        id: 'msg-2',
        chatId: testChatId,
        role: 'assistant',
        createdAt: new Date(),
      }

      const mockPart1: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockPart2: MyDBUIMessagePartSelect = {
        id: 'part-2',
        messageId: 'msg-2',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hi there!',
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
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage1, part: mockPart1 },
        { chat: mockChat, message: mockMessage2, part: mockPart2 },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result).toEqual(mockResponse)
      expect(result).toHaveLength(2)
      expect(result![0]!.part?.textText).toBe('Hello')
      expect(result![1]!.part?.textText).toBe('Hi there!')
    })

    it('should return chat content with message having null part', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: null,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result).toEqual(mockResponse)
      expect(result![0]!.part).toBeNull()
    })

    it('should return empty array when no chat found', async () => {
      const mockResponse: ChatResponseResult = []

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle text parts correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Test message',
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
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage, part: mockPart },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result![0]!.part?.type).toBe('text')
      expect(result![0]!.part?.textText).toBe('Test message')
    })

    it('should handle reasoning parts correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'assistant',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'reasoning',
        createdAt: new Date(),
        order: 0,
        textText: null,
        reasoningText: 'Thinking...',
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
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage, part: mockPart },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result![0]!.part?.type).toBe('reasoning')
      expect(result![0]!.part?.reasoningText).toBe('Thinking...')
    })

    it('should handle file parts correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'file',
        createdAt: new Date(),
        order: 0,
        textText: null,
        reasoningText: null,
        fileMediaType: 'application/pdf',
        fileFilename: 'document.pdf',
        fileUrl: 'https://example.com/doc.pdf',
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
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage, part: mockPart },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result![0]!.part?.type).toBe('file')
      expect(result![0]!.part?.fileMediaType).toBe('application/pdf')
      expect(result![0]!.part?.fileFilename).toBe('document.pdf')
    })

    it('should handle tool-call parts correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'assistant',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'tool-call',
        createdAt: new Date(),
        order: 0,
        textText: null,
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
        toolToolCallId: 'call-123',
        toolState: 'call',
        toolErrorText: null,
        toolHeartOfDarknessQAInput: null,
        toolHeartOfDarknessQAOutput: null,
        toolHeartOfDarknessQAErrorText: null,
        dataContent: null,
        providerMetadata: null,
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage, part: mockPart },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result![0]!.part?.type).toBe('tool-call')
      expect(result![0]!.part?.toolToolCallId).toBe('call-123')
    })

    it('should handle tool-result parts correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'tool',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'tool-result',
        createdAt: new Date(),
        order: 0,
        textText: null,
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
        toolToolCallId: 'call-123',
        toolState: 'result',
        toolErrorText: null,
        toolHeartOfDarknessQAInput: null,
        toolHeartOfDarknessQAOutput: null,
        toolHeartOfDarknessQAErrorText: null,
        dataContent: '{"result": "success"}',
        providerMetadata: null,
      }

      const mockResponse: ChatResponseResult = [
        { chat: mockChat, message: mockMessage, part: mockPart },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result![0]!.part?.type).toBe('tool-result')
      expect(result![0]!.part?.toolToolCallId).toBe('call-123')
      expect(result![0]!.part?.dataContent).toBe('{"result": "success"}')
    })
  })

  describe('Error scenarios', () => {
    it('should return null when AI service returns null', async () => {
      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(null)

      const result = await useCase.execute(testChatId, auditContext)

      expect(result).toBeNull()
    })

    it('should throw error when AI service throws error', async () => {
      const error = new Error('Database connection failed')
      vi.mocked(mockAIService.getAIChatByChatId).mockRejectedValue(error)

      await expect(useCase.execute(testChatId, auditContext)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should throw error on network timeout', async () => {
      const error = new Error('ETIMEDOUT')
      vi.mocked(mockAIService.getAIChatByChatId).mockRejectedValue(error)

      await expect(useCase.execute(testChatId, auditContext)).rejects.toThrow('ETIMEDOUT')
    })

    it('should throw error on database errors', async () => {
      const error = new Error('Connection pool exhausted')
      vi.mocked(mockAIService.getAIChatByChatId).mockRejectedValue(error)

      await expect(useCase.execute(testChatId, auditContext)).rejects.toThrow(
        'Connection pool exhausted'
      )
    })
  })

  describe('Audit logging', () => {
    it('should call mockAuditLog.log with correct parameters when successfully retrieving chat content', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: 'chat',
        entityId: testChatId,
        action: 'fetch',
        changes: { reason: 'chat_successfully_retrieved' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
    })

    it('should handle null userAgent by converting to undefined', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      const auditContextWithNullUserAgent = {
        ...auditContext,
        userAgent: null,
      }

      await useCase.execute(testChatId, auditContextWithNullUserAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: undefined,
        })
      )
    })

    it('should include correct entityType in audit log', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'chat',
        })
      )
    })

    it('should include chatId as entityId in audit log', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: testChatId,
        })
      )
    })

    it('should not call audit log when repository fails', async () => {
      vi.mocked(mockAIService.getAIChatByChatId).mockRejectedValue(new Error('Database error'))

      await expect(useCase.execute(testChatId, auditContext)).rejects.toThrow('Database error')
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should include changes with reason in audit log', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: { reason: 'chat_successfully_retrieved' },
        })
      )
    })

    it('should handle custom audit context correctly', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      const customContext: AuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '192.168.1.100',
        userAgent: 'CustomAgent/1.0',
      }

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, customContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: customContext.userId,
        entityType: 'chat',
        entityId: testChatId,
        action: 'fetch',
        changes: { reason: 'chat_successfully_retrieved' },
        ipAddress: customContext.ipAddress,
        userAgent: customContext.userAgent,
      })
    })

    it('should use correct action type in audit log', async () => {
      const mockMessage: DBMessageSelect = {
        id: 'msg-1',
        chatId: testChatId,
        role: 'user',
        createdAt: new Date(),
      }

      const mockPart: MyDBUIMessagePartSelect = {
        id: 'part-1',
        messageId: 'msg-1',
        type: 'text',
        createdAt: new Date(),
        order: 0,
        textText: 'Hello',
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
      }

      const mockResponse: ChatResponseResult = [
        {
          chat: mockChat,
          message: mockMessage,
          part: mockPart,
        },
      ]

      vi.mocked(mockAIService.getAIChatByChatId).mockResolvedValue(mockResponse)

      await useCase.execute(testChatId, auditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'fetch',
        })
      )
    })
  })

  describe('Constructor', () => {
    it('should create instance with valid dependencies', () => {
      const instance = new GetChatContentByChatIdUseCase(mockAIService, mockLogger, mockAuditLog)
      expect(instance).toBeInstanceOf(GetChatContentByChatIdUseCase)
    })
  })
})
