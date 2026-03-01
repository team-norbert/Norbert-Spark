import type { RefreshTokenRecord } from '../../domain/entities/refresh-token-record.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'

export interface RefreshTokenRepositoryPort {
  /** Store a new refresh token record */
  create(record: {
    userId: UserIdType
    tokenHash: string
    tokenFamily: UUIDType
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }): Promise<void>

  /** Find a valid (non-expired, non-revoked) token by its hash */
  findByHash(tokenHash: UUIDType): Promise<RefreshTokenRecord | null>

  /** Revoke a single token by its hash */
  revokeByHash(tokenHash: UUIDType): Promise<void>

  /** Revoke ALL tokens in a token family (replay attack response) */
  revokeFamily(tokenFamily: string): Promise<void>

  /** Revoke ALL tokens for a user (logout from all devices) */
  revokeAllForUser(userId: UserIdType): Promise<void>

  /** Delete expired tokens older than a given date (cleanup job) */
  deleteExpiredBefore(date: Date): Promise<number>
}
