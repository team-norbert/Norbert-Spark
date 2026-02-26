import { eq, sql } from 'drizzle-orm'

import type { CompanyDetailsPort } from '../../../application/ports/company.repository.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import type {
  DBCompany,
  DBCompanySelect,
  DBKeyPerson,
  DBKeyPersonSelect,
} from '../../../infrastructure/database/schema.js'
import { company, keyPerson } from '../../../infrastructure/database/schema.js'

/**
 * Repository for accessing company and key person data from the database.
 *
 * @remarks
 * This repository provides data access methods for singleton company and key person records.
 * Both the company and key_person tables enforce single-row constraints via unique indexes
 * on constant expressions, ensuring only one record exists per table.
 *
 * The repository follows the hexagonal architecture pattern, implementing the CompanyDetailsPort
 * interface to decouple the domain/application layer from infrastructure concerns.
 *
 * **Data Access Pattern:**
 * - Uses Drizzle ORM for type-safe database queries
 * - Returns null when records don't exist (not an error state)
 * - Logs all operations for observability
 * - Propagates database errors to the caller
 *
 * **Singleton Tables:**
 * The company and key_person tables use PostgreSQL unique indexes on constant expressions:
 * ```sql
 * CREATE UNIQUE INDEX only_one_company ON company ((true));
 * CREATE UNIQUE INDEX only_one_key_person ON key_person ((true));
 * ```
 * This ensures at most one record exists, making these effectively singleton entities.
 *
 * @example
 * ```typescript
 * const repository = new CompanyRepository(logger)
 * const company = await repository.getCompanyDetails()
 * const keyPerson = await repository.getKeyPersonDetails()
 * ```
 */
