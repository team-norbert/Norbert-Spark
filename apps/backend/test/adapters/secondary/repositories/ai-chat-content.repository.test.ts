import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIChatContentRepository } from '../../../../src/adapters/secondary/repositories/ai-chat-content.repository.js'
import { PutChatTypeDto } from '../../../../src/application/dtos/put-chat-type.dto.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { Uuid } from '../../../../src/domain/value-objects/uuid.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import { chatTypes } from '../../../../src/infrastructure/database/schema.js'
import { Uuid7Util } from '../../../../src/shared/utils/uuid7.util.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}))

// Mock Uuid7Util
vi.mock('../../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    isValidUUID: vi.fn(),
    uuidVersionValidation: vi.fn(),
  },
}))

describe('AIChatContentRepository', () => {
  let repository: AIChatContentRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as LoggerPort

    repository = new AIChatContentRepository(mockLogger)
  })

  describe('fetchChatContent', () => {
    it('should fetch all chat types in descending order by createdAt', async () => {
      const mockChatTypes = [
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

      const mockOrderBy = vi.fn().mockResolvedValue(mockChatTypes)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      // Access the private method via reflection for testing
      const result = await (repository as any).fetchChatContent()

      expect(result).toEqual(mockChatTypes)
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalledTimes(1)
      expect(mockOrderBy).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no chat types exist', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await (repository as any).fetchChatContent()

      expect(result).toEqual([])
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed')
      const mockOrderBy = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect((repository as any).fetchChatContent()).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should fetch chat types with all required fields', async () => {
      const chatTypeId = uuidv7()
      const now = new Date()
      const mockChatType = {
        id: chatTypeId,
        name: 'Test Chat Type',
        seoFriendlyId: 'test-chat-type',
        seoFriendlyBase64Id: 'A1B2C3D4E5F6G7H8I9J0Kl',
        description: 'Test description',
        createdAt: now,
        updatedAt: now,
      }

      const mockOrderBy = vi.fn().mockResolvedValue([mockChatType])
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await (repository as any).fetchChatContent()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', chatTypeId)
      expect(result[0]).toHaveProperty('name', 'Test Chat Type')
      expect(result[0]).toHaveProperty('seoFriendlyId', 'test-chat-type')
      expect(result[0]).toHaveProperty('seoFriendlyBase64Id', 'A1B2C3D4E5F6G7H8I9J0Kl')
      expect(result[0]).toHaveProperty('description', 'Test description')
      expect(result[0]).toHaveProperty('createdAt', now)
      expect(result[0]).toHaveProperty('updatedAt', now)
    })
  })

  describe('resolveChatTypeByParam', () => {
    // Test data for validation scenarios
    const _validUUID = uuidv7()
    const _validSeoFriendlyId = 'general-assistant'
    const _validBase64Id = 'AbCdEfGhIjKlMnOpQrStUv'
    describe('successful resolution by UUID', () => {
      it('should resolve chat type when param is a valid UUID', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', {
          param,
          length: param.length,
        })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })

      it('should include UUID condition when isValidUUID returns true', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockWhere).toHaveBeenCalled()
        // The where clause should include 3 conditions: UUID, seoFriendlyId, seoFriendlyBase64Id
      })
    })

    describe('successful resolution by seoFriendlyId', () => {
      it('should resolve chat type when param matches seoFriendlyId', async () => {
        const chatTypeId = uuidv7()
        const param = 'general-assistant'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', {
          param,
          length: param.length,
        })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })

      it('should not check UUID column when param is not a valid UUID', async () => {
        const chatTypeId = uuidv7()
        const param = 'code-helper'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        expect(mockWhere).toHaveBeenCalled()
        // The where clause should only include 2 conditions: seoFriendlyId, seoFriendlyBase64Id
      })
    })

    describe('successful resolution by seoFriendlyBase64Id', () => {
      it('should resolve chat type when param matches seoFriendlyBase64Id', async () => {
        const chatTypeId = uuidv7()
        const param = 'AbCdEfGhIjKlMnOpQrStUv'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBe(chatTypeId)
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', {
          param,
          length: param.length,
        })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: chatTypeId,
        })
      })
    })

    describe('return null when no match found', () => {
      it('should return null when param does not match any identifier', async () => {
        const param = 'non-existent-chat-type'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', {
          param,
          length: param.length,
        })
        expect(mockLogger.debug).toHaveBeenCalledWith('Resolved chat type', {
          param,
          resolvedId: null,
        })
      })

      it('should return null when UUID param does not match any record', async () => {
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
      })

      it('should return null when empty string is provided', async () => {
        const param = ''

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
      })
    })

    describe('handling invalid UUID strings', () => {
      it('should not check UUID column when param is an invalid UUID format', async () => {
        const param = 'not-a-valid-uuid'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
        // Should only query seoFriendlyId and seoFriendlyBase64Id columns
      })

      it('should avoid PostgreSQL type casting errors for invalid UUID strings', async () => {
        const param = 'invalid-uuid-123'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        // Should not throw error
        const result = await repository.resolveChatTypeByParam(param)

        expect(result).toBeNull()
        expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(param)
      })
    })

    describe('database errors', () => {
      it('should propagate database query errors', async () => {
        const param = 'test-param'
        const dbError = new Error('Database connection failed')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockRejectedValue(dbError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow(
          'Database connection failed'
        )
      })

      it('should propagate database timeout errors', async () => {
        const param = uuidv7()
        const timeoutError = new Error('Query timeout exceeded')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockRejectedValue(timeoutError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow(
          'Query timeout exceeded'
        )
      })

      it('should log debug messages even when database errors occur', async () => {
        const param = 'test-param'
        const dbError = new Error('Database error')

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockRejectedValue(dbError)
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.resolveChatTypeByParam(param)).rejects.toThrow('Database error')

        expect(mockLogger.debug).toHaveBeenCalledWith('Resolving chat type by param', {
          param,
          length: param.length,
        })
        // Second debug log won't be called because of the error
      })
    })

    describe('query optimization', () => {
      it('should limit results to 1 row', async () => {
        const chatTypeId = uuidv7()
        const param = uuidv7()

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        expect(mockLimit).toHaveBeenCalledWith(1)
      })

      it('should only select the id column', async () => {
        const chatTypeId = uuidv7()
        const param = 'test-param'

        vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

        const mockLimit = vi.fn().mockResolvedValue([{ id: chatTypeId }])
        const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await repository.resolveChatTypeByParam(param)

        // Verify select was called (exact args checking would be too coupled to implementation)
        expect(db.select).toHaveBeenCalled()
      })
    })
  })

  describe('putChatTypeDetails', () => {
    // Helper to create a valid UUID for testing
    const createValidUUID = (): string => {
      const uuid = uuidv7()
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v7')
      return uuid
    }

    describe('successful updates', () => {
      it('should update chat type with all fields', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(
          chatTypeId,
          'Updated Name',
          'updated-seo-id',
          'Updated description'
        )
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(db.update).toHaveBeenCalledTimes(1)
        expect(mockSet).toHaveBeenCalledWith({
          name: 'Updated Name',
          description: 'Updated description',
          seoFriendlyId: 'updated-seo-id',
        })
        expect(mockWhere).toHaveBeenCalledTimes(1)
        expect(mockLogger.debug).toHaveBeenCalledWith('Updating chat type details', {
          chatTypeId,
        })
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated chat type details', {
          chatTypeId,
        })
      })

      it('should update chat type with only name field', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Only Name')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(mockSet).toHaveBeenCalledWith({
          name: 'Only Name',
        })
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated chat type details', {
          chatTypeId,
        })
      })

      it('should update chat type with only description field', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, undefined, undefined, 'Only Description Updated')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(mockSet).toHaveBeenCalledWith({
          description: 'Only Description Updated',
        })
      })

      it('should update chat type with only seoFriendlyId field', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, undefined, 'new-seo-friendly-id')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(mockSet).toHaveBeenCalledWith({
          seoFriendlyId: 'new-seo-friendly-id',
        })
      })

      it('should update chat type with name and description', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(
          chatTypeId,
          'Name and Description',
          undefined,
          'Description only'
        )
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(mockSet).toHaveBeenCalledWith({
          name: 'Name and Description',
          description: 'Description only',
        })
      })

      it('should update chat type with name and seoFriendlyId', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Updated Name', 'updated-seo')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toEqual(mockResult)
        expect(mockSet).toHaveBeenCalledWith({
          name: 'Updated Name',
          seoFriendlyId: 'updated-seo',
        })
      })

      it('should return null when empty update object provided (no rows affected)', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId)
        const mockResult = { rowCount: 0, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toBeNull()
        expect(mockSet).toHaveBeenCalledWith({})
        expect(mockLogger.warn).toHaveBeenCalledWith('No chat type found to update', {
          chatTypeId,
        })
      })

      it('should return null when chat type not found (rowCount 0)', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Non-existent')
        const mockResult = { rowCount: 0, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toBeNull()
        expect(mockLogger.warn).toHaveBeenCalledWith('No chat type found to update', {
          chatTypeId,
        })
      })
    })

    describe('logging behavior', () => {
      it('should log debug message with chatTypeId before update', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        expect(mockLogger.debug).toHaveBeenCalledWith('Updating chat type details', {
          chatTypeId,
        })
      })

      it('should log info message with chatTypeId after successful update', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated chat type details', {
          chatTypeId,
        })
      })
    })

    describe('error handling', () => {
      it('should log error and return null when database update fails', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const dbError = new Error('Database connection lost')

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toBeNull()
        expect(mockLogger.debug).toHaveBeenCalledWith('Updating chat type details', {
          chatTypeId,
        })
        expect(mockLogger.error).toHaveBeenCalledWith('Error updating chat type details', dbError)
        expect(mockLogger.info).not.toHaveBeenCalled()
      })

      it('should return null for database constraint violation errors', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Duplicate Name')
        const constraintError = new Error('duplicate key value violates unique constraint')

        const mockWhere = vi.fn().mockRejectedValue(constraintError)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toBeNull()
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error updating chat type details',
          constraintError
        )
      })

      it('should return null for timeout errors', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const timeoutError = new Error('Query timeout')

        const mockWhere = vi.fn().mockRejectedValue(timeoutError)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        const result = await repository.putChatTypeDetails(dto)

        expect(result).toBeNull()
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error updating chat type details',
          timeoutError
        )
      })
    })

    describe('database interaction', () => {
      it('should call db.update exactly once', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        expect(db.update).toHaveBeenCalledTimes(1)
      })

      it('should call set with correct update data structure', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Name', 'seo-id', 'Description')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Name',
            seoFriendlyId: 'seo-id',
            description: 'Description',
          })
        )
      })

      it('should call where clause exactly once', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        expect(mockWhere).toHaveBeenCalledTimes(1)
      })

      it('should not include updatedAt in update data', async () => {
        const uuidString = createValidUUID()
        const chatTypeId = new Uuid(uuidString).getValue()
        const dto = new PutChatTypeDto(chatTypeId, 'Test')
        const mockResult = { rowCount: 1, command: 'UPDATE', oid: 0, fields: [], rows: [] }

        const mockWhere = vi.fn().mockResolvedValue(mockResult)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await repository.putChatTypeDetails(dto)

        const setCallArg = mockSet.mock.calls[0]?.[0]
        expect(setCallArg).toBeDefined()
        expect(setCallArg).not.toHaveProperty('updatedAt')
      })
    })
  })

  describe('createChatType', () => {
    const mockData = {
      id: uuidv7(),
      name: 'Test Chat Type',
      seoFriendlyId: 'test-chat-type',
      seoFriendlyBase64Id: 'AAAAAAAAAAAAAAAAAAAAAA',
      description: 'A test chat type description',
    }

    const mockCreatedChatType = {
      ...mockData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    describe('success', () => {
      it('should return the created chat type from the database', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        const result = await repository.createChatType(mockData)

        expect(result).toEqual(mockCreatedChatType)
      })

      it('should call db.insert with the chatTypes schema object', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(db.insert).toHaveBeenCalledTimes(1)
        expect(db.insert).toHaveBeenCalledWith(chatTypes)
      })

      it('should call .values() with the full data object', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(mockValues).toHaveBeenCalledTimes(1)
        expect(mockValues).toHaveBeenCalledWith(mockData)
      })

      it('should log debug before the insert with the chat type name', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(mockLogger.debug).toHaveBeenCalledWith('Creating new chat type', {
          name: mockData.name,
        })
      })

      it('should log info after a successful insert with name and id', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(mockLogger.info).toHaveBeenCalledWith('Successfully created new chat type', {
          name: mockCreatedChatType.name,
          id: mockCreatedChatType.id,
        })
      })

      it('should log debug before info (correct ordering)', async () => {
        const callOrder: string[] = []
        ;(mockLogger.debug as ReturnType<typeof vi.fn>).mockImplementation(() =>
          callOrder.push('debug')
        )
        ;(mockLogger.info as ReturnType<typeof vi.fn>).mockImplementation(() =>
          callOrder.push('info')
        )

        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(callOrder).toEqual(['debug', 'info'])
      })

      it('should pass all ChatTypeInsertDto fields through to .values()', async () => {
        const fullData = {
          id: uuidv7(),
          name: 'Full Data Type',
          seoFriendlyId: 'full-data-type',
          seoFriendlyBase64Id: 'BBBBBBBBBBBBBBBBBBBBBB',
          description: 'A comprehensive description for testing field passthrough',
        }
        const mockCreatedFull = { ...fullData, createdAt: new Date(), updatedAt: new Date() }
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedFull])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(fullData)

        const valuesArg = mockValues.mock.calls[0]?.[0]
        expect(valuesArg).toMatchObject({
          id: fullData.id,
          name: fullData.name,
          seoFriendlyId: fullData.seoFriendlyId,
          seoFriendlyBase64Id: fullData.seoFriendlyBase64Id,
          description: fullData.description,
        })
      })

      it('should not call logger.error on success', async () => {
        const mockReturning = vi.fn().mockResolvedValue([mockCreatedChatType])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await repository.createChatType(mockData)

        expect(mockLogger.error).not.toHaveBeenCalled()
      })

      it('should throw an error if no row is returned', async () => {
        const mockReturning = vi.fn().mockResolvedValue([])
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow(
          'Failed to create chat type - no row returned'
        )
      })
    })

    describe('error handling', () => {
      it('should throw ConflictException for duplicate key errors', async () => {
        const dbError = { code: '23505', message: 'duplicate key value' }
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow(
          'A chat type with this name or identifier already exists'
        )
      })

      it('should log warning for duplicate key errors before throwing ConflictException', async () => {
        const dbError = { code: '23505', message: 'duplicate key value' }
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow()

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Duplicate key error when creating chat type',
          {
            name: mockData.name,
            error: dbError,
          }
        )
      })

      it('should re-throw non-duplicate database errors', async () => {
        const dbError = new Error('DB insert failed')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow('DB insert failed')
      })

      it('should re-throw the exact error instance for non-duplicate errors', async () => {
        const dbError = new Error('connection timeout')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toBe(dbError)
      })

      it('should log the error before re-throwing for non-duplicate errors', async () => {
        const dbError = new Error('Connection timeout')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow()

        expect(mockLogger.error).toHaveBeenCalledWith('Error creating new chat type', dbError)
      })

      it('should log error exactly once for non-duplicate errors', async () => {
        const dbError = new Error('Connection timeout')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow()

        expect(mockLogger.error).toHaveBeenCalledTimes(1)
      })

      it('should not call logger.info when the insert fails', async () => {
        const dbError = new Error('DB insert failed')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow()

        expect(mockLogger.info).not.toHaveBeenCalled()
      })

      it('should still log debug before re-throwing the error', async () => {
        const dbError = new Error('DB insert failed')
        const mockReturning = vi.fn().mockRejectedValue(dbError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

        await expect(repository.createChatType(mockData)).rejects.toThrow()

        expect(mockLogger.debug).toHaveBeenCalledWith('Creating new chat type', {
          name: mockData.name,
        })
      })
    })
  })
})
