import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIAdminPort } from '../../../src/application/ports/ai-admin.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetAIAdminUseCase } from '../../../src/application/use-cases/get-ai-admin.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { Uuid } from '../../../src/domain/value-objects/uuid.js'
import type { DBChatAiOptions } from '../../../src/infrastructure/database/schema.js'

describe('GetAIAdminUseCase', () => {
  let useCase: GetAIAdminUseCase
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
    }

    mockAuditContext = {
      userId: new Uuid(uuidv7()).getValue() as any,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new GetAIAdminUseCase(mockLogger, mockAuditLog, mockAiAdminPort)
  })

  describe('execute() - successful scenarios', () => {
    it('should fetch and return chat AI options when found', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'You are a helpful AI assistant',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: ['STOP', 'END'],
        seed: 12345,
        maxRetries: 3,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(mockAiAdminPort.getAllChatAIOptions).toHaveBeenCalledTimes(1)
      expect(mockAiAdminPort.getAllChatAIOptions).toHaveBeenCalledWith(chatTypeId)
      expect(mockLogger.info).toHaveBeenCalledWith('Executing GetAirAdminUseCase')
      expect(result).toEqual(mockOptions)
    })

    it('should return null when chat AI options are not found', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(null)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(mockAiAdminPort.getAllChatAIOptions).toHaveBeenCalledWith(chatTypeId)
      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Executing GetAirAdminUseCase')
    })

    it('should handle options with null values for optional fields', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'You are a helpful AI assistant',
        maxTokens: null,
        temperature: '0.5',
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(result).toEqual(mockOptions)
      expect(result?.maxTokens).toBeNull()
      expect(result?.topP).toBeNull()
    })

    it('should handle options with empty stop sequences array', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'You are a helpful AI assistant',
        maxTokens: 1500,
        temperature: '0.8',
        topP: '0.95',
        frequencyPenalty: '0.1',
        presencePenalty: '0.2',
        topK: 50,
        stopSequences: [],
        seed: 54321,
        maxRetries: 5,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(result?.stopSequences).toEqual([])
    })
  })

  describe('audit logging', () => {
    it('should log successful fetch to audit log with correct parameters', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: '0.6',
        topP: '0.8',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 30,
        stopSequences: null,
        seed: null,
        maxRetries: 2,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      await useCase.execute(chatTypeId, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_db_chat_options_retrieved',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should log audit even when no options are found', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(null)

      await useCase.execute(chatTypeId, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_db_chat_options_retrieved',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should handle undefined userAgent in audit context', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: '0.6',
        topP: '0.8',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 30,
        stopSequences: null,
        seed: null,
        maxRetries: 2,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      const auditContextWithoutUserAgent: AuditContext = {
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: null,
      }

      await useCase.execute(chatTypeId, auditContextWithoutUserAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContextWithoutUserAgent.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_db_chat_options_retrieved',
        },
        ipAddress: auditContextWithoutUserAgent.ipAddress,
        userAgent: undefined,
      })
    })

    it('should catch and log audit log errors without throwing', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: '0.6',
        topP: '0.8',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 30,
        stopSequences: null,
        seed: null,
        maxRetries: 2,
      }

      const auditError = new Error('Audit log database connection failed')
      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(result).toEqual(mockOptions)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for chat admin retrieval',
        auditError,
        { userId: mockAuditContext.userId }
      )
    })

    it('should still return result even if audit logging fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: '0.6',
        topP: '0.8',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 30,
        stopSequences: null,
        seed: null,
        maxRetries: 2,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)
      vi.mocked(mockAuditLog.log).mockRejectedValue(new Error('Audit failed'))

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(result).toEqual(mockOptions)
    })
  })

  describe('error handling', () => {
    it('should propagate errors from AI admin port', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dbError = new Error('Database connection failed')

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockRejectedValue(dbError)

      await expect(useCase.execute(chatTypeId, mockAuditContext)).rejects.toThrow(
        'Database connection failed'
      )

      expect(mockLogger.info).toHaveBeenCalledWith('Executing GetAirAdminUseCase')
    })

    it('should not attempt audit logging if port throws error', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dbError = new Error('Query timeout')

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockRejectedValue(dbError)

      await expect(useCase.execute(chatTypeId, mockAuditContext)).rejects.toThrow('Query timeout')

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })
  })

  describe('data type preservation', () => {
    it('should preserve numeric values as strings', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const mockOptions: DBChatAiOptions = {
        id: new Uuid(uuidv7()).getValue(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: '0.123456789',
        topP: '0.987654321',
        frequencyPenalty: '0.555555',
        presencePenalty: '0.666666',
        topK: 100,
        stopSequences: null,
        seed: null,
        maxRetries: 10,
      }

      vi.mocked(mockAiAdminPort.getAllChatAIOptions).mockResolvedValue(mockOptions)

      const result = await useCase.execute(chatTypeId, mockAuditContext)

      expect(result?.temperature).toBe('0.123456789')
      expect(result?.topP).toBe('0.987654321')
      expect(result?.frequencyPenalty).toBe('0.555555')
      expect(result?.presencePenalty).toBe('0.666666')
    })
  })
})
