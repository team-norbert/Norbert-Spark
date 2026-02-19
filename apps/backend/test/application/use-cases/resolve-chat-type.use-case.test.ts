import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIContentPort } from '../../../src/application/ports/ai-content.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { ResolveChatTypeUseCase } from '../../../src/application/use-cases/resolve-chat-type.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'

describe('ResolveChatTypeUseCase', () => {
  let useCase: ResolveChatTypeUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAIContentRepository: AIContentPort
  let mockAuditContext: AuditContext

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as LoggerPort

    mockAuditLog = {
      log: vi.fn(),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    } as AuditLogPort

    mockAIContentRepository = {
      fetchChatContent: vi.fn(),
      resolveChatTypeByParam: vi.fn(),
      putChatTypeDetails: vi.fn(),
      createChatType: vi.fn(),
    } as AIContentPort

    mockAuditContext = {
      userId: new UserId(uuidv7()).getValue(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    useCase = new ResolveChatTypeUseCase(mockLogger, mockAuditLog, mockAIContentRepository)
  })

  describe('successful resolution', () => {
    describe('by UUID', () => {
      it('should resolve chat type when param is a valid UUID', async () => {
        const param = uuidv7()
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        const result = await useCase.execute(param, mockAuditContext)

        expect(result).toBe(resolvedId)
        expect(mockAIContentRepository.resolveChatTypeByParam).toHaveBeenCalledWith(param)
        expect(mockLogger.info).toHaveBeenCalledWith(`Resolving chat type by param: ${param}`)
        expect(mockLogger.info).toHaveBeenCalledWith(`Chat type resolved: ${param} → ${resolvedId}`)
      })

      it('should log audit entry for successful UUID resolution', async () => {
        const param = uuidv7()
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        await useCase.execute(param, mockAuditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockAuditContext.userId,
          entityType: EntityType.CHAT_TYPE,
          entityId: param,
          action: AuditAction.FETCH,
          changes: {
            reason: 'chat_type_resolved_successfully',
            param,
            resolvedId,
          },
          ipAddress: mockAuditContext.ipAddress,
          userAgent: mockAuditContext.userAgent,
        })
      })
    })

    describe('by seoFriendlyId', () => {
      it('should resolve chat type when param is a seoFriendlyId', async () => {
        const param = 'general-assistant'
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        const result = await useCase.execute(param, mockAuditContext)

        expect(result).toBe(resolvedId)
        expect(mockAIContentRepository.resolveChatTypeByParam).toHaveBeenCalledWith(param)
        expect(mockLogger.info).toHaveBeenCalledWith(`Resolving chat type by param: ${param}`)
        expect(mockLogger.info).toHaveBeenCalledWith(`Chat type resolved: ${param} → ${resolvedId}`)
      })

      it('should log audit entry for successful seoFriendlyId resolution', async () => {
        const param = 'code-helper'
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        await useCase.execute(param, mockAuditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockAuditContext.userId,
          entityType: EntityType.CHAT_TYPE,
          entityId: param,
          action: AuditAction.FETCH,
          changes: {
            reason: 'chat_type_resolved_successfully',
            param,
            resolvedId,
          },
          ipAddress: mockAuditContext.ipAddress,
          userAgent: mockAuditContext.userAgent,
        })
      })
    })

    describe('by seoFriendlyBase64Id', () => {
      it('should resolve chat type when param is a seoFriendlyBase64Id', async () => {
        const param = 'AbCdEfGhIjKlMnOpQrStUv'
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        const result = await useCase.execute(param, mockAuditContext)

        expect(result).toBe(resolvedId)
        expect(mockAIContentRepository.resolveChatTypeByParam).toHaveBeenCalledWith(param)
        expect(mockLogger.info).toHaveBeenCalledWith(`Resolving chat type by param: ${param}`)
        expect(mockLogger.info).toHaveBeenCalledWith(`Chat type resolved: ${param} → ${resolvedId}`)
      })

      it('should log audit entry for successful seoFriendlyBase64Id resolution', async () => {
        const param = 'WxYzAbCdEfGhIjKlMnOpQr'
        const resolvedId = uuidv7()

        vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

        await useCase.execute(param, mockAuditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockAuditContext.userId,
          entityType: EntityType.CHAT_TYPE,
          entityId: param,
          action: AuditAction.FETCH,
          changes: {
            reason: 'chat_type_resolved_successfully',
            param,
            resolvedId,
          },
          ipAddress: mockAuditContext.ipAddress,
          userAgent: mockAuditContext.userAgent,
        })
      })
    })
  })

  describe('null return when not found', () => {
    it('should return null when chat type is not found', async () => {
      const param = 'non-existent-chat-type'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      const result = await useCase.execute(param, mockAuditContext)

      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(`Chat type not found for param: ${param}`)
    })

    it('should log audit entry with FETCH_FAILED action when not found', async () => {
      const param = 'missing-chat-type'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      await useCase.execute(param, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: param,
        action: AuditAction.FETCH_FAILED,
        changes: {
          reason: 'chat_type_resolution_failed',
          param,
          resolvedId: null,
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should return null for empty string param', async () => {
      const param = ''

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      const result = await useCase.execute(param, mockAuditContext)

      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(`Chat type not found for param: ${param}`)
    })

    it('should return null for UUID that does not exist in database', async () => {
      const param = uuidv7()

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      const result = await useCase.execute(param, mockAuditContext)

      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(`Chat type not found for param: ${param}`)
    })
  })

  describe('error handling when repository throws', () => {
    it('should propagate database errors from repository', async () => {
      const param = 'test-param'
      const dbError = new Error('Database connection failed')

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockRejectedValue(dbError)

      await expect(useCase.execute(param, mockAuditContext)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should log error when repository throws', async () => {
      const param = 'test-param'
      const dbError = new Error('Query timeout')

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockRejectedValue(dbError)

      await expect(useCase.execute(param, mockAuditContext)).rejects.toThrow('Query timeout')

      expect(mockLogger.error).toHaveBeenCalledWith('Error resolving chat type', dbError, {
        param,
      })
    })

    it('should not create audit log entry when repository throws', async () => {
      const param = 'test-param'
      const dbError = new Error('Database error')

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockRejectedValue(dbError)

      await expect(useCase.execute(param, mockAuditContext)).rejects.toThrow('Database error')

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should handle repository throwing non-Error objects', async () => {
      const param = 'test-param'
      const nonError = 'String error'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockRejectedValue(nonError)

      await expect(useCase.execute(param, mockAuditContext)).rejects.toBe(nonError)

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('audit logging for success cases', () => {
    it('should include all audit context fields in successful resolution', async () => {
      const param = 'test-chat-type'
      const resolvedId = uuidv7()

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

      await useCase.execute(param, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: param,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_type_resolved_successfully',
          param,
          resolvedId,
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should set userAgent to undefined when null in audit context', async () => {
      const param = 'test-chat-type'
      const resolvedId = uuidv7()
      const contextWithoutUserAgent: AuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '10.0.0.1',
        userAgent: null,
      }

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

      await useCase.execute(param, contextWithoutUserAgent)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: contextWithoutUserAgent.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: param,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_type_resolved_successfully',
          param,
          resolvedId,
        },
        ipAddress: contextWithoutUserAgent.ipAddress,
        userAgent: undefined,
      })
    })

    it('should log both info messages for successful resolution', async () => {
      const param = 'chat-type-test'
      const resolvedId = uuidv7()

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(resolvedId)

      await useCase.execute(param, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, `Resolving chat type by param: ${param}`)
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        `Chat type resolved: ${param} → ${resolvedId}`
      )
    })
  })

  describe('audit logging for failure cases', () => {
    it('should include all audit context fields when chat type not found', async () => {
      const param = 'missing-type'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      await useCase.execute(param, mockAuditContext)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: param,
        action: AuditAction.FETCH_FAILED,
        changes: {
          reason: 'chat_type_resolution_failed',
          param,
          resolvedId: null,
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should log warning message when chat type not found', async () => {
      const param = 'non-existent'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      await useCase.execute(param, mockAuditContext)

      expect(mockLogger.warn).toHaveBeenCalledWith(`Chat type not found for param: ${param}`)
    })

    it('should log info message at start even when not found', async () => {
      const param = 'will-not-be-found'

      vi.mocked(mockAIContentRepository.resolveChatTypeByParam).mockResolvedValue(null)

      await useCase.execute(param, mockAuditContext)

      expect(mockLogger.info).toHaveBeenCalledWith(`Resolving chat type by param: ${param}`)
    })
  })
})
