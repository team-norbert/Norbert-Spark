import type { QueryResult } from 'pg'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PutChatTypeDto } from '../../../src/application/dtos/put-chat-type.dto.js'
import type { AIContentPort } from '../../../src/application/ports/ai-content.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { PutChatDetailsUseCase } from '../../../src/application/use-cases/put-chat-details.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { Uuid } from '../../../src/domain/value-objects/uuid.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('PutChatDetailsUseCase', () => {
  let useCase: PutChatDetailsUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiChatContent: AIContentPort
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

    mockAiChatContent = {
      fetchChatContent: vi.fn(),
      resolveChatTypeByParam: vi.fn(),
      putChatTypeDetails: vi.fn(),
      createChatType: vi.fn(),
    }

    const testUserId = uuidv7()
    mockAuditContext = {
      userId: new UserId(testUserId).getValue(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new PutChatDetailsUseCase(mockLogger, mockAuditLog, mockAiChatContent)
  })

  describe('execute() - successful update scenarios', () => {
    it('should update chat type with all fields and log successful audit', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(
        chatTypeId,
        'Updated Chat Type',
        'updated-chat-type',
        'Updated description'
      )

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(mockLogger.info).toHaveBeenCalledWith('Executing PutChatDetailsUseCase', {
        event: 'chat_type.update.attempt',
        id: chatTypeId,
      })
      expect(mockLogger.debug).toHaveBeenCalledWith('Received details to update', {
        event: 'chat_type.update.details',
        details: dto,
      })
      expect(mockAiChatContent.putChatTypeDetails).toHaveBeenCalledTimes(1)
      expect(mockAiChatContent.putChatTypeDetails).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockResult)
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: chatTypeId,
        action: AuditAction.UPDATE,
        changes: {
          after: {
            id: chatTypeId,
            name: 'Updated Chat Type',
            seoFriendlyId: 'updated-chat-type',
            description: 'Updated description',
          },
          reason: 'update_successful',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should update chat type with only id and name', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Only Name Updated')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(mockAiChatContent.putChatTypeDetails).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockResult)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            after: {
              id: chatTypeId,
              name: 'Only Name Updated',
              seoFriendlyId: undefined,
              description: undefined,
            },
            reason: 'update_successful',
          }),
        })
      )
    })

    it('should update chat type with only id and seoFriendlyId', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, undefined, 'new-seo-id')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(result).toEqual(mockResult)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            after: {
              id: chatTypeId,
              name: undefined,
              seoFriendlyId: 'new-seo-id',
              description: undefined,
            },
          }),
        })
      )
    })

    it('should update chat type with only id and description', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, undefined, undefined, 'New description only')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(result).toEqual(mockResult)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            after: {
              id: chatTypeId,
              name: undefined,
              seoFriendlyId: undefined,
              description: 'New description only',
            },
          }),
        })
      )
    })

    it('should handle audit context without userAgent', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Test Name')

      const auditContextWithoutUserAgent: AuditContext = {
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: null,
      }

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      await useCase.execute(auditContextWithoutUserAgent, dto)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: undefined,
        })
      )
    })
  })

  describe('execute() - unsuccessful update scenarios', () => {
    it('should return null and log unsuccessful audit when update fails', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Failed Update')

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(null)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(mockLogger.info).toHaveBeenCalledWith('Executing PutChatDetailsUseCase', {
        event: 'chat_type.update.attempt',
        id: chatTypeId,
      })
      expect(mockAiChatContent.putChatTypeDetails).toHaveBeenCalledWith(dto)
      expect(result).toBeNull()
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: mockAuditContext.userId,
        entityType: EntityType.CHAT_TYPE,
        entityId: chatTypeId,
        action: AuditAction.UPDATE,
        changes: {
          after: {
            id: chatTypeId,
            name: 'Failed Update',
            seoFriendlyId: undefined,
            description: undefined,
          },
          reason: 'update_unsuccessful',
        },
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      })
    })

    it('should log unsuccessful audit with all fields when update returns null', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Failed Name', 'failed-seo', 'Failed description')

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(null)

      const result = await useCase.execute(mockAuditContext, dto)

      expect(result).toBeNull()
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            after: {
              id: chatTypeId,
              name: 'Failed Name',
              seoFriendlyId: 'failed-seo',
              description: 'Failed description',
            },
            reason: 'update_unsuccessful',
          },
        })
      )
    })
  })

  describe('execute() - audit logging verification', () => {
    it('should always log audit regardless of result', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Test')

      // Test with successful result
      const mockSuccessResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }
      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockSuccessResult)
      await useCase.execute(mockAuditContext, dto)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()

      // Test with null result
      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(null)
      await useCase.execute(mockAuditContext, dto)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should include correct entity type and action in audit log', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Test')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      await useCase.execute(mockAuditContext, dto)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: EntityType.CHAT_TYPE,
          action: AuditAction.UPDATE,
        })
      )
    })

    it('should use entityId from dto.id in audit log', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Test')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      await useCase.execute(mockAuditContext, dto)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: chatTypeId,
        })
      )
    })
  })

  describe('execute() - logging verification', () => {
    it('should log info and debug messages', async () => {
      const chatTypeId = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(chatTypeId, 'Test')

      const mockResult: QueryResult = {
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
        rows: [],
      }

      vi.mocked(mockAiChatContent.putChatTypeDetails).mockResolvedValue(mockResult)

      await useCase.execute(mockAuditContext, dto)

      expect(mockLogger.info).toHaveBeenCalledWith('Executing PutChatDetailsUseCase', {
        event: 'chat_type.update.attempt',
        id: chatTypeId,
      })
      expect(mockLogger.debug).toHaveBeenCalledWith('Received details to update', {
        event: 'chat_type.update.details',
        details: dto,
      })
    })
  })
})
