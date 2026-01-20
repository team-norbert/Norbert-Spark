import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIContentPort } from '../../../src/application/ports/ai-content.port.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatDetailsUseCase } from '../../../src/application/use-cases/get-chat-details.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import type { DBChatType } from '../../../src/infrastructure/database/schema.js'

// Mock the SEO utility
vi.mock('../../shared/utils/SEO.util.js', () => ({
  SEO: {
    generateSeoFriendlyTitle: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, '-')),
  },
}))

// Mock the Uuid7Util
vi.mock('../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    toBase64: vi.fn((uuid: string) => {
      // Simple mock implementation
      return Buffer.from(uuid.replace(/-/g, ''), 'hex').toString('base64url')
    }),
  },
}))

describe('GetChatDetailsUseCase', () => {
  let useCase: GetChatDetailsUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockAiChatContent: AIContentPort
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

    mockAiChatContent = {
      fetchChatContent: vi.fn(),
    }

    mockAuditContext = {
      userId: uuidv7() as any, // Cast to UserIdType for testing
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    }

    useCase = new GetChatDetailsUseCase(mockLogger, mockAuditLog, mockAiChatContent)
  })

  describe('execute() - successful scenarios', () => {
    it('should fetch and return chat types with existing SEO fields', async () => {
      const mockChatTypes: DBChatType[] = [
        {
          id: uuidv7(),
          name: 'General Assistant',
          seoFriendlyId: 'general-assistant',
          seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
          description: 'A general-purpose AI assistant',
          createdAt: new Date('2026-01-20T10:00:00Z'),
          updatedAt: new Date('2026-01-20T10:00:00Z'),
        },
        {
          id: uuidv7(),
          name: 'Code Helper',
          seoFriendlyId: 'code-helper',
          seoFriendlyBase64Id: 'WxYzAbCdEfGhIjKlMnOpQr',
          description: 'Specialized in coding assistance',
          createdAt: new Date('2026-01-19T10:00:00Z'),
          updatedAt: new Date('2026-01-19T10:00:00Z'),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(mockAiChatContent.fetchChatContent).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetched 2 chat types from AIContentPort')
      expect(result).toHaveLength(2)
      expect(result[0]!.seoFriendlyId).toBe('general-assistant')
      expect(result[0]!.seoFriendlyBase64Id).toBe('AbCdEfGhIjKlMnOpQrStUv')
      expect(result[1]!.seoFriendlyId).toBe('code-helper')
    })

    it('should generate seoFriendlyId when missing', async () => {
      const chatTypeId = uuidv7()
      const mockChatTypes: DBChatType[] = [
        {
          id: chatTypeId,
          name: 'Test Chat Type',
          seoFriendlyId: null as any,
          seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(result).toHaveLength(1)
      expect(result[0]!.seoFriendlyId).toBe('test-chat-type')
      expect(mockLogger.info).toHaveBeenCalledWith('Fetched 1 chat types from AIContentPort')
    })

    it('should generate seoFriendlyBase64Id when missing', async () => {
      const chatTypeId = uuidv7()
      const mockChatTypes: DBChatType[] = [
        {
          id: chatTypeId,
          name: 'Test Chat Type',
          seoFriendlyId: 'test-chat-type',
          seoFriendlyBase64Id: null as any,
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(result).toHaveLength(1)
      expect(result[0]!.seoFriendlyBase64Id).toBeTruthy()
      expect(typeof result[0]!.seoFriendlyBase64Id).toBe('string')
    })

    it('should generate both SEO fields when both are missing', async () => {
      const chatTypeId = uuidv7()
      const mockChatTypes: DBChatType[] = [
        {
          id: chatTypeId,
          name: 'New Chat Type',
          seoFriendlyId: null as any,
          seoFriendlyBase64Id: null as any,
          description: 'New chat type without SEO fields',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(result).toHaveLength(1)
      expect(result[0]!.seoFriendlyId).toBe('new-chat-type')
      expect(result[0]!.seoFriendlyBase64Id).toBeTruthy()
      expect(result[0]!.name).toBe('New Chat Type')
      expect(result[0]!.description).toBe('New chat type without SEO fields')
    })

    it('should return empty array when no chat types exist', async () => {
      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue([])

      const result = await useCase.execute(mockAuditContext)

      expect(mockAiChatContent.fetchChatContent).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetched 0 chat types from AIContentPort')
      expect(result).toEqual([])
    })

    it('should handle multiple chat types with mixed SEO field states', async () => {
      const id1 = uuidv7()
      const id2 = uuidv7()
      const id3 = uuidv7()

      const mockChatTypes: DBChatType[] = [
        {
          id: id1,
          name: 'Complete Type',
          seoFriendlyId: 'complete-type',
          seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
          description: 'Has all fields',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: id2,
          name: 'Missing Base64',
          seoFriendlyId: 'missing-base64',
          seoFriendlyBase64Id: null as any,
          description: 'Missing base64 field',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: id3,
          name: 'Missing Both',
          seoFriendlyId: null as any,
          seoFriendlyBase64Id: null as any,
          description: 'Missing both fields',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(result).toHaveLength(3)

      // First item keeps existing fields
      expect(result[0]!.seoFriendlyId).toBe('complete-type')
      expect(result[0]!.seoFriendlyBase64Id).toBe('AbCdEfGhIjKlMnOpQrStUv')

      // Second item keeps seoFriendlyId and generates seoFriendlyBase64Id
      expect(result[1]!.seoFriendlyId).toBe('missing-base64')
      expect(result[1]!.seoFriendlyBase64Id).toBeTruthy()

      // Third item generates both
      expect(result[2]!.seoFriendlyId).toBe('missing-both')
      expect(result[2]!.seoFriendlyBase64Id).toBeTruthy()
    })

    it('should preserve all original chat type properties', async () => {
      const chatTypeId = uuidv7()
      const createdAt = new Date('2026-01-15T08:00:00Z')
      const updatedAt = new Date('2026-01-20T12:00:00Z')

      const mockChatTypes: DBChatType[] = [
        {
          id: chatTypeId,
          name: 'Test Type',
          seoFriendlyId: 'test-type',
          seoFriendlyBase64Id: 'TestBase64Id123456',
          description: 'Test description with details',
          createdAt,
          updatedAt,
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      const result = await useCase.execute(mockAuditContext)

      expect(result[0]!.id).toBe(chatTypeId)
      expect(result[0]!.name).toBe('Test Type')
      expect(result[0]!.description).toBe('Test description with details')
      expect(result[0]!.createdAt).toBe(createdAt)
      expect(result[0]!.updatedAt).toBe(updatedAt)
    })
  })

  describe('execute() - error scenarios', () => {
    it('should propagate errors from AIContentPort', async () => {
      const error = new Error('Database connection failed')
      vi.mocked(mockAiChatContent.fetchChatContent).mockRejectedValue(error)

      await expect(useCase.execute(mockAuditContext)).rejects.toThrow('Database connection failed')
      expect(mockAiChatContent.fetchChatContent).toHaveBeenCalledTimes(1)
    })

    it('should handle unexpected errors during processing', async () => {
      const mockChatTypes: DBChatType[] = [
        {
          id: uuidv7(),
          name: 'Test',
          seoFriendlyId: 'test',
          seoFriendlyBase64Id: 'test',
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(mockAiChatContent.fetchChatContent).mockResolvedValue(mockChatTypes)

      // Make the logger throw an error
      vi.mocked(mockLogger.info).mockImplementation(() => {
        throw new Error('Logger failed')
      })

      await expect(useCase.execute(mockAuditContext)).rejects.toThrow('Logger failed')
    })
  })
})
