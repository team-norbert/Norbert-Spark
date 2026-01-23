import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PutAIAdminDTO } from '../../../src/application/dtos/put-ai-admin.dto.js'
import type { AIAdminPort } from '../../../src/application/ports/ai-admin.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { PutAIAdminUseCase } from '../../../src/application/use-cases/put-ai-admin.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { Uuid } from '../../../src/domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../../src/infrastructure/database/schema.js'

describe('PutAIAdminUseCase', () => {
  let useCase: PutAIAdminUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiAdminPort: AIAdminPort
  let mockAuditContext: AuditContext

  beforeEach(() => {
    vi.clearAllMocks()

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

    mockAiAdminPort = {
      getAllChatAIOptions: vi.fn(),
      putChatAIOptions: vi.fn(),
    }

    const testUserId = uuidv7()
    mockAuditContext = {
      userId: new UserId(testUserId).getValue(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new PutAIAdminUseCase(mockLogger, mockAuditLog, mockAiAdminPort)
  })

  describe('execute() - successful scenarios', () => {
    it('should update chat AI options with all fields and log audit', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO(
        'You are a helpful assistant',
        0.7,
        0.9,
        0.5,
        -0.5,
        40,
        ['STOP', 'END'],
        12345,
        3
      )

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'You are a helpful assistant',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.5',
        presencePenalty: '-0.5',
        topK: 40,
        stopSequences: ['STOP', 'END'],
        seed: 12345,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Executing PutAIAdminUseCase for ID: ${chatTypeId}`
      )
      expect(mockAiAdminPort.putChatAIOptions).toHaveBeenCalledTimes(1)
      expect(mockAiAdminPort.putChatAIOptions).toHaveBeenCalledWith(
        chatTypeId,
        dto,
        mockAuditContext
      )
      expect(result).toEqual(mockUpdatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'chat_ai_options_updated',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should update chat AI options with only required field', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Updated prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Updated prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAiAdminPort.putChatAIOptions).toHaveBeenCalledWith(
        chatTypeId,
        dto,
        mockAuditContext
      )
      expect(result).toEqual(mockUpdatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should return null when no record is found to update', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(null)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAiAdminPort.putChatAIOptions).toHaveBeenCalledWith(
        chatTypeId,
        dto,
        mockAuditContext
      )
      expect(result).toBeNull()
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should update with boundary values', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO(
        'Test',
        2, // Max temperature
        1, // Max topP
        2, // Max frequencyPenalty
        -2, // Min presencePenalty
        100, // Max topK
        [],
        2147483647, // Max seed
        10 // Max maxRetries
      )

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 2000,
        temperature: '2',
        topP: '1',
        frequencyPenalty: '2',
        presencePenalty: '-2',
        topK: 100,
        stopSequences: [],
        seed: 2147483647,
        maxRetries: 10,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(result).toEqual(mockUpdatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should handle audit context with null userAgent', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')
      const auditContextNoAgent: AuditContext = {
        ...mockAuditContext,
        userAgent: null,
      }

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      const result = await useCase.execute(chatTypeId, dto, auditContextNoAgent)

      expect(result).toEqual(mockUpdatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContextNoAgent.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'chat_ai_options_updated',
        },
        ipAddress: auditContextNoAgent.ipAddress,
        userAgent: undefined,
      })
    })

    it('should handle unauthenticated user with null userId', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')
      const unauthenticatedContext: AuditContext = {
        userId: null,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      }

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      const result = await useCase.execute(chatTypeId, dto, unauthenticatedContext)

      expect(result).toEqual(mockUpdatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
        })
      )
    })
  })

  describe('execute() - error scenarios', () => {
    it('should propagate error when putChatAIOptions fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')
      const dbError = new Error('Database connection failed')

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockRejectedValue(dbError)

      await expect(useCase.execute(chatTypeId, dto, mockAuditContext)).rejects.toThrow(
        'Database connection failed'
      )

      expect(mockAiAdminPort.putChatAIOptions).toHaveBeenCalledWith(
        chatTypeId,
        dto,
        mockAuditContext
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Executing PutAIAdminUseCase for ID: ${chatTypeId}`
      )
      // Audit log should not be called if the repository throws
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should continue execution when audit log fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')
      const auditError = new Error('Audit log service unavailable')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(result).toEqual(mockUpdatedOptions)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for chat admin retrieval',
        auditError,
        { userId: mockAuditContext.userId }
      )
    })

    it('should log error with correct context when audit log fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')
      const auditError = new Error('Network timeout')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for chat admin retrieval',
        auditError,
        { userId: mockAuditContext.userId }
      )
    })
  })

  describe('execute() - audit logging', () => {
    it('should log audit with correct entity type and action', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: 'ai_options',
        entityId: chatTypeId,
        action: 'update',
        changes: {
          reason: 'chat_ai_options_updated',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should use correct entityId from input parameter', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      const auditLogCall = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditLogCall?.entityId).toBe(chatTypeId)
    })

    it('should include all audit context fields in log', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      const auditLogCall = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditLogCall).toMatchObject({
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })
  })

  describe('execute() - logging behavior', () => {
    it('should log execution start with correct message', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Executing PutAIAdminUseCase for ID: ${chatTypeId}`
      )
    })

    it('should not log error when audit succeeds', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutAIAdminDTO('Test prompt')

      const mockUpdatedOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: null,
        seed: null,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.putChatAIOptions).mockResolvedValue(mockUpdatedOptions)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
