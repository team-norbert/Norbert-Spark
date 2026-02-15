import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { User } from '../../domain/entities/user.js'

/**
 * Use case for retrieving a single user by their unique ID
 *
 * This use case handles the business logic for fetching a specific user from the repository.
 * It provides proper logging for both successful retrievals and cases where the user is not found.
 *
 * Key features:
 * - Retrieves user entity by unique identifier
 * - Logs execution and outcome for audit/debugging purposes
 * - Returns null when user is not found (no exceptions thrown)
 * - Accepts audit context for future audit logging capabilities
 *
 * @class GetUserByIdUseCase
 * @example
 * ```typescript
 * const useCase = new GetUserByIdUseCase(
 *   userRepository,
 *   logger,
 *   auditLog
 * )
 * const user = await useCase.execute(userId, auditContext)
 * if (user) {
 *   console.log('User found:', user.getName())
 * } else {
 *   console.log('User not found')
 * }
 * ```
 */
export class GetUserByIdUseCase {
  /**
   * Creates an instance of GetUserByIdUseCase
   * @param {UserRepositoryPort} userRepository - Repository for accessing user data
   * @param {LoggerPort} logger - Logger for tracking operations and debugging
   * @param {AuditLogPort} auditLog - Service for recording audit logs (future use)
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  /**
   * Executes the get user by ID use case
   *
   * Retrieves a user entity from the repository using their unique identifier.
   * The method logs the execution start and outcome for debugging and monitoring purposes.
   *
   * Process flow:
   * 1. Log the execution with the requested user ID
   * 2. Query the repository for the user
   * 3. If user not found, log a warning and return null
   * 4. If user found, return the user entity
   *
   * @param {UserIdType} userId - The unique identifier of the user to retrieve (UUIDv7 branded type)
   * @param {AuditContext} _auditContext - Context information for audit logging (currently unused, prefixed with underscore)
   * @returns {Promise<User | null>} The user entity if found, null otherwise
   * @throws {Error} If the repository operation fails (database errors are propagated)
   * @example
   * ```typescript
   * // Retrieve a user by ID
   * const userId = new UserId('01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a').getValue()
   * const auditContext = {
   *   userId: requestingUserId,
   *   ipAddress: '192.168.1.100',
   *   userAgent: 'Mozilla/5.0'
   * }
   *
   * try {
   *   const user = await useCase.execute(userId, auditContext)
   *   if (user) {
   *     console.log('User email:', user.getEmail())
   *     console.log('User role:', user.getRole())
   *   } else {
   *     console.log('User not found')
   *   }
   * } catch (error) {
   *   console.error('Failed to retrieve user:', error)
   * }
   * ```
   */
  async execute(userId: UserIdType, _auditContext: AuditContext): Promise<User | null> {
    this.logger.info(`Executing GetUserByIdUseCase for userId: ${userId}`)

    const user = await this.userRepository.findById(userId)

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found`)
      return null
    }

    return user
  }
}
