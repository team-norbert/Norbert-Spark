import type { AuditChanges } from '../../domain/audit/audit-changes.types.js'
import { AuditLog } from '../../domain/audit/audit-log.entity.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'

export interface AuditLogPort {
  /**
   * Create an audit log entry.
   *
   * IMPORTANT: Implementations MUST NOT throw errors. Audit logging failures should be logged
   * internally but never propagate to callers. This ensures that business operations are never
   * blocked by audit logging issues.
   *
   * @param entry - The audit log entry to create
   * @returns A promise that always resolves successfully
   */
  log(entry: CreateAuditLogDTO): Promise<void>

  /**
   * Query audit logs for a specific entity
   */
  getByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]>

  /**
   * Query audit logs for a specific user
   */
  getByUser(userId: string, limit?: number): Promise<AuditLog[]>

  /**
   * Query audit logs by action type
   */
  getByAction(action: AuditAction, limit?: number): Promise<AuditLog[]>
}

export interface CreateAuditLogDTO {
  userId: string | null
  entityType: EntityType
  entityId: string | null | UUIDType
  action: AuditAction
  changes?: AuditChanges
  ipAddress?: string | null
  userAgent?: string
}
