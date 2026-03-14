import { hasChangesObject, redactSensitiveData } from '@norberts-spark/shared'

/**
 * Redacts sensitive data from audit log entry changes
 *
 * This is a convenience wrapper specifically for audit log entries
 * that applies redaction to the 'changes' field while preserving
 * other audit metadata (action, entityType, etc.)
 *
 * @param entry - The audit log entry with potential sensitive data
 * @returns A new entry with redacted changes
 *
 * @example
 * ```typescript
 * const entry = {
 *   userId: 'user-123',
 *   action: 'UPDATE',
 *   changes: {
 *     before: { email: 'old@example.com', password: 'oldpass' },
 *     after: { email: 'new@example.com', password: 'newpass' }
 *   }
 * }
 *
 * const redacted = redactAuditLogEntry(entry)
 * // changes.before.password and changes.after.password will be '[REDACTED]'
 * ```
 */
export function redactAuditLogEntry<T extends Record<string, unknown>>(entry: T): T {
  if (!hasChangesObject(entry) || !entry.changes) {
    return entry
  }

  return {
    ...entry,
    changes: redactSensitiveData(entry.changes) as Record<string, unknown>,
  }
}

/**
 * Type-safe wrapper for redacting CreateAuditLogDTO entries
 *
 * This function provides a type-safe way to redact sensitive data from
 * CreateAuditLogDTO objects without requiring type casting.
 *
 * @param entry - The CreateAuditLogDTO entry to redact
 * @returns A new CreateAuditLogDTO with redacted changes
 */
export function redactCreateAuditLogDTO<T extends { changes?: unknown }>(entry: T): T {
  // If no changes field exists or it's nullish, return entry as-is
  if (!entry.changes) {
    return entry
  }

  // Redact the changes object
  const redactedChanges = redactSensitiveData(entry.changes)

  // Return new object with redacted changes
  return {
    ...entry,
    changes: redactedChanges,
  }
}
