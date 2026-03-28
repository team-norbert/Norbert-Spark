import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PostAIAdminDTO } from '../../../src/application/dtos/post-ai-admin.dto.js'
import type { AIAdminPort } from '../../../src/application/ports/ai-admin.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { PostAIAdminUseCase } from '../../../src/application/use-cases/post-ai-admin.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { Uuid } from '../../../src/domain/value-objects/uuid.js'
import type { DBChatAiOptionsSelect } from '../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

const createPersistedChatAiOptions = (
  overrides: Partial<DBChatAiOptionsSelect> = {}
): DBChatAiOptionsSelect => ({
  id: new Uuid(uuidv7()).getValue(),
  chatTypeId: new Uuid(uuidv7()).getValue(),
  prompt: 'Test prompt',
  maxTokens: null,
  temperature: null,
  topP: null,
  frequencyPenalty: null,
  presencePenalty: null,
  topK: null,
  stopSequences: null,
  maxRetries: null,
  createdAt: new Date('2026-01-21T10:00:00Z'),
  updatedAt: new Date('2026-01-21T10:00:00Z'),
  ...overrides,
})

describe('PostAIAdminUseCase', () => {
  let useCase: PostAIAdminUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiAdminPort: AIAdminPort
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

    mockAiAdminPort = {
      createChatAIOptions: vi.fn(),
      getAllChatAIOptions: vi.fn(),
      putChatAIOptions: vi.fn(),
    }

    const testUserId = uuidv7()
    mockAuditContext = {
      userId: new UserId(testUserId).getValue(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new PostAIAdminUseCase(mockLogger, mockAuditLog, mockAiAdminPort)
  })

  describe('execute() - successful scenarios', () => {
    it('should create chat AI options with all fields and return the created record', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO(
        'You are a helpful assistant',
        2000,
        0.7,
        0.9,
        0.5,
        -0.5,
        40,
        ['STOP', 'END'],
        3
      )

      const mockCreatedOptions = createPersistedChatAiOptions({
        chatTypeId,
        prompt: 'You are a helpful assistant',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.5',
        presencePenalty: '-0.5',
        topK: 40,
        stopSequences: ['STOP', 'END'],
        maxRetries: 3,
      })

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(mockCreatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledWith('Executing PostAIAdminUseCase', {
        event: 'ai_admin.create.attempt',
        id: chatTypeId,
      })
      expect(mockAiAdminPort.createChatAIOptions).toHaveBeenCalledTimes(1)
      expect(mockAiAdminPort.createChatAIOptions).toHaveBeenCalledWith(chatTypeId, dto)
      expect(result).toEqual(mockCreatedOptions)
    })

    it('should create chat AI options with only the required prompt field', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Minimal prompt only')

      const mockCreatedOptions = createPersistedChatAiOptions({
        chatTypeId,
        prompt: 'Minimal prompt only',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        maxRetries: null,
      })

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(mockCreatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAiAdminPort.createChatAIOptions).toHaveBeenCalledWith(chatTypeId, dto)
      expect(result).toEqual(mockCreatedOptions)
    })

    it('should return null when the port returns null', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(null)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAiAdminPort.createChatAIOptions).toHaveBeenCalledWith(chatTypeId, dto)
      expect(result).toBeNull()
    })

    it('should create with boundary values', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO(
        'Boundary test',
        100000, // max maxTokens
        2, // max temperature
        1, // max topP
        2, // max frequencyPenalty
        -2, // min presencePenalty
        100, // max topK
        [],
        10 // max maxRetries
      )

      const mockCreatedOptions = createPersistedChatAiOptions({
        chatTypeId,
        prompt: 'Boundary test',
        maxTokens: 100000,
        temperature: '2',
        topP: '1',
        frequencyPenalty: '2',
        presencePenalty: '-2',
        topK: 100,
        stopSequences: [],
        maxRetries: 10,
      })

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(mockCreatedOptions)

      const result = await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(result).toEqual(mockCreatedOptions)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should handle null userAgent in audit context', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')
      const auditContextNoAgent: AuditContext = {
        ...mockAuditContext,
        userAgent: null,
      }

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, auditContextNoAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: undefined })
      )
    })

    it('should handle null userId in audit context', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')
      const unauthenticatedContext: AuditContext = {
        userId: null,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      }

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, unauthenticatedContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ userId: null }))
    })
  })

  describe('execute() - audit logging', () => {
    it('should log a successful audit with correct entity type and action', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.CREATE,
        changes: { reason: 'chat_ai_options_create' },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should use the chatTypeId as the audit entityId', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditEntry?.entityId).toBe(chatTypeId)
    })

    it('should include all audit context fields in the log entry', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditEntry).toMatchObject({
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should use EntityType.AI_OPTIONS ("ai_options") in the audit entry', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditEntry?.entityType).toBe('ai_options')
      expect(auditEntry?.action).toBe('create')
    })

    it('should log audit even when the port returns null', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(null)

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ changes: { reason: 'chat_ai_options_create' } })
      )
    })
  })

  describe('execute() - error scenarios', () => {
    it('should rethrow when createChatAIOptions fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')
      const dbError = new Error('Database connection failed')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockRejectedValue(dbError)

      await expect(useCase.execute(chatTypeId, dto, mockAuditContext)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should log a failure audit when createChatAIOptions throws', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')
      const dbError = new Error('Database connection failed')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockRejectedValue(dbError)

      await expect(useCase.execute(chatTypeId, dto, mockAuditContext)).rejects.toThrow()

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.AI_OPTIONS,
        entityId: chatTypeId,
        action: AuditAction.CREATE,
        changes: { reason: 'chat_ai_options_create_failed' },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should not log a success audit when createChatAIOptions throws', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockRejectedValue(new Error('Failure'))

      await expect(useCase.execute(chatTypeId, dto, mockAuditContext)).rejects.toThrow()

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]?.[0]
      expect(auditEntry?.changes).toEqual({ reason: 'chat_ai_options_create_failed' })
      expect(auditEntry?.changes).not.toEqual({ reason: 'chat_ai_options_create' })
    })

    it('should still call createChatAIOptions before the failure audit', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockRejectedValue(new Error('Failure'))

      await expect(useCase.execute(chatTypeId, dto, mockAuditContext)).rejects.toThrow()

      expect(mockAiAdminPort.createChatAIOptions).toHaveBeenCalledWith(chatTypeId, dto)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })
  })

  describe('execute() - logging behaviour', () => {
    it('should log execution start with the correct message', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Executing PostAIAdminUseCase', {
        event: 'ai_admin.create.attempt',
        id: chatTypeId,
      })
    })

    it('should not call logger.error on a successful execution', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PostAIAdminDTO('Test prompt')

      vi.mocked(mockAiAdminPort.createChatAIOptions).mockResolvedValue(
        createPersistedChatAiOptions({
          chatTypeId,
          prompt: 'Test prompt',
        })
      )

      await useCase.execute(chatTypeId, dto, mockAuditContext)

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
