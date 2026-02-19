import type { QueryResult } from 'pg'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIContentPort } from '../../../src/application/ports/ai-content.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import {
  type PostChatTypesData,
  PostChatTypesUseCase,
} from '../../../src/application/use-cases/post-chat-types.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { SEO } from '../../../src/shared/utils/SEO.util.js'
import { Uuid7Util } from '../../../src/shared/utils/uuid7.util.js'

describe('PostChatTypesUseCase', () => {
  let useCase: PostChatTypesUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiChatContent: AIContentPort
  let mockAuditContext: AuditContext

  const mockQueryResult: QueryResult = {
    command: 'INSERT',
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: [],
  }

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

    mockAiChatContent = {
      fetchChatContent: vi.fn(),
      resolveChatTypeByParam: vi.fn(),
      putChatTypeDetails: vi.fn(),
      createChatType: vi.fn().mockResolvedValue(mockQueryResult),
    }

    mockAuditContext = {
      userId: new UserId(uuidv7()).getValue(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    }

    useCase = new PostChatTypesUseCase(mockLogger, mockAuditLog, mockAiChatContent)
  })

  describe('execute() - successful scenarios', () => {
    it('should call createChatType with correctly shaped data', async () => {
      const data: PostChatTypesData = {
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
      }

      await useCase.execute(mockAuditContext, data)

      expect(mockAiChatContent.createChatType).toHaveBeenCalledTimes(1)
      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      expect(callArg.name).toBe('General Assistant')
      expect(callArg.description).toBe('A general-purpose AI assistant')
      expect(typeof callArg.id).toBe('string')
      expect(callArg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should generate a SEO-friendly id from the name', async () => {
      const data: PostChatTypesData = { name: 'General Assistant', description: 'A helpful bot' }
      const expectedSeoFriendlyId = SEO.generateSeoFriendlyTitle('General Assistant')

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      expect(callArg.seoFriendlyId).toBe(expectedSeoFriendlyId)
    })

    it('should generate a 22-character base64 id from the UUID', async () => {
      const data: PostChatTypesData = {
        name: 'Creative Writing',
        description: 'Helps with creative writing',
      }

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      expect(callArg.seoFriendlyBase64Id).toHaveLength(22)
    })

    it('should generate a unique id for each invocation', async () => {
      const data: PostChatTypesData = { name: 'Test Chat Type', description: 'Testing' }

      await useCase.execute(mockAuditContext, data)
      await useCase.execute(mockAuditContext, data)

      const calls = vi.mocked(mockAiChatContent.createChatType).mock.calls
      expect(calls[0]![0].id).not.toBe(calls[1]![0].id)
    })

    it('should return the QueryResult from createChatType', async () => {
      const data: PostChatTypesData = { name: 'Coding Helper', description: 'Helps with code' }

      const result = await useCase.execute(mockAuditContext, data)

      expect(result).toEqual(mockQueryResult)
    })

    it('should log the initial info message', async () => {
      const data: PostChatTypesData = { name: 'Test Type', description: 'A test' }

      await useCase.execute(mockAuditContext, data)

      expect(mockLogger.info).toHaveBeenCalledWith('Executing PostChatTypesUseCase with data', {
        data,
      })
    })

    it('should call auditLog.log once with the correct audit entry', async () => {
      const data: PostChatTypesData = { name: 'Audit Test', description: 'Testing audit' }

      await useCase.execute(mockAuditContext, data)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.userId).toBe(mockAuditContext.userId)
      expect(auditEntry.entityType).toBe(EntityType.CHAT_TYPE)
      expect(auditEntry.action).toBe(AuditAction.CREATE)
      expect(auditEntry.ipAddress).toBe(mockAuditContext.ipAddress)
      expect(auditEntry.userAgent).toBe(mockAuditContext.userAgent)
    })

    it('should set audit entityId to the same UUID passed to createChatType', async () => {
      const data: PostChatTypesData = { name: 'Audit Id Test', description: 'Testing audit id' }

      await useCase.execute(mockAuditContext, data)

      const insertedId = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0].id
      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.entityId).toBe(insertedId)
    })

    it('should set audit changes reason to "creation_successful" when createChatType returns a truthy result', async () => {
      const data: PostChatTypesData = { name: 'Success Audit', description: 'Should succeed' }

      await useCase.execute(mockAuditContext, data)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.changes).toEqual({ reason: 'creation_successful' })
    })

    it('should set audit changes reason to "creation_unsuccessful" when createChatType returns a falsy result', async () => {
      vi.mocked(mockAiChatContent.createChatType).mockResolvedValue(null as any)
      const data: PostChatTypesData = {
        name: 'Fail Audit',
        description: 'Should mark unsuccessful',
      }

      await useCase.execute(mockAuditContext, data)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.changes).toEqual({ reason: 'creation_unsuccessful' })
    })

    it('should handle auditContext with null userId', async () => {
      const contextWithNullUser: AuditContext = {
        userId: null,
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      }
      const data: PostChatTypesData = { name: 'Null User', description: 'No userId context' }

      await expect(useCase.execute(contextWithNullUser, data)).resolves.toBeDefined()

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.userId).toBeNull()
    })

    it('should handle auditContext with undefined userAgent', async () => {
      const contextWithoutAgent: AuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '10.0.0.1',
        userAgent: null,
      }
      const data: PostChatTypesData = { name: 'No Agent', description: 'No user agent' }

      await useCase.execute(contextWithoutAgent, data)

      const auditEntry = vi.mocked(mockAuditLog.log).mock.calls[0]![0]
      expect(auditEntry.userAgent).toBeUndefined()
    })

    it('should still log the audit entry even when createChatType returns null', async () => {
      vi.mocked(mockAiChatContent.createChatType).mockResolvedValue(null as any)
      const data: PostChatTypesData = {
        name: 'Null Result',
        description: 'createChatType returns null',
      }

      await useCase.execute(mockAuditContext, data)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })
  })

  describe('execute() - SEO id generation', () => {
    it('should filter stop-words from the name when building seoFriendlyId', async () => {
      const data: PostChatTypesData = { name: 'The General Assistant', description: 'desc' }

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      // SEO util strips "The"
      expect(callArg.seoFriendlyId).not.toMatch(/^the-/i)
    })

    it('should produce a kebab-case seoFriendlyId for multi-word names', async () => {
      const data: PostChatTypesData = { name: 'Creative Writing Assistant', description: 'desc' }

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      // eslint-disable-next-line security/detect-unsafe-regex
      expect(callArg.seoFriendlyId).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    })
  })

  describe('execute() - base64 id generation', () => {
    it('should produce a base64url-safe seoFriendlyBase64Id', async () => {
      const data: PostChatTypesData = { name: 'Base64 Test', description: 'desc' }

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      // base64url uses A-Z, a-z, 0-9, - and _ (no + or /)
      expect(callArg.seoFriendlyBase64Id).toMatch(/^[A-Za-z0-9_-]{22}$/)
    })

    it('seoFriendlyBase64Id should be recoverable from the inserted UUID', async () => {
      const data: PostChatTypesData = { name: 'Round-trip Test', description: 'desc' }

      await useCase.execute(mockAuditContext, data)

      const callArg = vi.mocked(mockAiChatContent.createChatType).mock.calls[0]![0]
      const recomputed = Uuid7Util.toBase64(callArg.id!)
      expect(callArg.seoFriendlyBase64Id).toBe(recomputed)
    })
  })

  describe('execute() - error scenarios', () => {
    it('should propagate errors thrown by createChatType', async () => {
      vi.mocked(mockAiChatContent.createChatType).mockRejectedValue(new Error('DB connection lost'))
      const data: PostChatTypesData = { name: 'Error Case', description: 'Should throw' }

      await expect(useCase.execute(mockAuditContext, data)).rejects.toThrow('DB connection lost')
    })

    it('should not call auditLog when createChatType throws', async () => {
      vi.mocked(mockAiChatContent.createChatType).mockRejectedValue(new Error('DB error'))
      const data: PostChatTypesData = { name: 'No Audit On Error', description: 'desc' }

      await expect(useCase.execute(mockAuditContext, data)).rejects.toThrow()

      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should throw when Uuid7Util.toBase64 returns undefined (non-v7 UUID mocked)', async () => {
      vi.spyOn(Uuid7Util, 'createUuidv7').mockReturnValue('not-a-valid-uuid')
      const data: PostChatTypesData = { name: 'Bad UUID', description: 'desc' }

      await expect(useCase.execute(mockAuditContext, data)).rejects.toThrow(
        'Failed to generate a valid base64 ID for the new chat type'
      )
    })

    it('should not call createChatType when base64 generation fails', async () => {
      vi.spyOn(Uuid7Util, 'createUuidv7').mockReturnValue('not-a-valid-uuid')
      const data: PostChatTypesData = { name: 'Bad UUID', description: 'desc' }

      await expect(useCase.execute(mockAuditContext, data)).rejects.toThrow()

      expect(mockAiChatContent.createChatType).not.toHaveBeenCalled()
    })
  })
})
