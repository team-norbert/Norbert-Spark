import type { UserIdType } from '../value-objects/userID.js'

/**
 * Represents audit context for tracking who performed an action and where it originated.
 *
 * This type captures essential information about the actor and source of an operation
 * for security auditing, compliance, and debugging purposes. It's used across all
 * use cases to maintain a consistent audit trail.
 *
 * @example
 * ```typescript
 * // Authenticated user action
 * const auditContext: AuditContext = {
 *   userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 * }
 *
 * // Unauthenticated action (registration, login)
 * const auditContext: AuditContext = {
 *   userId: null,
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 * }
 * ```
 *
 * @property {UserIdType | null} userId - The authenticated user performing the action.
 *   - **null**: For unauthenticated actions (user registration, login attempts, password reset requests)
 *   - **UserIdType**: For authenticated actions (profile updates, data deletion, admin operations)
 *   This represents the *actor* performing the action, not necessarily the target of the action.
 *
 * @property {string} ipAddress - Source IP address of the request.
 *   Used for security monitoring, rate limiting, and fraud detection.
 *   Should be extracted from request headers (X-Forwarded-For, X-Real-IP) or connection IP.
 *
 * @property {string | null} userAgent - Browser/client identifier from User-Agent header.
 *   - **null**: When User-Agent header is not provided (API clients, automated requests)
 *   - **string**: Full User-Agent string for tracking client type and version
 *   Useful for detecting suspicious patterns and debugging client-specific issues.
 *
 * @see {@link AuditLogPort} for how this context is used in audit logging
 * @see {@link AuditAction} for the types of actions that can be audited
 */
export type AuditContext = {
  readonly userId: UserIdType | null
  readonly ipAddress: string
  readonly userAgent: string | null
}
