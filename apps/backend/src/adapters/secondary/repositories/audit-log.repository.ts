import { and, desc, eq } from 'drizzle-orm'

import type { AuditLogPort, CreateAuditLogDTO } from '../../../application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { AuditLog } from '../../../domain/audit/audit-log.entity.js'
import { AuditAction, EntityType } from '../../../domain/audit/entity-type.enum.js'
import { redactCreateAuditLogDTO } from '../../../domain/audit/redact-sensitive-data.js'
import { db } from '../../../infrastructure/database/index.js'
import { auditLog, type DBAuditLogSelect } from '../../../infrastructure/database/schema.js'

/**
 * Secondary adapter — Drizzle ORM repository for audit log persistence.
 *
 * Implements {@link AuditLogPort} and is the single source of truth for
 * writing and querying the `audit_log` table. Sensitive fields are redacted
 * via {@link redactCreateAuditLogDTO} before any data reaches the database.
 *
 * **Design contract**: write operations ({@link log}) are fire-and-forget —
 * they never throw so that audit logging failures cannot disrupt business
 * operations. Read operations propagate errors to the caller.
 *
 * **Table touched:** `audit_log`
 */
export class AuditLogRepository implements AuditLogPort {
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Persists a single audit log entry.
   *
   * Sensitive fields in `entry` are redacted via
   * {@link redactCreateAuditLogDTO} before the row is inserted, ensuring
   * PII and secrets never reach the database.
   *
   * **Never throws.** Any database or serialisation error is swallowed and
   * logged at `error` level so that audit logging failures cannot disrupt
   * business operations.
   *
   * @param entry - The audit event to record. Fields such as `userId`,
   *   `entityId`, `changes`, `ipAddress`, and `userAgent` are optional.
   * @returns A promise that always resolves (never rejects).
   *
   * @example
   * await auditLogRepo.log({
   *   entityType: EntityType.User,
   *   entityId: userId,
   *   action: AuditAction.Create,
   *   userId,
   *   ipAddress: request.ip,
   *   userAgent: request.headers['user-agent'],
   * })
   */
  async log(entry: CreateAuditLogDTO): Promise<void> {
    try {
      // Redact sensitive data before storing in database
      const redactedEntry = redactCreateAuditLogDTO(entry)

      await db.insert(auditLog).values({
        userId: redactedEntry.userId ?? null,
        entityType: redactedEntry.entityType,
        entityId: redactedEntry.entityId ?? null,
        action: redactedEntry.action,
        changes: redactedEntry.changes ?? null,
        ipAddress: redactedEntry.ipAddress ?? null,
        userAgent: redactedEntry.userAgent ?? null,
      })

      this.logger.info('Audit log entry created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
    } catch (error) {
      this.logger.error('Failed to create audit log entry', error as Error, { entry })
      // Don't throw - audit logging should not break business operations
    }
  }

  /**
   * Retrieves all audit log entries for a specific entity.
   *
   * Queries the `audit_log` table filtered by both `entityType` and
   * `entityId`, ordered by `createdAt` descending (most recent first).
   *
   * @param entityType - The type of the entity to filter by (e.g.
   *   `EntityType.User`, `EntityType.Chat`).
   * @param entityId - The UUID of the entity to filter by.
   * @returns A promise that resolves to an array of {@link AuditLog} domain
   *   entities. Returns an empty array if no entries exist for the entity.
   *
   * @example
   * const logs = await repo.getByEntity(EntityType.User, userId)
   * // logs[0].action === AuditAction.Update
   */
  async getByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId)))
      .orderBy(desc(auditLog.createdAt))

    return results.map(this.mapToEntity)
  }

  /**
   * Retrieves audit log entries attributed to a specific user.
   *
   * Queries the `audit_log` table filtered by `userId`, ordered by
   * `createdAt` descending (most recent first), and capped at `limit` rows.
   *
   * @param userId - The ID of the user whose audit trail to retrieve.
   * @param limit - Maximum number of rows to return. Defaults to `100`.
   * @returns A promise that resolves to an array of {@link AuditLog} domain
   *   entities. Returns an empty array if no entries exist for the user.
   *
   * @example
   * const logs = await repo.getByUser(userId, 50)
   */
  async getByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)

    return results.map(this.mapToEntity)
  }

  /**
   * Retrieves audit log entries for a specific action type.
   *
   * Queries the `audit_log` table filtered by `action`, ordered by
   * `createdAt` descending (most recent first), and capped at `limit` rows.
   *
   * @param action - The action type to filter by (e.g. `AuditAction.Create`,
   *   `AuditAction.Delete`).
   * @param limit - Maximum number of rows to return. Defaults to `100`.
   * @returns A promise that resolves to an array of {@link AuditLog} domain
   *   entities. Returns an empty array if no entries match.
   *
   * @example
   * const deletions = await repo.getByAction(AuditAction.Delete, 25)
   */
  async getByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, action))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)

    return results.map(this.mapToEntity)
  }

  /**
   * Maps a raw Drizzle `audit_log` select row to an {@link AuditLog} domain entity.
   *
   * @param row - A raw database row as inferred by Drizzle (`DBAuditLogSelect`).
   * @returns A fully constructed {@link AuditLog} entity.
   */
  private mapToEntity(row: DBAuditLogSelect): AuditLog {
    return new AuditLog(
      row.id,
      row.userId,
      row.entityType as EntityType,
      row.entityId,
      row.action as AuditAction,
      row.changes as Record<string, any> | null,
      row.ipAddress,
      row.userAgent,
      row.createdAt
    )
  }
}
