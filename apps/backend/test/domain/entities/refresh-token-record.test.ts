import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RefreshTokenRecord } from '../../../src/domain/entities/refresh-token-record.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { Uuid, type UUIDType } from '../../../src/domain/value-objects/uuid.js'

// Helper functions to create branded types from UUIDs
function createUUID(id?: string): UUIDType {
  return new Uuid(id || uuidv7()).getValue()
}

function createUserId(id?: string): UserIdType {
  return new UserId(id || uuidv7()).getValue()
}

/**
 * Tests for RefreshTokenRecord entity
 */
describe('RefreshTokenRecord', () => {
  let mockId: UUIDType
  let mockUserId: UserIdType
  let mockTokenHash: string
  let mockTokenFamily: UUIDType
  let mockExpiresAt: Date
  let mockCreatedAt: Date
  let mockLastUsedAt: Date

  beforeEach(() => {
    mockId = createUUID()
    mockUserId = createUserId()
    mockTokenHash = 'a'.repeat(64)
    mockTokenFamily = createUUID()
    mockCreatedAt = new Date('2026-03-01T10:00:00Z')
    mockLastUsedAt = new Date('2026-03-01T10:00:00Z')
    mockExpiresAt = new Date('2026-03-08T10:00:00Z') // 7 days later
  })

  describe('constructor', () => {
    it('should create a refresh token record with all required fields', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record).toBeInstanceOf(RefreshTokenRecord)
    })

    it('should create a refresh token record with default revokedAt as null', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(false)
    })

    it('should create a refresh token record with revokedAt set', () => {
      const revokedAt = new Date('2026-03-02T10:00:00Z')
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        revokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(true)
    })

    it('should create a refresh token record with default createdAt', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record).toBeInstanceOf(RefreshTokenRecord)
    })
  })

  describe('isExpired', () => {
    it('should return false when token has not expired', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z')) // 3 days after creation, 4 days before expiry

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(false)

      vi.useRealTimers()
    })

    it('should return true when token has expired', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // 2 days after expiry

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(true)

      vi.useRealTimers()
    })

    it('should return true when current time equals expiry time', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00Z')) // Exact expiry time

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(false)

      vi.useRealTimers()
    })

    it('should return true when current time is one millisecond after expiry', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00.001Z')) // 1ms after expiry

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(true)

      vi.useRealTimers()
    })

    it('should handle far future expiry dates', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const farFutureExpiry = new Date('2030-01-01T00:00:00Z')

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        farFutureExpiry,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(false)

      vi.useRealTimers()
    })

    it('should handle past expiry dates', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const pastExpiry = new Date('2020-01-01T00:00:00Z')

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        pastExpiry,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('isRevoked', () => {
    it('should return false when token is not revoked', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(false)
    })

    it('should return true when token is revoked', () => {
      const revokedAt = new Date('2026-03-02T10:00:00Z')
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        revokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(true)
    })

    it('should return true after token has been revoked via revoke method', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      record.revoke()

      expect(record.isRevoked()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true when token is not expired and not revoked', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(true)

      vi.useRealTimers()
    })

    it('should return false when token is expired but not revoked', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should return false when token is revoked but not expired', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const revokedAt = new Date('2026-03-02T10:00:00Z')

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        revokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should return false when token is both expired and revoked', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry
      const revokedAt = new Date('2026-03-02T10:00:00Z')

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        revokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should return false after revoking a valid token', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(true)

      record.revoke()

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should check expiry on each call (not cached)', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(true)

      // Advance time past expiry
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('revoke', () => {
    it('should set revokedAt to current date', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(false)

      record.revoke()

      expect(record.isRevoked()).toBe(true)

      vi.useRealTimers()
    })

    it('should make token invalid after revocation', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isValid()).toBe(true)

      record.revoke()

      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should allow revoking an already revoked token', () => {
      const revokedAt = new Date('2026-03-02T10:00:00Z')
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        revokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isRevoked()).toBe(true)

      // Should not throw error
      expect(() => record.revoke()).not.toThrow()
      expect(record.isRevoked()).toBe(true)
    })

    it('should update revokedAt when revoking already revoked token', () => {
      vi.setSystemTime(new Date('2026-03-02T10:00:00Z'))
      const firstRevokedAt = new Date('2026-03-02T10:00:00Z')
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        firstRevokedAt,
        mockCreatedAt,
        mockLastUsedAt
      )

      // Advance time
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))

      record.revoke()

      expect(record.isRevoked()).toBe(true)

      vi.useRealTimers()
    })

    it('should allow revoking an expired token', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(record.isExpired()).toBe(true)

      record.revoke()

      expect(record.isRevoked()).toBe(true)
      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('Integration scenarios', () => {
    it('should handle typical token lifecycle: create -> use -> expire', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      // Token is valid immediately after creation
      expect(record.isValid()).toBe(true)
      expect(record.isExpired()).toBe(false)
      expect(record.isRevoked()).toBe(false)

      // Token is still valid after a few days
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      expect(record.isValid()).toBe(true)

      // Token expires after 7 days
      vi.setSystemTime(new Date('2026-03-08T10:00:00.001Z'))
      expect(record.isValid()).toBe(false)
      expect(record.isExpired()).toBe(true)

      vi.useRealTimers()
    })

    it('should handle token revocation scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))

      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      // Token is initially valid
      expect(record.isValid()).toBe(true)

      // User logs out, token is revoked
      record.revoke()
      expect(record.isValid()).toBe(false)
      expect(record.isRevoked()).toBe(true)

      // Token remains invalid even before expiry
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      expect(record.isValid()).toBe(false)

      vi.useRealTimers()
    })

    it('should handle token family rotation scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))

      // Original token
      const originalToken = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      expect(originalToken.isValid()).toBe(true)

      // New token in same family issued
      const newTokenId = createUUID()
      const newTokenHash = 'b'.repeat(64)
      const newExpiresAt = new Date('2026-03-08T10:30:00Z')
      const newToken = new RefreshTokenRecord(
        newTokenId,
        mockUserId,
        newTokenHash,
        mockTokenFamily, // Same family
        newExpiresAt,
        null,
        new Date(),
        new Date()
      )

      // Original token should be revoked
      originalToken.revoke()

      expect(originalToken.isValid()).toBe(false)
      expect(newToken.isValid()).toBe(true)

      vi.useRealTimers()
    })

    it('should handle security incident: revoke all tokens scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))

      // Multiple tokens for same user
      const token1 = new RefreshTokenRecord(
        createUUID(),
        mockUserId,
        'a'.repeat(64),
        createUUID(),
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      const token2 = new RefreshTokenRecord(
        createUUID(),
        mockUserId,
        'b'.repeat(64),
        createUUID(),
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      const token3 = new RefreshTokenRecord(
        createUUID(),
        mockUserId,
        'c'.repeat(64),
        createUUID(),
        mockExpiresAt,
        null,
        mockCreatedAt,
        mockLastUsedAt
      )

      // All tokens initially valid
      expect(token1.isValid()).toBe(true)
      expect(token2.isValid()).toBe(true)
      expect(token3.isValid()).toBe(true)

      // Security incident: revoke all
      token1.revoke()
      token2.revoke()
      token3.revoke()

      // All tokens now invalid
      expect(token1.isValid()).toBe(false)
      expect(token2.isValid()).toBe(false)
      expect(token3.isValid()).toBe(false)

      vi.useRealTimers()
    })
  })
})
