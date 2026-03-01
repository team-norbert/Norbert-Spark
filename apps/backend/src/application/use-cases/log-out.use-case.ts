import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port.js'

/**
 * Use case for logging out a user by revoking all their refresh tokens.
 *
 * This use case implements a "log out from all devices" pattern by invalidating
 * all refresh tokens associated with a user. Once executed, the user will need
 * to re-authenticate on all devices/sessions to obtain new tokens.
 *
 * Key features:
 * - Revokes ALL refresh tokens for the user (not just current session)
 * - Creates audit log entry for security tracking
 * - Distinguishes between successful logout and error scenarios in audit log
 * - Re-throws errors after logging/auditing so callers can return an error status
 *
 * Security implications:
 * - Immediately terminates all user sessions across all devices
 * - Useful for security responses (compromised account, password change)
 * - Audit trail maintained even if revocation fails
 *
 * @example
 * ```typescript
 * const logOutUseCase = new LogOutUseCase(logger, auditLog, refreshTokenRepo)
 *
 * // User-initiated logout from all devices
 * await logOutUseCase.execute(userId, {
 *   userId: userId,
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Admin-initiated logout (security response)
 * await logOutUseCase.execute(suspiciousUserId, {
 *   userId: adminUserId, // Who performed the action
 *   ipAddress: adminIpAddress,
 *   userAgent: adminUserAgent
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Password change - force re-authentication
 * await userService.changePassword(userId, newPassword)
 * await logOutUseCase.execute(userId, auditContext)
 * // User must log in again with new password
 * ```
 */
export class LogOutUseCase {
  /**
   * Creates a new LogOutUseCase instance.
   *
   * @param logger - Logger for recording use case execution and errors
   * @param auditLog - Audit log for security tracking of logout events
   * @param refreshTokenRepo - Repository for managing refresh tokens
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort
  ) {}

  /**
   * Executes the logout operation by revoking all refresh tokens for a user.
   *
   * This method performs the following steps:
   * 1. Logs the logout attempt
   * 2. Revokes all refresh tokens for the user via repository
   * 3. Creates an audit log entry with appropriate reason
   *
   * Important notes:
   * - Uses `auditContext.userId` (not the `userId` parameter) for token revocation
   * - Audit log is created regardless of success or failure
   * - On success: audit reason is 'user_logout'
   * - On error: audit reason is 'user_logout_error'
   * - Errors during audit logging can propagate (audit log may throw)
   *
   * Audit log entry includes:
   * - userId from audit context (who performed the action)
   * - entityType: USER (the entity being logged out)
   * - entityId: userId (stable identifier for querying audit logs per user)
   * - action: USER_LOGOUT
   * - changes.reason: 'user_logout' or 'user_logout_error'
   * - ipAddress and userAgent from audit context
   *
   * @param userId - UUID of the user being logged out (for logging purposes)
   * @param auditContext - Context information for audit trail
   * @param auditContext.userId - UUID of the user whose tokens are revoked
   * @param auditContext.ipAddress - IP address where logout was initiated
   * @param auditContext.userAgent - User agent string of the client
   *
   * @returns Promise that resolves when logout completes successfully
   *
   * @throws Re-throws any error thrown by {@link RefreshTokenRepositoryPort.revokeAllForUser}.
   * @throws May throw if audit log fails (audit log can reject promises)
   *
   * @example
   * ```typescript
   * // Standard user logout
   * await logOutUseCase.execute(userId, {
   *   userId: userId,
   *   ipAddress: req.ip,
   *   userAgent: req.headers['user-agent']
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Handle potential errors
   * try {
   *   await logOutUseCase.execute(userId, auditContext)
   *   return { success: true, message: 'Logged out from all devices' }
   * } catch (error) {
   *   // Audit log failure or other error
   *   logger.error('Logout failed', error)
   *   return { success: false, message: 'Logout failed' }
   * }
   * ```
   */
  async execute(userId: UserIdType, auditContext: AuditContext): Promise<void> {
    this.logger.info(`Executing LogOutUseCase for user ID: ${userId}`)

    try {
      await this.refreshTokenRepo.revokeAllForUser(userId)

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.USER,
        entityId: userId,
        action: AuditAction.USER_LOGOUT,
        changes: {
          reason: 'user_logout',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    } catch (error) {
      this.logger.error(
        `Error executing LogOutUseCase for user ID: ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      )

      const auditEntry: CreateAuditLogDTO = {
        userId: auditContext.userId,
        entityType: EntityType.USER,
        entityId: userId,
        action: AuditAction.USER_LOGOUT,
        changes: {
          reason: 'user_logout_error',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)

      throw error
    }
  }
}