export class CompanyRepository implements CompanyDetailsPort {
  /**
   * Creates an instance of CompanyRepository.
   *
   * @param logger - Logger port for tracking repository operations and errors
   *
   * @remarks
   * The logger is injected via constructor following the dependency injection pattern.
   * All database operations are logged for debugging and monitoring purposes.
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Updates the singleton company details in the database.
   *
   * @param data - Partial company data to update (only provided fields are updated)
   * @returns Promise resolving to the updated company record or null if not found
   *
   * @remarks
   * Updates the company record in the singleton company table. Uses a partial update
   * pattern where only the provided fields are modified. The updatedAt timestamp is
   * automatically set to the current database time.
   *
   * **Update Behavior:**
   * - Uses Drizzle ORM's update().set().where().returning() pattern
   * - Targets the singleton record using singletonCheck = true condition
   * - Automatically adds updatedAt timestamp using sql`NOW()`
   * - Returns the updated record via .returning()
   * - Returns null if no company record exists to update
   * - Returns null if the update result is undefined
   *
   * **Supported Fields:**
   * All fields from DBCompany can be partially updated:
   * - companyId: string - UUIDv7 primary key (typically not updated)
   * - legalName: string - Official legal entity name
   * - displayName: string - Display name for UI
   * - status: 'active' | 'prospect' | 'paused' | 'churned'
   * - industry: string | null - Industry classification
   * - companySize: number | null - Number of employees
   * - websiteUrl: string | null - Company website URL
   * - billingCountry: string - ISO country code for billing
   * - timezone: string - IANA timezone identifier
   *
   * **Singleton Constraint:**
   * The where clause targets singletonCheck = true to ensure only the single
   * company record is updated. The database enforces this constraint via a
   * unique index on (true) constant expression.
   *
   * **Error Handling:**
   * - Database errors are logged with the logger
   * - Errors are re-thrown to the caller for handling
   * - Connection failures, query timeouts, etc. propagate up
   * - Constraint violations (if any) are propagated
   *
   * **Logging:**
   * - Info log before updating: "Updating company details in the database"
   * - Error log on failure: "Error updating company details"
   *
   * @throws {Error} When database update fails (connection error, timeout, constraint violation, etc.)
   *
   * @example
   * ```typescript
   * // Update only display name
   * const updated = await repository.putCompanyDetails({
   *   displayName: 'New Company Name'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Update multiple fields
   * const updated = await repository.putCompanyDetails({
   *   status: 'active',
   *   industry: 'Technology',
   *   companySize: 150,
   *   websiteUrl: 'https://example.com'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Set nullable fields to null
   * const updated = await repository.putCompanyDetails({
   *   industry: null,
   *   companySize: null,
   *   websiteUrl: null
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const updated = await repository.putCompanyDetails({ legalName: 'New LLC' })
   *   if (updated) {
   *     console.log('Company updated:', updated.legalName)
   *   } else {
   *     console.log('No company found to update')
   *   }
   * } catch (error) {
   *   console.error('Update failed:', error)
   * }
   * ```
   */
  async putCompanyDetails(data: Partial<DBCompany>): Promise<DBCompanySelect | null> {
    this.logger.info('Updating company details in the database')

    try {
      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: sql`NOW()`,
      }

      // Update the singleton company record where singletonCheck is true
      const [updatedCompany] = await db
        .update(company)
        .set(updateData)
        .where(eq(company.singletonCheck, true))
        .returning()

      return updatedCompany ?? null
    } catch (error) {
      this.logger.error('Error updating company details', error as Error)
      throw error
    }
  }

  /**
   * Updates the singleton key person details in the database.
   *
   * @param data - Partial key person data to update (only provided fields are updated)
   * @returns Promise resolving to the updated key person record or null if not found
   *
   * @remarks
   * Updates the key person record in the singleton key_person table. Uses a partial update
   * pattern where only the provided fields are modified. The updatedAt timestamp is
   * automatically set to the current database time.
   *
   * **Update Behavior:**
   * - Uses Drizzle ORM's update().set().returning() pattern
   * - No where clause needed (singleton enforced by database constraint)
   * - Automatically adds updatedAt timestamp using sql`NOW()`
   * - Returns the updated record via .returning()
   * - Returns null if no key person record exists to update
   * - Returns null if the update result is undefined
   *
   * **Supported Fields:**
   * All fields from DBKeyPerson can be partially updated:
   * - keyPersonId: string - UUIDv7 primary key (typically not updated)
   * - firstName: string - Key person's first name
   * - lastName: string - Key person's last name
   * - email: string - Email address (case-insensitive CITEXT in database)
   * - phone: string | null - Phone number
   * - jobTitle: string | null - Job title/position
   * - isActive: boolean - Whether the person is currently active
   *
   * **Singleton Constraint:**
   * Unlike putCompanyDetails, this method does not use a where clause because
   * the key_person table's singleton constraint is enforced at the database level
   * via a unique index on (true) constant expression. This ensures only one record
   * can ever exist, so the update automatically targets that single record.
   *
   * **Error Handling:**
   * - Database errors are logged with the logger
   * - Errors are re-thrown to the caller for handling
   * - Connection failures, query timeouts, etc. propagate up
   * - Constraint violations (if any) are propagated
   *
   * **Logging:**
   * - Info log before updating: "Updating key person details in the database"
   * - Error log on failure: "Error updating key person details"
   *
   * **Database Column Mapping:**
   * Note that keyPersonId in TypeScript maps to the 'person_id' column in PostgreSQL
   * due to Drizzle schema configuration.
   *
   * @throws {Error} When database update fails (connection error, timeout, constraint violation, etc.)
   *
   * @example
   * ```typescript
   * // Update only first name
   * const updated = await repository.putKeyPersonDetails({
   *   firstName: 'Jane'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Update multiple fields
   * const updated = await repository.putKeyPersonDetails({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   email: 'john.doe@example.com',
   *   phone: '+1234567890',
   *   jobTitle: 'CEO',
   *   isActive: true
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Deactivate key person
   * const updated = await repository.putKeyPersonDetails({
   *   isActive: false
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Clear nullable fields
   * const updated = await repository.putKeyPersonDetails({
   *   phone: null,
   *   jobTitle: null
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const updated = await repository.putKeyPersonDetails({
   *     email: 'newemail@example.com'
   *   })
   *   if (updated) {
   *     console.log('Key person updated:', updated.email)
   *   } else {
   *     console.log('No key person found to update')
   *   }
   * } catch (error) {
   *   console.error('Update failed:', error)
   * }
   * ```
   */
  async putKeyPersonDetails(data: Partial<DBKeyPerson>): Promise<DBKeyPersonSelect | null> {
    this.logger.info('Updating key person details in the database')

    try {
      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: sql`NOW()`,
      }

      // Update the singleton key person record
      const [updatedKeyPerson] = await db.update(keyPerson).set(updateData).returning()

      return updatedKeyPerson ?? null
    } catch (error) {
      this.logger.error('Error updating key person details', error as Error)
      throw error
    }
  }

  /**
   * Retrieves the singleton company details from the database.
   *
   * @returns Promise resolving to the company record or null if not found
   *
   * @remarks
   * Fetches the company record from the singleton company table. Since the table
   * enforces a single-row constraint, the query is limited to 1 result.
   *
   * **Query Behavior:**
   * - Uses Drizzle ORM's select().from(company).limit(1) pattern
   * - Returns the first (and only) company record
   * - Returns null if no company record exists
   * - Returns null if the result is undefined
   *
   * **Error Handling:**
   * - Database errors are logged with the logger
   * - Errors are re-thrown to the caller for handling
   * - Connection failures, query timeouts, etc. propagate up
   *
   * **Logging:**
   * - Info log before fetching: "Fetching company details from the database"
   * - Error log on failure: "Error fetching company details"
   *
   * **Return Value Structure:**
   * When a company record exists, returns an object with:
   * - companyId: string - UUIDv7 primary key
   * - legalName: string - Official legal entity name
   * - displayName: string - Display name for UI
   * - status: 'active' | 'prospect' | 'paused' | 'churned'
   * - industry: string | null - Industry classification
   * - companySize: number | null - Number of employees
   * - websiteUrl: string | null - Company website URL
   * - billingCountry: string - ISO country code for billing
   * - timezone: string - IANA timezone identifier
   * - singletonCheck: boolean - Constraint enforcement flag (always true)
   * - createdAt: Date - Record creation timestamp
   * - updatedAt: Date - Last update timestamp
   *
   * @throws {Error} When database query fails (connection error, timeout, etc.)
   *
   * @example
   * ```typescript
   * const company = await repository.getCompanyDetails()
   * if (company) {
   *   console.log(`Company: ${company.legalName}`)
   *   console.log(`Status: ${company.status}`)
   * } else {
   *   console.log('No company record found')
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const company = await repository.getCompanyDetails()
   * } catch (error) {
   *   console.error('Database error:', error)
   *   // Handle connection failures, query errors, etc.
   * }
   * ```
   */
  async getCompanyDetails(): Promise<DBCompanySelect | null> {
    this.logger.info('Fetching company details from the database')

    try {
      const [companyDetails] = await db.select().from(company).limit(1)
      return companyDetails ?? null
    } catch (error) {
      this.logger.error('Error fetching company details', error as Error)
      throw error
    }
  }

  /**
   * Retrieves the singleton key person details from the database.
   *
   * @returns Promise resolving to the key person record or null if not found
   *
   * @remarks
   * Fetches the key person record from the singleton key_person table. Since the table
   * enforces a single-row constraint, the query is limited to 1 result.
   *
   * **Query Behavior:**
   * - Uses Drizzle ORM's select().from(keyPerson).limit(1) pattern
   * - Returns the first (and only) key person record
   * - Returns null if no key person record exists
   * - Returns null if the result is undefined
   *
   * **Error Handling:**
   * - Database errors are logged with the logger
   * - Errors are re-thrown to the caller for handling
   * - Connection failures, query timeouts, etc. propagate up
   *
   * **Logging:**
   * - Info log before fetching: "Fetching key person details from the database"
   * - Error log on failure: "Error fetching key person details"
   *
   * **Return Value Structure:**
   * When a key person record exists, returns an object with:
   * - keyPersonId: string - UUIDv7 primary key (maps to 'person_id' column)
   * - firstName: string - Key person's first name
   * - lastName: string - Key person's last name
   * - email: string - Email address (case-insensitive CITEXT)
   * - phone: string | null - Phone number
   * - jobTitle: string | null - Job title/position
   * - isActive: boolean - Whether the person is currently active
   * - createdAt: Date - Record creation timestamp
   * - updatedAt: Date - Last update timestamp
   *
   * **Database Column Mapping:**
   * Note that keyPersonId in TypeScript maps to the 'person_id' column in PostgreSQL
   * due to Drizzle schema configuration.
   *
   * @throws {Error} When database query fails (connection error, timeout, etc.)
   *
   * @example
   * ```typescript
   * const keyPerson = await repository.getKeyPersonDetails()
   * if (keyPerson) {
   *   console.log(`Key Person: ${keyPerson.firstName} ${keyPerson.lastName}`)
   *   console.log(`Email: ${keyPerson.email}`)
   *   console.log(`Active: ${keyPerson.isActive}`)
   * } else {
   *   console.log('No key person record found')
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handling optional fields
   * const keyPerson = await repository.getKeyPersonDetails()
   * if (keyPerson) {
   *   const phone = keyPerson.phone ?? 'No phone provided'
   *   const title = keyPerson.jobTitle ?? 'No title'
   *   console.log(`${keyPerson.firstName} - ${title} - ${phone}`)
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const keyPerson = await repository.getKeyPersonDetails()
   * } catch (error) {
   *   console.error('Database error:', error)
   *   // Handle connection failures, query errors, etc.
   * }
   * ```
   */
  async getKeyPersonDetails(): Promise<DBKeyPersonSelect | null> {
    this.logger.info('Fetching key person details from the database')

    try {
      const [keyPersonDetails] = await db.select().from(keyPerson).limit(1)
      return keyPersonDetails ?? null
    } catch (error) {
      this.logger.error('Error fetching key person details', error as Error)
      throw error
    }
  }
}
