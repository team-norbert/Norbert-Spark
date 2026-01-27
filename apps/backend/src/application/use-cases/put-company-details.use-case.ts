import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { CompanyUpdate, KeyPersonUpdate } from '../dtos/update-company.dto.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { Uuid } from '../../domain/value-objects/uuid.js'

/**
 * Data structure for updating company and/or key person details.
 *
 * @remarks
 * This type allows partial updates where either company, key person, or both can be updated
 * in a single operation. All fields within company and keyPerson are optional, enabling
 * granular updates of specific properties.
 *
 * @property company - Optional partial company data to update
 * @property keyPerson - Optional partial key person data to update
 */
export type UpdateCompanyDetailsData = {
  company?: CompanyUpdate
  keyPerson?: KeyPersonUpdate
}

/**
 * Use case for updating company and key person details.
 *
 * @remarks
 * This use case handles the business logic for updating singleton company and/or key person
 * records in the database. It supports partial updates, automatic audit logging, and graceful
 * error handling for audit failures.
 *
 * **Key Features:**
 * - Supports updating company details, key person details, or both in a single operation
 * - Performs partial updates (only provided fields are modified)
 * - Automatically logs successful updates to the audit log
 * - Gracefully handles audit logging failures without affecting the update operation
 * - Returns the updated records for both company and key person
 *
 * **Audit Logging:**
 * - Company updates are logged with EntityType.COMPANY
 * - Key person updates are logged with EntityType.KEY_PERSON
 * - Both use AuditAction.UPDATE
 * - Audit logging failures are logged but don't fail the operation
 *
 * **Update Behavior:**
 * - If only `data.company` is provided, only company is updated
 * - If only `data.keyPerson` is provided, only key person is updated
 * - If both are provided, both are updated
 * - If neither is provided, no updates occur
 *
 * **Singleton Enforcement:**
 * Both company and key_person tables are singleton tables enforced by database constraints.
 * Updates automatically target the single record in each table.
 *
 * @example
 * ```typescript
 * const useCase = new PutCompanyDetailsUseCase(logger, auditLog, repository)
 * const auditContext = {
 *   userId: 'user-123',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * }
 *
 * // Update only company
 * const result = await useCase.execute(auditContext, {
 *   company: {
 *     companyId: 'company-uuid',
 *     legalName: 'New Company LLC',
 *     status: 'active'
 *   }
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Update both company and key person
 * const result = await useCase.execute(auditContext, {
 *   company: {
 *     companyId: 'company-uuid',
 *     displayName: 'Updated Display Name'
 *   },
 *   keyPerson: {
 *     keyPersonId: 'person-uuid',
 *     email: 'newemail@example.com',
 *     isActive: true
 *   }
 * })
 * ```
 */
