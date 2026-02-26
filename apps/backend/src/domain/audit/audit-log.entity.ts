import type { AuditChanges } from './audit-changes.types.js'
import { AuditAction, EntityType } from './entity-type.enum.js'

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly entityType: EntityType,
    public readonly entityId: string | null,
    public readonly action: AuditAction,
    public readonly changes: AuditChanges | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date
  ) {}
}
