import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RefreshTokenRepository } from '../../../../src/adapters/secondary/repositories/refresh-token.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { RefreshTokenRecord } from '../../../../src/domain/entities/refresh-token-record.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { Uuid } from '../../../../src/domain/value-objects/uuid.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository
  let mockLogger: LoggerPort

  const createTokenHash = () => 'a'.repeat(64) // SHA-256 hash is 64 hex chars
  const createUserId = () => new UserId(uuidv7()).getValue()
  const createUuid = () => new Uuid(uuidv7()).getValue()

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    repository = new RefreshTokenRepository(mockLogger)
  })

  describe('create', () => {
    it('should insert a refresh token record into the database', async () => {
      const record = {
        userId: createUserId(),
        tokenHash: createTokenHash(),
        tokenFamily: createUuid(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.create(record)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        userId: record.userId,
        tokenHash: record.tokenHash,
        tokenFamily: record.tokenFamily,
        expiresAt: record.expiresAt,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Creating refresh token record', { record })
      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully created refresh token record', {
        tokenFamily: record.tokenFamily,
        userId: record.userId,
      })
    })

    it('should handle optional ipAddress and userAgent', async () => {
      const record = {
        userId: createUserId(),
        tokenHash: createTokenHash(),
        tokenFamily: createUuid(),
        expiresAt: new Date(),
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.create(record)

      expect(mockValues).toHaveBeenCalledWith({
        userId: record.userId,
        tokenHash: record.tokenHash,
        tokenFamily: record.tokenFamily,
        expiresAt: record.expiresAt,
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const record = {
        userId: createUserId(),
        tokenHash: createTokenHash(),
        tokenFamily: createUuid(),
        expiresAt: new Date(),
      }

      const dbError = new Error('Database connection failed')
      const mockValues = vi.fn().mockRejectedValue(dbError)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await expect(repository.create(record)).rejects.toThrow('Database connection failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create refresh token record',
        dbError,
        { record }
      )
    })
  })

  describe('findByHash', () => {
    it('should return RefreshTokenRecord when token is found', async () => {
      const tokenHash = createTokenHash()
      const userId = createUserId()
      const tokenFamily = createUuid()
      const now = new Date()
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockRow = {
        id: uuidv7(),
        userId,
        tokenHash,
        tokenFamily,
        expiresAt: futureDate,
        revokedAt: null,
        createdAt: now,
        lastUsedAt: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash(tokenHash)

      expect(result).toBeInstanceOf(RefreshTokenRecord)
      expect(result?.getUserId()).toBe(userId)
      expect(result?.getTokenFamily()).toBe(tokenFamily)
      expect(mockLogger.info).toHaveBeenCalledWith('Finding refresh token by hash', { tokenHash })
      expect(mockLogger.debug).toHaveBeenCalledWith('Found refresh token', {
        tokenHash,
        isExpired: false,
        isRevoked: false,
        isValid: true,
      })
    })

    it('should return null when token is not found', async () => {
      const tokenHash = createTokenHash()

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash(tokenHash)

      expect(result).toBeNull()
      expect(mockLogger.debug).toHaveBeenCalledWith('No refresh token found with hash', {
        tokenHash,
      })
    })

    it('should correctly identify expired tokens', async () => {
      const tokenHash = createTokenHash()
      const pastDate = new Date(Date.now() - 1000) // 1 second ago

      const mockRow = {
        id: uuidv7(),
        userId: createUserId(),
        tokenHash,
        tokenFamily: createUuid(),
        expiresAt: pastDate,
        revokedAt: null,
        createdAt: new Date(),
        lastUsedAt: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash(tokenHash)

      expect(result?.isExpired()).toBe(true)
      expect(result?.isValid()).toBe(false)
    })

    it('should correctly identify revoked tokens', async () => {
      const tokenHash = createTokenHash()
      const now = new Date()

      const mockRow = {
        id: uuidv7(),
        userId: createUserId(),
        tokenHash,
        tokenFamily: createUuid(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: now,
        createdAt: now,
        lastUsedAt: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash(tokenHash)

      expect(result?.isRevoked()).toBe(true)
      expect(result?.isValid()).toBe(false)
    })

    it('should log error and rethrow on database failure', async () => {
      const tokenHash = createTokenHash()
      const dbError = new Error('Database query failed')

      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await expect(repository.findByHash(tokenHash)).rejects.toThrow('Database query failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find refresh token by hash',
        dbError,
        { tokenHash }
      )
    })
  })

  describe('revokeByHash', () => {
    it('should revoke a token by its hash', async () => {
      const tokenHash = createTokenHash()
      const mockResult = { rowCount: 1 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeByHash(tokenHash)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) })
      expect(mockLogger.info).toHaveBeenCalledWith('Revoking refresh token by hash', {
        tokenHash,
      })
      expect(mockLogger.debug).toHaveBeenCalledWith('Revoked refresh token by hash', {
        tokenHash,
        rowsAffected: 1,
      })
    })

    it('should handle case when token is not found', async () => {
      const tokenHash = createTokenHash()
      const mockResult = { rowCount: 0 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeByHash(tokenHash)

      expect(mockLogger.debug).toHaveBeenCalledWith('Revoked refresh token by hash', {
        tokenHash,
        rowsAffected: 0,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const tokenHash = createTokenHash()
      const dbError = new Error('Database update failed')

      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(repository.revokeByHash(tokenHash)).rejects.toThrow('Database update failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke refresh token by hash',
        dbError,
        { tokenHash }
      )
    })
  })

  describe('revokeFamily', () => {
    it('should revoke all tokens in a family', async () => {
      const tokenFamily = createUuid()
      const mockResult = { rowCount: 3 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeFamily(tokenFamily)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) })
      expect(mockLogger.info).toHaveBeenCalledWith('Revoking refresh token family', {
        tokenFamily,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: 3,
      })
    })

    it('should handle case when no tokens are found in family', async () => {
      const tokenFamily = createUuid()
      const mockResult = { rowCount: 0 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeFamily(tokenFamily)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: 0,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const tokenFamily = createUuid()
      const dbError = new Error('Database update failed')

      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(repository.revokeFamily(tokenFamily)).rejects.toThrow('Database update failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke refresh token family',
        dbError,
        { tokenFamily }
      )
    })
  })

  describe('revokeAllForUser', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = createUserId()
      const mockResult = { rowCount: 5 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeAllForUser(userId)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) })
      expect(mockLogger.info).toHaveBeenCalledWith('Revoking all refresh tokens for user', {
        userId,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all refresh tokens for user', {
        userId,
        rowsAffected: 5,
      })
    })

    it('should handle case when user has no tokens', async () => {
      const userId = createUserId()
      const mockResult = { rowCount: 0 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeAllForUser(userId)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all refresh tokens for user', {
        userId,
        rowsAffected: 0,
      })
    })

    it('should set revokedAt timestamp to current date', async () => {
      const userId = createUserId()
      const mockResult = { rowCount: 2 }
      const beforeCall = new Date()

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeAllForUser(userId)

      const afterCall = new Date()
      const setCallArg = mockSet.mock.calls[0][0]
      const revokedAt = setCallArg.revokedAt

      expect(revokedAt).toBeInstanceOf(Date)
      expect(revokedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
      expect(revokedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    })

    it('should revoke multiple tokens belonging to same user', async () => {
      const userId = createUserId()
      const mockResult = { rowCount: 10 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeAllForUser(userId)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all refresh tokens for user', {
        userId,
        rowsAffected: 10,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const userId = createUserId()
      const dbError = new Error('Database update failed')

      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(repository.revokeAllForUser(userId)).rejects.toThrow('Database update failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke all refresh tokens for user',
        dbError,
        { userId }
      )
    })

    it('should handle database connection timeouts', async () => {
      const userId = createUserId()
      const timeoutError = new Error('Connection timeout')

      const mockWhere = vi.fn().mockRejectedValue(timeoutError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await expect(repository.revokeAllForUser(userId)).rejects.toThrow('Connection timeout')
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should complete successfully for valid UUIDv7 user IDs', async () => {
      const validUuidV7 = '019cab34-994e-7685-850b-760295d5fad4'
      const userId = new UserId(validUuidV7).getValue()
      const mockResult = { rowCount: 1 }

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeAllForUser(userId)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all refresh tokens for user', {
        userId,
        rowsAffected: 1,
      })
    })
  })

  describe('deleteExpiredBefore', () => {
    it('should return 0 (placeholder implementation)', async () => {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const result = await repository.deleteExpiredBefore(cutoffDate)

      expect(result).toBe(0)
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting expired refresh tokens before date', {
        date: cutoffDate,
      })
    })

    it('should handle errors gracefully', async () => {
      const cutoffDate = new Date()

      // Since it's a placeholder that returns Promise.resolve(0), we just verify it doesn't throw
      await expect(repository.deleteExpiredBefore(cutoffDate)).resolves.toBe(0)
    })
  })
})
