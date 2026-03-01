import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RefreshTokenRepoRepository } from '../../../../src/adapters/secondary/repositories/refreshTokenRepo.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { RefreshTokenRecord } from '../../../../src/domain/entities/refresh-token-record.js'
import { UserId, type UserIdType } from '../../../../src/domain/value-objects/userID.js'
import { Uuid, type UUIDType } from '../../../../src/domain/value-objects/uuid.js'
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

describe('RefreshTokenRepoRepository', () => {
  let repository: RefreshTokenRepoRepository
  let mockLogger: LoggerPort

  // Helper function to create a branded UUID
  const createUUID = (id?: string): UUIDType => {
    return new Uuid(id || uuidv7()).getValue()
  }

  // Helper function to create a branded UserId
  const createUserId = (id?: string): UserIdType => {
    return new UserId(id || uuidv7()).getValue()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    repository = new RefreshTokenRepoRepository(mockLogger)
  })

  describe('create()', () => {
    it('should insert a new refresh token record into the database', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const tokenData = {
        userId: createUserId(),
        tokenHash: 'a'.repeat(64),
        tokenFamily: createUUID(),
        expiresAt: new Date('2026-03-08T10:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }

      await repository.create(tokenData)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        userId: tokenData.userId,
        tokenHash: tokenData.tokenHash,
        tokenFamily: tokenData.tokenFamily,
        expiresAt: tokenData.expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })
    })

    it('should insert record with null for undefined optional fields', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const tokenData = {
        userId: createUserId(),
        tokenHash: 'b'.repeat(64),
        tokenFamily: createUUID(),
        expiresAt: new Date('2026-03-08T10:00:00Z'),
      }

      await repository.create(tokenData)

      expect(mockValues).toHaveBeenCalledWith({
        userId: tokenData.userId,
        tokenHash: tokenData.tokenHash,
        tokenFamily: tokenData.tokenFamily,
        expiresAt: tokenData.expiresAt,
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should log info when creating refresh token', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const tokenData = {
        userId: createUserId(),
        tokenHash: 'c'.repeat(64),
        tokenFamily: createUUID(),
        expiresAt: new Date('2026-03-08T10:00:00Z'),
      }

      await repository.create(tokenData)

      expect(mockLogger.info).toHaveBeenCalledWith('Creating refresh token record', {
        record: tokenData,
      })
    })

    it('should log debug on successful creation', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const tokenData = {
        userId: createUserId(),
        tokenHash: 'd'.repeat(64),
        tokenFamily: createUUID(),
        expiresAt: new Date('2026-03-08T10:00:00Z'),
      }

      await repository.create(tokenData)

      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully created refresh token record', {
        tokenFamily: tokenData.tokenFamily,
        userId: tokenData.userId,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Database connection failed')
      const mockValues = vi.fn().mockRejectedValue(dbError)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const tokenData = {
        userId: createUserId(),
        tokenHash: 'e'.repeat(64),
        tokenFamily: createUUID(),
        expiresAt: new Date('2026-03-08T10:00:00Z'),
      }

      await expect(repository.create(tokenData)).rejects.toThrow('Database connection failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create refresh token record',
        dbError,
        { record: tokenData }
      )
    })
  })

  describe('findByHash()', () => {
    it('should find and return a refresh token record by hash', async () => {
      const tokenId = createUUID()
      const userId = createUserId()
      const tokenHash = 'f'.repeat(64)
      const tokenFamily = createUUID()
      const expiresAt = new Date('2026-03-08T10:00:00Z')
      const createdAt = new Date('2026-03-01T10:00:00Z')

      const mockRow = {
        id: tokenId,
        userId: userId,
        tokenHash,
        tokenFamily,
        expiresAt,
        revokedAt: null,
        createdAt,
        lastUsedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
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
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return null when token not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash('nonexistent-hash')

      expect(result).toBeNull()
      expect(mockLogger.debug).toHaveBeenCalledWith('No refresh token found with hash', {
        tokenHash: 'nonexistent-hash',
      })
    })

    it('should log token validity status when found', async () => {
      const tokenId = createUUID()
      const userId = createUserId()
      const tokenHash = 'g'.repeat(64)
      const tokenFamily = createUUID()
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const createdAt = new Date()

      const mockRow = {
        id: tokenId,
        userId: userId,
        tokenHash,
        tokenFamily,
        expiresAt: futureDate,
        revokedAt: null,
        createdAt,
        lastUsedAt: null,
        ipAddress: null,
        userAgent: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await repository.findByHash(tokenHash)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Found refresh token',
        expect.objectContaining({
          tokenHash,
          isExpired: expect.any(Boolean),
          isRevoked: expect.any(Boolean),
          isValid: expect.any(Boolean),
        })
      )
    })

    it('should map revoked token correctly', async () => {
      const tokenId = createUUID()
      const userId = createUserId()
      const tokenHash = 'h'.repeat(64)
      const tokenFamily = createUUID()
      const expiresAt = new Date('2026-03-08T10:00:00Z')
      const revokedAt = new Date('2026-03-02T10:00:00Z')
      const createdAt = new Date('2026-03-01T10:00:00Z')

      const mockRow = {
        id: tokenId,
        userId: userId,
        tokenHash,
        tokenFamily,
        expiresAt,
        revokedAt,
        createdAt,
        lastUsedAt: null,
        ipAddress: null,
        userAgent: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByHash(tokenHash)

      expect(result).toBeInstanceOf(RefreshTokenRecord)
      expect(result?.isRevoked()).toBe(true)
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Query failed')
      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const tokenHash = 'i'.repeat(64)

      await expect(repository.findByHash(tokenHash)).rejects.toThrow('Query failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find refresh token by hash',
        dbError,
        { tokenHash }
      )
    })

    it('should log info when starting search', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const tokenHash = 'j'.repeat(64)
      await repository.findByHash(tokenHash)

      expect(mockLogger.info).toHaveBeenCalledWith('Finding refresh token by hash', {
        tokenHash,
      })
    })
  })

  describe('revokeByHash()', () => {
    it('should revoke a token by setting revokedAt', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenHash = 'k'.repeat(64)

      await repository.revokeByHash(tokenHash)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) })
    })

    it('should log info when revoking token', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenHash = 'l'.repeat(64)

      await repository.revokeByHash(tokenHash)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoking refresh token by hash', {
        tokenHash,
      })
    })

    it('should log debug with rows affected after revocation', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenHash = 'm'.repeat(64)

      await repository.revokeByHash(tokenHash)

      expect(mockLogger.debug).toHaveBeenCalledWith('Revoked refresh token by hash', {
        tokenHash,
        rowsAffected: 1,
      })
    })

    it('should handle revocation when token does not exist', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 0 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenHash = 'n'.repeat(64)

      await repository.revokeByHash(tokenHash)

      expect(mockLogger.debug).toHaveBeenCalledWith('Revoked refresh token by hash', {
        tokenHash,
        rowsAffected: 0,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Update failed')
      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenHash = 'o'.repeat(64)

      await expect(repository.revokeByHash(tokenHash)).rejects.toThrow('Update failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke refresh token by hash',
        dbError,
        { tokenHash }
      )
    })
  })

  describe('revokeFamily()', () => {
    it('should revoke all tokens in a token family', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 3 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenFamily = createUUID()

      await repository.revokeFamily(tokenFamily)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) })
    })

    it('should log info when revoking token family', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 2 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenFamily = createUUID()

      await repository.revokeFamily(tokenFamily)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoking refresh token family', {
        tokenFamily,
      })
    })

    it('should log info with rows affected after family revocation', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 5 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenFamily = createUUID()

      await repository.revokeFamily(tokenFamily)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: 5,
      })
    })

    it('should handle family revocation when no tokens exist', async () => {
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 0 })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenFamily = createUUID()

      await repository.revokeFamily(tokenFamily)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: 0,
      })
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Family revocation failed')
      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const tokenFamily = createUUID()

      await expect(repository.revokeFamily(tokenFamily)).rejects.toThrow('Family revocation failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke refresh token family',
        dbError,
        { tokenFamily }
      )
    })
  })

  describe('revokeAllForUser()', () => {
    it('should resolve successfully (placeholder implementation)', async () => {
      const userId = createUserId()

      await expect(repository.revokeAllForUser(userId)).resolves.toBeUndefined()
    })

    it('should log info when revoking all tokens for user', async () => {
      const userId = createUserId()

      await repository.revokeAllForUser(userId)

      expect(mockLogger.info).toHaveBeenCalledWith('Revoking all refresh tokens for user', {
        userId,
      })
    })

    it('should handle errors and log appropriately', async () => {
      const userId = createUserId()

      // Force an error by making the mock implementation throw
      const originalImplementation = repository.revokeAllForUser
      repository.revokeAllForUser = vi.fn().mockImplementation(async () => {
        mockLogger.info('Revoking all refresh tokens for user', { userId })
        const error = new Error('User revocation failed')
        mockLogger.error('Failed to revoke all refresh tokens for user', error, { userId })
        throw error
      })

      await expect(repository.revokeAllForUser(userId)).rejects.toThrow('User revocation failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to revoke all refresh tokens for user',
        expect.any(Error),
        { userId }
      )

      // Restore
      repository.revokeAllForUser = originalImplementation
    })
  })

  describe('deleteExpiredBefore()', () => {
    it('should return 0 (placeholder implementation)', async () => {
      const date = new Date('2026-02-01T00:00:00Z')

      const result = await repository.deleteExpiredBefore(date)

      expect(result).toBe(0)
    })

    it('should log info when deleting expired tokens', async () => {
      const date = new Date('2026-02-01T00:00:00Z')

      await repository.deleteExpiredBefore(date)

      expect(mockLogger.info).toHaveBeenCalledWith('Deleting expired refresh tokens before date', {
        date,
      })
    })

    it('should handle errors and log appropriately', async () => {
      const date = new Date('2026-02-01T00:00:00Z')

      // Force an error by making the mock implementation throw
      const originalImplementation = repository.deleteExpiredBefore
      repository.deleteExpiredBefore = vi.fn().mockImplementation(async () => {
        mockLogger.info('Deleting expired refresh tokens before date', { date })
        const error = new Error('Deletion failed')
        mockLogger.error('Failed to delete expired refresh tokens', error, { date })
        throw error
      })

      await expect(repository.deleteExpiredBefore(date)).rejects.toThrow('Deletion failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete expired refresh tokens',
        expect.any(Error),
        { date }
      )

      // Restore
      repository.deleteExpiredBefore = originalImplementation
    })
  })

  describe('integration scenarios', () => {
    it('should handle token lifecycle: create, find, revoke', async () => {
      const tokenHash = 'p'.repeat(64)
      const userId = createUserId()
      const tokenFamily = createUUID()

      // Create
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.create({
        userId,
        tokenHash,
        tokenFamily,
        expiresAt: new Date('2026-03-08T10:00:00Z'),
      })

      expect(db.insert).toHaveBeenCalled()

      // Find
      const mockRow = {
        id: createUUID(),
        userId,
        tokenHash,
        tokenFamily,
        expiresAt: new Date('2026-03-08T10:00:00Z'),
        revokedAt: null,
        createdAt: new Date(),
        lastUsedAt: null,
        ipAddress: null,
        userAgent: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const found = await repository.findByHash(tokenHash)
      expect(found).toBeInstanceOf(RefreshTokenRecord)

      // Revoke
      const mockRevokeWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
      const mockSet = vi.fn().mockReturnValue({ where: mockRevokeWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeByHash(tokenHash)
      expect(db.update).toHaveBeenCalled()
    })

    it('should handle replay attack: revoke family of compromised token', async () => {
      const tokenFamily = createUUID()

      // Simulate finding a revoked token (replay attack)
      const mockRow = {
        id: createUUID(),
        userId: createUserId(),
        tokenHash: 'q'.repeat(64),
        tokenFamily,
        expiresAt: new Date('2026-03-08T10:00:00Z'),
        revokedAt: new Date('2026-03-02T10:00:00Z'), // Already revoked
        createdAt: new Date(),
        lastUsedAt: null,
        ipAddress: null,
        userAgent: null,
      }

      const mockLimit = vi.fn().mockResolvedValue([mockRow])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const found = await repository.findByHash('q'.repeat(64))
      expect(found?.isRevoked()).toBe(true)

      // Revoke entire family
      const mockFamilyWhere = vi.fn().mockResolvedValue({ rowCount: 3 })
      const mockSet = vi.fn().mockReturnValue({ where: mockFamilyWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.revokeFamily(tokenFamily)
      expect(mockLogger.info).toHaveBeenCalledWith('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: 3,
      })
    })
  })
})
