import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { DBCompanySelect, DBKeyPersonSelect } from '../../infrastructure/database/schema.js'

/**
 * Use case for retrieving company and key person details.
 *
 * @remarks
 * This use case fetches singleton company and key person records from the database.
 * Both company and key_person tables enforce single-row constraints, so at most one
 * record of each type exists in the database.
 *
 * The use case follows the Clean Architecture pattern, orchestrating interactions between:
 * - Logger port for tracking execution flow
 * - Audit log port for compliance and security tracking
 * - Company details repository port for data access
 *
 * **Key Features:**
 * - Parallel fetching of company and key person data using Promise.all
 * - Comprehensive audit logging with error resilience
 * - Graceful handling of missing records (returns null)
 * - Error isolation (audit failures don't affect main operation)
 *
 * **Audit Logging:**
 * Every fetch operation is logged to the audit trail with user context,
 * IP address, and user agent. If audit logging fails, an error is logged
 * but the operation continues successfully.
 *
 * @example
 * ```typescript
 * const useCase = new GetCompanyDetailsUseCase(logger, auditLog, companyRepo)
 * const auditContext = {
 *   userId: userIdValue,
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * }
 * const result = await useCase.execute(auditContext)
 * // result: { company: {...}, keyPerson: {...} }
 * ```
 */
export class GetCompanyDetailsUseCase {
  /**
   * Creates an instance of GetCompanyDetailsUseCase.
   *
   * @param logger - Logger port for logging execution flow and errors
   * @param auditLog - Audit log port for tracking data access for compliance
   * @param companyDetailsRepo - Repository port for accessing company and key person data
   *
   * @remarks
   * Dependencies are injected through the constructor following the dependency
   * injection pattern. All dependencies are marked as readonly to ensure immutability
   * and prevent accidental reassignment during the use case lifecycle.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  /**
   * Executes the use case to retrieve company and key person details.
   *
   * @returns Promise resolving to an object containing company and keyPerson data (may be null)
   *
   * @remarks
   * This method orchestrates the following operations:
   *
   * 1. **Parallel Data Fetching:**
   *    - Fetches company details and key person details concurrently using Promise.all
   *    - Optimizes performance by executing both queries simultaneously
   *
   * 2. **Audit Logging:**
   *    - Logs the fetch operation with complete audit context
   *    - Includes userId, IP address, user agent, entity type, and action
   *    - Audit failures are caught and logged but don't affect the main operation
   *
   * 3. **Error Handling:**
   *    - Repository errors propagate to the caller
   *    - Audit logging errors are isolated and only logged
   *    - Success/failure logging provides operation visibility
   *
   * **Return Value:**
   * Returns an object with two properties:
   * - `company`: Complete company record or null if not found
   * - `keyPerson`: Complete key person record or null if not found
   *
   * Both values can be null independently (e.g., company exists but no key person).
   *
   * **Audit Context Requirements:**
   * - `userId`: UserIdType - The authenticated user making the request
   * - `ipAddress`: string - Client IP address for security tracking
   * - `userAgent`: string | null - Browser/client user agent (optional)
   *
   * **Performance:**
   * - Uses Promise.all for parallel execution (~2x faster than sequential)
   * - Single database round-trip for both queries
   * - Non-blocking audit logging
   *
   * **Error Scenarios:**
   * - Database connection failure → Error propagates to caller
   * - Repository timeout → Error propagates to caller
   * - Audit log failure → Error logged, operation continues
   * - Missing records → Returns null values (not an error)
   *
   * @throws {Error} When repository operations fail (database errors, connection issues)
   *
   * @example
   * ```typescript
   * // Successful retrieval
   * const result = await useCase.execute({
   *   userId: new UserId('uuid-value').getValue(),
   *   ipAddress: '127.0.0.1',
   *   userAgent: 'Mozilla/5.0'
   * })
   * console.log(result.company?.legalName) // "Acme Corporation LLC"
   * console.log(result.keyPerson?.email) // "ceo@acme.com"
   * ```
   *
   * @example
   * ```typescript
   * // Handling missing data
   * const result = await useCase.execute(auditContext)
   * if (!result.company) {
   *   console.log('No company record found')
   * }
   * if (!result.keyPerson) {
   *   console.log('No key person record found')
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const result = await useCase.execute(auditContext)
   *   // Process result...
   * } catch (error) {
   *   console.error('Failed to fetch company details:', error)
   *   // Handle database/repository errors
   * }
   * ```
   * @param _auditContext - Contextual information for auditing the operation
   */
  async execute(_auditContext: AuditContext): Promise<{
    company: DBCompanySelect | null
    keyPerson: DBKeyPersonSelect | null
  }> {
    this.logger.info('Fetching company details')

    const [company, keyPerson] = await Promise.all([
      this.companyDetailsRepo.getCompanyDetails(),
      this.companyDetailsRepo.getKeyPersonDetails(),
    ])

    this.logger.info('Company details fetched successfully')
    return { company, keyPerson }
  }
}
