import type { UserIdType } from '../value-objects/userID.js'
import type { UUIDType } from '../value-objects/uuid.js'

/**
 * RefreshTokenRecord entity representing a stored refresh token in the database.
 *
 * This entity encapsulates the lifecycle and validation logic for refresh tokens.
 * Each record represents a single refresh token with its associated metadata,
 * expiration time, and revocation status.
 *
 * Token Family:
 * - Tokens share a family ID to enable token rotation detection
 * - When a token is used, a new token in the same family is issued
 * - If a previously-used token is presented, the entire family can be revoked
 *
 * Security:
 * - Only the SHA-256 hash of the token is stored, never the raw token
 * - Expired tokens cannot be used even if not revoked
 * - Revoked tokens cannot be used even if not expired
 * - Token validity is determined by both expiration and revocation status
 *
 * @example
 * // Create a new token record
 * const record = new RefreshTokenRecord(
 *   tokenId,
 *   userId,
 *   tokenHash,
 *   tokenFamily,
 *   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
 *   null,
 *   new Date(),
 *   new Date()
 * )
 *
 * // Check validity
 * if (record.isValid()) {
 *   // Token can be used
 * }
 *
 * // Revoke token (e.g., on logout)
 * record.revoke()
 */
export class RefreshTokenRecord {
  /**
   * Creates a new RefreshTokenRecord instance.
   *
   * @param id - Unique identifier for this token record (UUID v7)
   * @param userId - The user this token belongs to (UUID v7)
   * @param tokenHash - SHA-256 hash of the raw token (64 hex characters)
   * @param tokenFamily - UUID identifying the token family for rotation tracking
   * @param expiresAt - Timestamp when the token expires
   * @param revokedAt - Timestamp when the token was revoked (null if not revoked)
   * @param createdAt - Timestamp when the token was created
   * @param lastUsedAt - Timestamp when the token was last used (null if never used)
   *
   * @example
   * const record = new RefreshTokenRecord(
   *   UUID.generate(),
   *   UserID.generate(),
   *   'a'.repeat(64),
   *   UUID.generate(),
   *   new Date('2026-03-08'),
   *   null,
   *   new Date('2026-03-01'),
   *   new Date('2026-03-01')
   * )
   */
  constructor(
    private readonly id: UUIDType,
    private readonly userId: UserIdType,
    private readonly tokenHash: string,
    private readonly tokenFamily: UUIDType,
    private readonly expiresAt: Date,
    private revokedAt: Date | null = null,
    private readonly createdAt: Date = new Date(),
    private readonly lastUsedAt: Date | null = null
  ) {}

  /**
   * Checks if the token has expired based on the current time.
   *
   * A token is considered expired if the current time is after the expiresAt timestamp.
   * Expired tokens cannot be used for authentication, even if not revoked.
   *
   * @returns `true` if the token has expired, `false` otherwise
   *
   * @example
   * if (token.isExpired()) {
   *   throw new Error('Token has expired')
   * }
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  /**
   * Checks if the token has been explicitly revoked.
   *
   * A token is revoked when the revokedAt timestamp is set to a non-null value.
   * Revoked tokens cannot be used for authentication, even if not expired.
   * Tokens are typically revoked on logout, password change, or security incidents.
   *
   * @returns `true` if the token has been revoked, `false` otherwise
   *
   * @example
   * if (token.isRevoked()) {
   *   throw new Error('Token has been revoked')
   * }
   */
  public isRevoked(): boolean {
    return this.revokedAt !== null
  }

  /**
   * Checks if the token is valid for use.
   *
   * A token is valid if and only if:
   * 1. It has not expired (current time ≤ expiresAt)
   * 2. It has not been revoked (revokedAt is null)
   *
   * This method combines both expiration and revocation checks.
   * Use this method to determine if a token can be accepted for authentication.
   *
   * @returns `true` if the token is valid (not expired AND not revoked), `false` otherwise
   *
   * @example
   * const record = await db.findByTokenHash(hash)
   * if (!record.isValid()) {
   *   throw new UnauthorizedException('Invalid refresh token')
   * }
   * // Proceed with token refresh
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked()
  }

  /**
   * Revokes the token by setting the revokedAt timestamp to the current time.
   *
   * Once revoked, the token becomes invalid and cannot be used for authentication.
   * This operation is idempotent - calling it multiple times will update the
   * revokedAt timestamp to the current time on each call.
   *
   * Common scenarios for revocation:
   * - User logs out
   * - User changes password
   * - Security incident (compromise detected)
   * - Token rotation (old token revoked when new one issued)
   * - Admin action (force logout)
   *
   * @example
   * // User logout
   * const token = await db.findByHash(hash)
   * token.revoke()
   * await db.save(token)
   *
   * @example
   * // Revoke all tokens for a user (security incident)
   * const tokens = await db.findAllByUserId(userId)
   * tokens.forEach(token => token.revoke())
   * await db.saveAll(tokens)
   */
  public revoke(): void {
    this.revokedAt = new Date()
  }
}
