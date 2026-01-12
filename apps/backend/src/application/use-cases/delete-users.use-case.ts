import type { LoggerPort } from '../ports/logger.port.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { AIServicePort } from '../ports/ai.port.js'

/**
 * Use case for deleting multiple users in a single batch operation.
 *
 * This use case orchestrates the deletion of multiple users by:
 * 1. Logging the deletion attempt
 * 2. Deleting users from the repository
 * 3. Creating an audit log entry with context information
 *
 * The audit logging is non-blocking - if it fails, the deletion is still
 * considered successful, but an error is logged.
 *
 * @example
 * ```typescript
 * const useCase = new DeleteUsersUseCase(userRepository, logger, auditLog);
 *
 * const userIds = [userId1, userId2, userId3];
 * const auditContext = {
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0'
 * };
 *
 * const result = await useCase.execute(userIds, auditContext);
 * console.log(result); // true
 * ```
 */
export class DeleteUsersUseCase {
  /**
   * Creates a new DeleteUsersUseCase instance.
   *
   * @param userRepository - Repository for persisting user data
   * @param logger - Logger for recording operational information and errors
   * @param auditLog - Audit log for tracking user deletion actions
   * @param aIService - AI service port for AI-related operations
   *
   * @param aIServicePort
   * @example
   * ```typescript
   * const useCase = new DeleteUsersUseCase(
   *   userRepository,
   *   logger,
   *   auditLog
   * );
   * ```
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aIService: AIServicePort
  ) {}

  /**
   * Executes the batch user deletion operation.
   *
   * This method performs the following steps:
   * 1. Logs the deletion attempt with user IDs
   * 2. Calls the repository to delete all specified users
   * 3. Creates an audit log entry with the deletion details and context
   * 4. Returns true to indicate successful completion
   *
   * If the repository deletion fails, the error is logged and re-thrown.
   * If audit logging fails, the error is logged but the operation is still
   * considered successful (non-blocking audit).
   *
   * @param userIds - Array of user IDs (UserIdType) to be deleted
   * @param auditContext - Contextual information for the audit log
   * @param auditContext.ipAddress - IP address from which the deletion was requested
   * @param auditContext.userAgent - User agent string from the request, or null if unavailable
   *
   * @returns Promise that resolves to true when the deletion is complete
   *
   * @throws {DatabaseException} If the repository deletion operation fails
   * @throws {Error} If any unexpected error occurs during deletion
   *
   * @example
   * ```typescript
   * // Delete multiple users
   * const userIds = [userId1, userId2, userId3];
   * const auditContext = {
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
   * };
   *
   * try {
   *   const result = await useCase.execute(userIds, auditContext);
   *   console.log('Users deleted:', result); // true
   * } catch (error) {
   *   console.error('Failed to delete users:', error);
   * }
   *
   * // Delete single user
   * const singleUserId = [userId];
   * await useCase.execute(singleUserId, auditContext);
   *
   * // Handle null user agent
   * const contextWithoutAgent = {
   *   ipAddress: '10.0.0.1',
   *   userAgent: null
   * };
   * await useCase.execute(userIds, contextWithoutAgent);
   *
   * // Empty array is valid (no-op)
   * await useCase.execute([], auditContext); // Returns true immediately
   * ```
   */
  async execute(
    userIds: UserIdType[],
    auditContext: { ipAddress: string; userAgent: string | null }
  ): Promise<boolean> {
    this.logger.info('Deleting users', { userIds })

    return Promise.all([
      this.userRepository.deleteUsers(userIds),
      this.aIService.deleteChatHistoryByUsers(userIds),
    ])
      .then(async () => {
        this.logger.info('Successfully deleted users', { userIds })
        try {
          await this.auditLog.log({
            userId: null,
            entityType: EntityType.USER,
            entityId: userIds.join(','),
            action: AuditAction.DELETE,
            changes: { reason: 'deleted_users' },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent ?? undefined,
          })
        } catch (error) {
          this.logger.error('Error logging audit for user deletion', error as Error, {
            userIds,
          })
        }
        return true
      })
      .catch((error) => {
        this.logger.error('Error deleting users', error as Error, { userIds })
        throw error
      })
  }
}
