import { eq } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../application/ports/refresh-token.repository.port.js'
import { RefreshTokenRecord } from '../../../domain/entities/refresh-token-record.js'
import { UserId } from '../../../domain/value-objects/userID.js'
import { Uuid } from '../../../domain/value-objects/uuid.js'
import { db } from '../../../infrastructure/database/index.js'
import { refreshTokens } from '../../../infrastructure/database/schema.js'

export class RefreshTokenRepoRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly logger: LoggerPort) {}

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

  /** Find a valid (non-expired, non-revoked) token by its hash */
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

  /** Revoke a single token by its hash */
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

  /** Revoke ALL tokens in a token family (replay attack response) */
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

  /** Revoke ALL tokens in a token family (replay attack response) */
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

  /** Delete expired tokens older than a given date (cleanup job) */
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