export class PutCompanyDetailsUseCase {
  /**
   * Creates an instance of PutCompanyDetailsUseCase.
   *
   * @param logger - Logger port for tracking operations and errors
   * @param auditLog - Audit log port for recording update activities
   * @param companyDetailsRepo - Repository port for company and key person data access
   *
   * @remarks
   * All dependencies are injected via constructor following the dependency injection pattern.
   * This enables testability and adherence to hexagonal architecture principles.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  /**
   * Executes the company and/or key person details update operation.
   *
   * @param auditContext - Context containing user ID, IP address, and user agent for audit logging
   * @param data - Update data containing optional company and/or key person partial updates
   * @returns Promise resolving to an object with updated company and keyPerson records (or undefined if not updated)
   *
   * @remarks
   * This method orchestrates the update process for company and/or key person details.
   * It performs the following operations:
   *
   * **Update Flow:**
   * 1. If `data.company` is provided, updates company details via repository
   * 2. If `data.keyPerson` is provided, updates key person details via repository
   * 3. For each successful update, logs an audit entry with the update details
   * 4. Returns both results (company and keyPerson) regardless of which was updated
   *
   * **Audit Logging Details:**
   * - Company audit: EntityType.COMPANY, entityId from companyId
   * - Key person audit: EntityType.KEY_PERSON, entityId from keyPersonId
   * - Both use AuditAction.UPDATE
   * - Includes userId, ipAddress, userAgent from auditContext
   * - Changes include reason: 'company_details_updated_successfully' or 'key_person_details_updated_successfully'
   *
   * **Error Handling:**
   * - Repository errors propagate to the caller (not caught)
   * - Audit logging errors are caught, logged, and don't fail the operation
   * - This ensures updates succeed even if audit logging fails
   *
   * **Return Value Structure:**
   * ```typescript
   * {
   *   company: DBCompanySelect | null | undefined,  // Updated company or null/undefined if not updated/failed
   *   keyPerson: DBKeyPersonSelect | null | undefined  // Updated key person or null/undefined if not updated/failed
   * }
   * ```
   *
   * **Null vs Undefined Returns:**
   * - `undefined`: The entity was not included in the update data
   * - `null`: The entity was included but the update returned null (no record found)
   * - `DBCompanySelect | DBKeyPersonSelect`: The update succeeded and returned the record
   *
   * @throws {Error} When repository update operations fail (database errors, validation errors, etc.)
   *
   * @example
   * ```typescript
   * // Update only company display name
   * const result = await useCase.execute(auditContext, {
   *   company: {
   *     companyId: 'uuid-here',
   *     displayName: 'New Display Name'
   *   }
   * })
   * // result: { company: DBCompanySelect, keyPerson: undefined }
   * ```
   *
   * @example
   * ```typescript
   * // Update key person email and status
   * const result = await useCase.execute(auditContext, {
   *   keyPerson: {
   *     keyPersonId: 'uuid-here',
   *     email: 'new@example.com',
   *     isActive: false
   *   }
   * })
   * // result: { company: undefined, keyPerson: DBKeyPersonSelect }
   * ```
   *
   * @example
   * ```typescript
   * // Update both entities
   * const result = await useCase.execute(auditContext, {
   *   company: {
   *     companyId: 'company-uuid',
   *     status: 'paused'
   *   },
   *   keyPerson: {
   *     keyPersonId: 'person-uuid',
   *     jobTitle: 'CTO'
   *   }
   * })
   * // result: { company: DBCompanySelect, keyPerson: DBKeyPersonSelect }
   * ```
   *
   * @example
   * ```typescript
   * // Handle audit logging failure gracefully
   * try {
   *   const result = await useCase.execute(auditContext, updateData)
   *   // Update succeeds even if audit logging fails
   *   console.log('Updated:', result)
   * } catch (error) {
   *   // Only thrown if repository update fails
   *   console.error('Update failed:', error)
   * }
   * ```
   */
  async execute(auditContext: AuditContext, data: UpdateCompanyDetailsData): Promise<any> {
    // Business logic to update company details goes here
    // This is a placeholder implementation
    let resultPutCompanyDetails
    let resultPutKeyPersonDetails
    if (data.company) {
      resultPutCompanyDetails = await this.companyDetailsRepo.putCompanyDetails(data.company)
    }
    if (data.keyPerson) {
      resultPutKeyPersonDetails = await this.companyDetailsRepo.putKeyPersonDetails(data.keyPerson)
    }

    if (resultPutCompanyDetails) {
      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.COMPANY,
          entityId: new Uuid(data?.company?.companyId as string).getValue(),
          action: AuditAction.UPDATE,
          changes: {
            reason: 'company_details_updated_successfully',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for company details retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
    }

    if (resultPutKeyPersonDetails) {
      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.KEY_PERSON,
          entityId: new Uuid(data?.keyPerson?.keyPersonId as string).getValue(),
          action: AuditAction.UPDATE,
          changes: {
            reason: 'key_person_details_updated_successfully',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for key person details retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
    }

    return {
      company: resultPutCompanyDetails,
      keyPerson: resultPutKeyPersonDetails,
    }
  }
}
