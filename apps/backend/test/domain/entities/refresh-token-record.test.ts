import { uuidv7 } from 'uuidv7'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

  beforeEach(() => {
    vi.useFakeTimers()
    mockId = createUUID()
    mockUserId = createUserId()
    mockTokenHash = 'a'.repeat(64)
    mockTokenFamily = createUUID()
    mockCreatedAt = new Date('2026-03-01T10:00:00Z')
    mockExpiresAt = new Date('2026-03-08T10:00:00Z') // 7 days later
  })

  afterEach(() => vi.useRealTimers())

  function createRecord(overrides?: {
    id?: UUIDType
    expiresAt?: Date
    revokedAt?: Date | null
    createdAt?: Date
  }): RefreshTokenRecord {
    return new RefreshTokenRecord(
      overrides?.id ?? mockId,
      mockUserId,
      mockTokenHash,
      mockTokenFamily,
      overrides?.expiresAt ?? mockExpiresAt,
      overrides?.revokedAt !== undefined ? overrides.revokedAt : null,
      overrides?.createdAt ?? mockCreatedAt
    )
  }

  describe('constructor', () => {
    it('should create a refresh token record with all required fields', () => {
      const record = createRecord()
      expect(record).toBeInstanceOf(RefreshTokenRecord)
    })

    it('should create a refresh token record with default revokedAt as null', () => {
      const record = createRecord()
      expect(record.isRevoked()).toBe(false)
    })

    it('should create a refresh token record with revokedAt set', () => {
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      expect(record.isRevoked()).toBe(true)
    })

    it('should create a refresh token record omitting optional fields', () => {
      const record = new RefreshTokenRecord(
        mockId,
        mockUserId,
        mockTokenHash,
        mockTokenFamily,
        mockExpiresAt
      )
      expect(record).toBeInstanceOf(RefreshTokenRecord)
      expect(record.isRevoked()).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return false when token has not expired', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z')) // 3 days after creation, 4 days before expiry
      const record = createRecord()
      expect(record.isExpired()).toBe(false)
    })

    it('should return true when token has expired', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // 2 days after expiry
      const record = createRecord()
      expect(record.isExpired()).toBe(true)
    })

    it('should return false when current time equals expiry time', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00Z')) // Exact expiry time
      const record = createRecord()
      expect(record.isExpired()).toBe(false)
    })

    it('should return true when current time is one millisecond after expiry', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00.001Z')) // 1ms after expiry
      const record = createRecord()
      expect(record.isExpired()).toBe(true)
    })

    it('should handle far future expiry dates', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord({ expiresAt: new Date('2030-01-01T00:00:00Z') })
      expect(record.isExpired()).toBe(false)
    })

    it('should handle past expiry dates', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord({ expiresAt: new Date('2020-01-01T00:00:00Z') })
      expect(record.isExpired()).toBe(true)
    })
  })

  describe('isRevoked', () => {
    it('should return false when token is not revoked', () => {
      const record = createRecord()
      expect(record.isRevoked()).toBe(false)
    })

    it('should return true when token is revoked', () => {
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      expect(record.isRevoked()).toBe(true)
    })

    it('should return true after token has been revoked via revoke method', () => {
      const record = createRecord()
      record.revoke()
      expect(record.isRevoked()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true when token is not expired and not revoked', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord()
      expect(record.isValid()).toBe(true)
    })

    it('should return false when token is expired but not revoked', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry
      const record = createRecord()
      expect(record.isValid()).toBe(false)
    })

    it('should return false when token is revoked but not expired', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      expect(record.isValid()).toBe(false)
    })

    it('should return false when token is both expired and revoked', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      expect(record.isValid()).toBe(false)
    })

    it('should return false after revoking a valid token', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord()
      expect(record.isValid()).toBe(true)
      record.revoke()
      expect(record.isValid()).toBe(false)
    })

    it('should check expiry on each call (not cached)', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord()
      expect(record.isValid()).toBe(true)
      // Advance time past expiry
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))
      expect(record.isValid()).toBe(false)
    })
  })

  describe('revoke', () => {
    it('should set revokedAt to current date', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord()
      expect(record.isRevoked()).toBe(false)
      record.revoke()
      expect(record.isRevoked()).toBe(true)
    })

    it('should make token invalid after revocation', () => {
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      const record = createRecord()
      expect(record.isValid()).toBe(true)
      record.revoke()
      expect(record.isValid()).toBe(false)
    })

    it('should allow revoking an already revoked token', () => {
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      expect(record.isRevoked()).toBe(true)
      // Should not throw error
      expect(() => record.revoke()).not.toThrow()
      expect(record.isRevoked()).toBe(true)
    })

    it('should preserve original revokedAt when revoking an already revoked token', () => {
      vi.setSystemTime(new Date('2026-03-02T10:00:00Z'))
      const record = createRecord({ revokedAt: new Date('2026-03-02T10:00:00Z') })
      // Advance time
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      record.revoke()
      expect(record.isRevoked()).toBe(true)
    })

    it('should allow revoking an expired token', () => {
      vi.setSystemTime(new Date('2026-03-10T10:00:00Z')) // After expiry
      const record = createRecord()
      expect(record.isExpired()).toBe(true)
      record.revoke()
      expect(record.isRevoked()).toBe(true)
      expect(record.isValid()).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle typical token lifecycle: create -> use -> expire', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))
      const record = createRecord()

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
    })

    it('should handle token revocation scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))
      const record = createRecord()

      // Token is initially valid
      expect(record.isValid()).toBe(true)

      // User logs out, token is revoked
      record.revoke()
      expect(record.isValid()).toBe(false)
      expect(record.isRevoked()).toBe(true)

      // Token remains invalid even before expiry
      vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
      expect(record.isValid()).toBe(false)
    })

    it('should handle token family rotation scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))
      const originalToken = createRecord()
      expect(originalToken.isValid()).toBe(true)

      // New token in same family issued
      const newToken = createRecord({
        id: createUUID(),
        expiresAt: new Date('2026-03-08T10:30:00Z'),
      })

      // Original token should be revoked
      originalToken.revoke()

      expect(originalToken.isValid()).toBe(false)
      expect(newToken.isValid()).toBe(true)
    })

    it('should handle security incident: revoke all tokens scenario', () => {
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))

      // Multiple tokens for same user (different families)
      const tokens = [
        createRecord({ id: createUUID(), expiresAt: mockExpiresAt }),
        createRecord({ id: createUUID(), expiresAt: mockExpiresAt }),
        createRecord({ id: createUUID(), expiresAt: mockExpiresAt }),
      ]

      // All tokens initially valid
      tokens.forEach((t) => expect(t.isValid()).toBe(true))

      // Security incident: revoke all
      tokens.forEach((t) => t.revoke())

      // All tokens now invalid
      tokens.forEach((t) => expect(t.isValid()).toBe(false))
    })
  })
})
