import { eq } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../application/ports/refresh-token.repository.port.js'
import { RefreshTokenRecord } from '../../../domain/entities/refresh-token-record.js'
import { UserId } from '../../../domain/value-objects/userID.js'
import { Uuid } from '../../../domain/value-objects/uuid.js'
import { db } from '../../../infrastructure/database/index.js'
import { refreshTokens } from '../../../infrastructure/database/schema.js'

/**
 * Repository implementation for refresh token persistence using PostgreSQL.
 *
 * Handles CRUD operations for refresh tokens with security-focused design:
 * - Stores only SHA-256 hashes, never raw tokens
 * - Supports token family tracking for rotation security
 * - Enables replay attack detection via family-wide revocation
 * - Maps database rows to domain entities (RefreshTokenRecord)
 *
 * Database schema features:
 * - Unique constraint on tokenHash (prevents duplicates)
 * - Foreign key to users table with CASCADE delete
 * - Indexes on userId, tokenFamily, and expiresAt for performance
 * - Audit fields: ipAddress, userAgent, createdAt, lastUsedAt
 *
 * @implements {RefreshTokenRepositoryPort}
 */
export class RefreshTokenRepoRepository implements RefreshTokenRepositoryPort {
  /**
   * Creates a new RefreshTokenRepoRepository.
   *
   * @param logger - Logger for tracking database operations and errors
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Inserts a new refresh token record into the database.
   *
   * Stores the SHA-256 hash of the token (never the raw token) along with:
   * - Token family UUID for rotation tracking
   * - Expiration timestamp (typically 7 days from creation)
   * - Optional audit context (IP address, user agent)
   *
   * Database automatically sets:
   * - id: UUIDv7 primary key
   * - createdAt: Current timestamp
   * - revokedAt: NULL (token starts active)
   * - lastUsedAt: NULL (updated on first use)
   *
   * @param record - Token data to insert
   * @param record.userId - UUID of user who owns this token
   * @param record.tokenHash - SHA-256 hash of the 64-character hex token (never store raw token)
   * @param record.tokenFamily - UUID identifying the token family for rotation tracking
   * @param record.expiresAt - Expiration timestamp (tokens cannot be refreshed after this)
   * @param record.ipAddress - Optional IP address where token was created (for security auditing)
   * @param record.userAgent - Optional user agent string where token was created (for security auditing)
   * @returns Promise that resolves when insert completes
   *
   * @throws {DatabaseException} If insert fails (e.g., duplicate tokenHash, invalid userId FK)
   *
   * @example
   * ```typescript
   * await repo.create({
   *   userId: '01234567-89ab-cdef-0123-456789abcdef',
   *   tokenHash: 'a1b2c3...', // SHA-256 hash
   *   tokenFamily: '89abcdef-0123-4567-89ab-cdef01234567',
   *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...'
   * })
   * ```
   */
  async create(record: {
    userId: string
    tokenHash: string
    tokenFamily: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    this.logger.info('Creating refresh token record', { record })
    try {
      await db.insert(refreshTokens).values({
        userId: record.userId,
        tokenHash: record.tokenHash,
        tokenFamily: record.tokenFamily,
        expiresAt: record.expiresAt,
        ipAddress: record.ipAddress ?? null,
        userAgent: record.userAgent ?? null,
      })
      this.logger.debug('Successfully created refresh token record', {
        tokenFamily: record.tokenFamily,
        userId: record.userId,
      })
    } catch (error) {
      this.logger.error(
        'Failed to create refresh token record',
        error instanceof Error ? error : new Error(String(error)),
        { record }
      )
      throw error
    }
  }

  /**
   * Finds a refresh token record by its SHA-256 hash.
   *
   * Queries the database for a token matching the provided hash and returns
   * a domain entity (RefreshTokenRecord) if found. The entity includes methods
   * to check if the token is expired, revoked, or valid.
   *
   * Note: This method returns the record regardless of its status. Callers must
   * check isExpired(), isRevoked(), and isValid() to determine usability.
   *
   * Database query:
   * - SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1
   * - Uses unique index on tokenHash for O(1) lookup
   *
   * @param tokenHash - SHA-256 hash of the refresh token (64-character hex string)
   * @returns Promise resolving to RefreshTokenRecord entity if found, null if not found
   *
   * @throws {DatabaseException} If database query fails
   *
   * @example
   * ```typescript
   * const token = RefreshToken.fromRaw(clientToken) // Validates and hashes
   * const record = await repo.findByHash(token.getHash())
   *
   * if (!record) {
   *   throw new UnauthorizedException('Token not found')
   * }
   * if (record.isRevoked()) {
   *   // Replay attack detected!
   *   await repo.revokeFamily(record.getTokenFamily())
   * }
   * if (record.isExpired()) {
   *   throw new UnauthorizedException('Token expired')
   * }
   * // Token is valid, proceed with refresh
   * ```
   */
  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    this.logger.info('Finding refresh token by hash', { tokenHash })

    try {
      const [row] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1)

      if (!row) {
        this.logger.debug('No refresh token found with hash', { tokenHash })
        return null
      }

      // Map database row to domain entity
      const record = new RefreshTokenRecord(
        new Uuid(row.id).getValue(),
        new UserId(row.userId).getValue(),
        row.tokenHash,
        new Uuid(row.tokenFamily).getValue(),
        row.expiresAt,
        row.revokedAt,
        row.createdAt,
        row.lastUsedAt
      )

      this.logger.debug('Found refresh token', {
        tokenHash,
        isExpired: record.isExpired(),
        isRevoked: record.isRevoked(),
        isValid: record.isValid(),
      })

      return record
    } catch (error) {
      this.logger.error(
        'Failed to find refresh token by hash',
        error instanceof Error ? error : new Error(String(error)),
        { tokenHash }
      )
      throw error
    }
  }

  /**
   * Revokes a single refresh token by setting its revokedAt timestamp.
   *
   * Marks the token as revoked by updating the revokedAt field to the current
   * timestamp. Revoked tokens cannot be used for refreshing and will trigger
   * replay attack detection if reused.
   *
   * This operation is idempotent - revoking an already-revoked token has no effect.
   *
   * Database operation:
   * - UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?
   * - Returns rowCount indicating number of rows affected (0 or 1)
   *
   * Use cases:
   * - Normal token rotation: revoke old token after issuing new one
   * - User logout: revoke current refresh token
   * - Security event: revoke specific compromised token
   *
   * @param tokenHash - SHA-256 hash of the token to revoke
   * @returns Promise that resolves when update completes (even if token not found)
   *
   * @throws {DatabaseException} If database update fails
   *
   * @example
   * ```typescript
   * // After generating new token pair during refresh
   * await repo.revokeByHash(oldTokenHash)
   * await repo.create({ ...newTokenData })
   * ```
   */
  async revokeByHash(tokenHash: string): Promise<void> {
    this.logger.info('Revoking refresh token by hash', { tokenHash })
    try {
      const result = await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash))

      this.logger.debug('Revoked refresh token by hash', {
        tokenHash,
        rowsAffected: result.rowCount,
      })
    } catch (error) {
      this.logger.error(
        'Failed to revoke refresh token by hash',
        error instanceof Error ? error : new Error(String(error)),
        { tokenHash }
      )
      throw error
    }
  }

  /**
   * Revokes all tokens in a token family (replay attack response).
   *
   * When a revoked token is reused (replay attack detected), this method revokes
   * ALL tokens sharing the same tokenFamily UUID. This prevents attackers from
   * using any tokens in the rotation chain if one is compromised.
   *
   * Token family concept:
   * - All tokens generated through rotation share the same tokenFamily UUID
   * - Original token has tokenFamily = its own UUID
   * - Each refresh generates new token with SAME tokenFamily
   * - If any token is reused after revocation, entire family is revoked
   *
   * Database operation:
   * - UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_family = ?
   * - Returns rowCount indicating number of tokens revoked
   *
   * Critical security feature:
   * - Prevents token theft exploitation
   * - Forces legitimate user to re-authenticate
   * - Audit logs should track family revocations
   *
   * @param tokenFamily - UUID of the token family to revoke
   * @returns Promise that resolves when all tokens in family are revoked
   *
   * @throws {DatabaseException} If database update fails
   *
   * @example
   * ```typescript
   * // In use case when replay attack detected
   * const record = await repo.findByHash(tokenHash)
   * if (record.isRevoked()) {
   *   // Replay attack! Revoke entire family
   *   await repo.revokeFamily(record.getTokenFamily())
   *   await auditLog.log({ reason: 'REPLAY_ATTACK_DETECTED' })
   *   throw new UnauthorizedException('Token has been revoked')
   * }
   * ```
   */
  async revokeFamily(tokenFamily: string): Promise<void> {
    this.logger.info('Revoking refresh token family', { tokenFamily })
    try {
      const result = await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenFamily, tokenFamily))

      this.logger.info('Revoked all tokens in family', {
        tokenFamily,
        rowsAffected: result.rowCount,
      })
    } catch (error) {
      this.logger.error(
        'Failed to revoke refresh token family',
        error instanceof Error ? error : new Error(String(error)),
        { tokenFamily }
      )
      throw error
    }
  }

  /**
   * Revokes all refresh tokens belonging to a specific user.
   *
   * Sets revokedAt timestamp for all refresh tokens associated with the given
   * user ID, effectively logging them out from all devices/sessions.
   *
   * Use cases:
   * - User-initiated "log out from all devices"
   * - Admin action to force user logout
   * - Security response to account compromise
   * - Password change (force re-authentication)
   * - Account deletion cleanup
   *
   * Database operation (when implemented):
   * - UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?
   * - Uses userId index for efficient batch update
   *
   * @param userId - UUID of the user whose tokens should be revoked
   * @returns Promise that resolves when all user tokens are revoked
   *
   * @throws {DatabaseException} If database update fails
   *
   * @example
   * ```typescript
   * // User requests to log out from all devices
   * await repo.revokeAllForUser(userId)
   * await auditLog.log({
   *   userId,
   *   action: 'LOGOUT_ALL_DEVICES',
   *   reason: 'user_requested'
   * })
   * ```
   *
   * @remarks
   * Currently a placeholder implementation that returns immediately.
   * TODO: Implement database UPDATE query to revoke all tokens for user.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    this.logger.info('Revoking all refresh tokens for user', { userId })
    try {
      // placeholder implementation - in a real implementation, this would update the database to set revokedAt for all tokens belonging to the user
      return Promise.resolve()
    } catch (error) {
      this.logger.error(
        'Failed to revoke all refresh tokens for user',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      )
      throw error
    }
  }

  /**
   * Deletes expired refresh tokens older than a specified date (cleanup job).
   *
   * Permanently removes expired token records from the database to:
   * - Reduce database size and improve query performance
   * - Comply with data retention policies
   * - Remove obsolete tokens that can never be used
   *
   * Recommended cleanup strategy:
   * - Run as scheduled job (e.g., daily at 3 AM)
   * - Delete tokens expired for >30 days (grace period for clock skew)
   * - Monitor deletion counts for anomalies
   *
   * Database operation (when implemented):
   * - DELETE FROM refresh_tokens WHERE expires_at < ? AND revoked_at IS NULL
   * - Uses partial index on expiresAt for efficient cleanup
   * - Returns count of deleted rows
   *
   * @param date - Cutoff date; tokens expiring before this date will be deleted
   * @returns Promise resolving to number of tokens deleted
   *
   * @throws {DatabaseException} If database delete fails
   *
   * @example
   * ```typescript
   * // Daily cleanup job - delete tokens expired >30 days ago
   * const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
   * const deletedCount = await repo.deleteExpiredBefore(cutoffDate)
   * logger.info(`Cleaned up ${deletedCount} expired refresh tokens`)
   * ```
   *
   * @remarks
   * Currently a placeholder implementation that returns 0.
   * TODO: Implement database DELETE query with expiresAt < date condition.
   */
  async deleteExpiredBefore(date: Date): Promise<number> {
    this.logger.info('Deleting expired refresh tokens before date', { date })
    try {
      // placeholder implementation - in a real implementation, this would delete rows from the database where expiresAt < date and return the number of rows deleted
      return Promise.resolve(0)
    } catch (error) {
      this.logger.error(
        'Failed to delete expired refresh tokens',
        error instanceof Error ? error : new Error(String(error)),
        { date }
      )
      throw error
    }
  }
}
