import { isBoolean, isDefined, isNumber, isObject, isString } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { Uuid } from '../../domain/value-objects/uuid.js'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Partial update fields for a company record.
 *
 * All fields are optional — only the properties that are present are applied
 * during an update operation.
 */
export type CompanyUpdate = {
  /** UUID of the company to update. Must be a valid v4 UUID when present. */
  companyId?: string
  /**
   * Official legal name of the company.
   * Must be 2–200 characters when present.
   * @example 'Acme Corporation Ltd.'
   */
  legalName?: string
  /**
   * Public-facing display name of the company.
   * Must be 2–200 characters when present.
   * @example 'Acme Corp'
   */
  displayName?: string
  /**
   * Current lifecycle status of the company.
   * Must be one of the four allowed values when present.
   */
  status?: 'prospect' | 'active' | 'paused' | 'churned'
  /**
   * Industry or sector the company operates in.
   * Must be ≤ 100 characters when present; `null` clears the field.
   * @example 'Software'
   */
  industry?: string | null
  /**
   * Approximate number of employees.
   * Must be a positive integer (≥ 1) when present; `null` clears the field.
   * @example 250
   */
  companySize?: number | null
  /**
   * Company website URL. Must parse as a valid URL when present;
   * `null` clears the field.
   * @example 'https://acme.example.com'
   */
  websiteUrl?: string | null
  /**
   * ISO 3166-1 alpha-2 country code for billing purposes.
   * Must match `/^[A-Z]{2}$/` when present; `null` clears the field.
   * @example 'US'
   */
  billingCountry?: string | null
  /**
   * IANA timezone identifier for the company.
   * @example 'Europe/London'
   */
  timezone?: string
}

/**
 * Partial update fields for a key-person record associated with a company.
 *
 * All fields are optional — only the properties that are present are applied
 * during an update operation.
 */
export type KeyPersonUpdate = {
  /** UUID of the key person to update. Must be a valid v4 UUID when present. */
  keyPersonId?: string
  /**
   * Key person's first name. Must be 1–100 characters when present.
   * @example 'Alice'
   */
  firstName?: string
  /**
   * Key person's last name. Must be 1–100 characters when present.
   * @example 'Smith'
   */
  lastName?: string
  /**
   * Key person's email address. Must be a valid email format when present;
   * `null` clears the field.
   * @example 'alice@acme.example.com'
   */
  email?: string | null
  /**
   * Key person's phone number. Must be ≤ 30 characters when present;
   * `null` clears the field.
   * @example '+1 555 000 1234'
   */
  phone?: string | null
  /**
   * Key person's job title. Must be ≤ 100 characters when present;
   * `null` clears the field.
   * @example 'Chief Executive Officer'
   */
  jobTitle?: string | null
  /**
   * Whether the key person is currently active.
   * @example true
   */
  isActive?: boolean
}

/**
 * Data Transfer Object representing a validated company-details update request.
 *
 * Wraps two independent, optional sub-objects — {@link CompanyUpdate} and
 * {@link KeyPersonUpdate} — so that a single request can update company
 * fields, key-person fields, or both in one call.
 *
 * All field-level validations are enforced by the {@link UpdateCompanyDTO.validate}
 * factory before construction. Fields that are absent from the payload are
 * left untouched by the update operation.
 *
 * @example
 * ```ts
 * // Update company status and key-person job title in one request
 * const dto = UpdateCompanyDTO.validate({
 *   company: { companyId: 'uuid-…', status: 'active' },
 *   keyPerson: { keyPersonId: 'uuid-…', jobTitle: 'CTO' },
 * })
 *
 * // Update only company billing country
 * const dto = UpdateCompanyDTO.validate({
 *   company: { companyId: 'uuid-…', billingCountry: 'DE' },
 * })
 * ```
 */
export class UpdateCompanyDTO {
  /**
   * Creates an `UpdateCompanyDTO` instance.
   *
   * Prefer {@link UpdateCompanyDTO.validate} over calling this constructor
   * directly — it validates every field before construction.
   *
   * @param company - Optional partial company update fields.
   * @param keyPerson - Optional partial key-person update fields.
   */
  constructor(
    /**
     * Partial company update. When present, only the fields included in this
     * object are updated; absent fields are left unchanged.
     */
    public readonly company?: CompanyUpdate,
    /**
     * Partial key-person update. When present, only the fields included in
     * this object are updated; absent fields are left unchanged.
     */
    public readonly keyPerson?: KeyPersonUpdate
  ) {}

  /**
   * Parses and validates a raw `CompanyDetailsRequest` payload into an
   * {@link UpdateCompanyDTO}.
   *
   * **Company field validation rules** (all fields optional):
   * - `company` must be an object when present.
   * - `companyId` must be a valid UUID string when present.
   * - `legalName` must be a string of 2–200 characters when present.
   * - `displayName` must be a string of 2–200 characters when present.
   * - `status` must be one of `'prospect'`, `'active'`, `'paused'`,
   *   `'churned'` when present.
   * - `industry` must be a string of ≤ 100 characters when present.
   * - `companySize` must be a positive number (≥ 1) when present.
   * - `websiteUrl` must be a parseable URL string when present.
   * - `billingCountry` must be a 2-letter ISO 3166-1 alpha-2 code
   *   (uppercase) when present.
   * - `timezone` must be a string when present.
   *
   * **Key-person field validation rules** (all fields optional):
   * - `keyPerson` must be an object when present.
   * - `keyPersonId` must be a valid UUID string when present.
   * - `firstName` must be a string of 1–100 characters when present.
   * - `lastName` must be a string of 1–100 characters when present.
   * - `email` must be a valid email address format when present.
   * - `phone` must be a string of ≤ 30 characters when present.
   * - `jobTitle` must be a string of ≤ 100 characters when present.
   * - `isActive` must be a boolean when present.
   *
   * @param data - The raw request payload conforming to the OpenAPI
   *   `CompanyDetailsRequest` schema.
   * @returns A new `UpdateCompanyDTO` containing the validated `company`
   *   and/or `keyPerson` sub-objects.
   * @throws {TypeException} When `data` is not an object.
   * @throws {ValidationException} When `company` is present but not an object.
   * @throws {ValidationException} When any company field fails its type or
   *   format constraint (see rules above).
   * @throws {ValidationException} When `keyPerson` is present but not an object.
   * @throws {ValidationException} When any key-person field fails its type or
   *   format constraint (see rules above).
   *
   * @example
   * ```ts
   * // Happy path — update company status and key-person title
   * const dto = UpdateCompanyDTO.validate({
   *   company: { companyId: 'uuid-…', status: 'active', billingCountry: 'US' },
   *   keyPerson: { keyPersonId: 'uuid-…', jobTitle: 'CTO', isActive: true },
   * })
   *
   * // Throws TypeException — not an object
   * UpdateCompanyDTO.validate(null)
   *
   * // Throws ValidationException — invalid status value
   * UpdateCompanyDTO.validate({ company: { status: 'unknown' } })
   *
   * // Throws ValidationException — billingCountry not ISO alpha-2
   * UpdateCompanyDTO.validate({ company: { billingCountry: 'United States' } })
   *
   * // Throws ValidationException — invalid email format
   * UpdateCompanyDTO.validate({ keyPerson: { email: 'not-an-email' } })
   * ```
   */
  static validate(data: components['schemas']['CompanyDetailsRequest']): UpdateCompanyDTO {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Invalid data: expected an object')
    }

    const { company, keyPerson } = data

    if (isDefined(company) && !isObject(company)) {
      throw new ValidationException('Invalid company: must be a defined object')
    }

    if (isDefined(company) && isDefined(company.companyId)) {
      if (!isString(company.companyId)) {
        throw new ValidationException('Invalid companyId: must be a string')
      }
      try {
        new Uuid(company.companyId)
      } catch {
        throw new ValidationException('Invalid companyId: must be a valid UUID')
      }
    }

    if (isDefined(company) && isDefined(company.legalName) && !isString(company.legalName)) {
      throw new ValidationException('Invalid legalName: must be a string')
    }

    if (
      isDefined(company) &&
      isDefined(company.legalName) &&
      isString(company.legalName) &&
      (company.legalName.length < 2 || company.legalName.length > 200)
    ) {
      throw new ValidationException('Invalid legalName: must be between 2 and 200 characters long')
    }

    if (isDefined(company) && isDefined(company.displayName) && !isString(company.displayName)) {
      throw new ValidationException('Invalid displayName: must be a string')
    }

    if (
      isDefined(company) &&
      isDefined(company.displayName) &&
      isString(company.displayName) &&
      (company.displayName.length < 2 || company.displayName.length > 200)
    ) {
      throw new ValidationException(
        'Invalid displayName: must be between 2 and 200 characters long'
      )
    }

    if (isDefined(company) && isDefined(company.status) && !isString(company.status)) {
      throw new ValidationException('Invalid status: must be a string')
    }

    if (
      isDefined(company) &&
      isDefined(company.status) &&
      isString(company.status) &&
      !['prospect', 'active', 'paused', 'churned'].includes(company.status)
    ) {
      throw new ValidationException(
        'Invalid status: must be one of "prospect", "active", "paused", "churned"'
      )
    }

    if (isDefined(company) && isDefined(company.industry) && !isString(company.industry)) {
      throw new ValidationException('Invalid industry: must be a string')
    }

    if (
      isDefined(company) &&
      isDefined(company.industry) &&
      isString(company.industry) &&
      company.industry.length > 100
    ) {
      throw new ValidationException('Invalid industry: must be less than 100 characters long')
    }

    if (isDefined(company) && isDefined(company.companySize) && !isNumber(company.companySize)) {
      throw new ValidationException('Invalid companySize: must be a number')
    }

    if (
      isDefined(company) &&
      isDefined(company.companySize) &&
      isNumber(company.companySize) &&
      company.companySize < 1
    ) {
      throw new ValidationException('Invalid companySize: must be greater than 0')
    }

    if (isDefined(company) && isDefined(company.websiteUrl) && !isString(company.websiteUrl)) {
      throw new ValidationException('Invalid websiteUrl: must be a string')
    }

    if (isDefined(company) && isDefined(company.websiteUrl) && isString(company.websiteUrl)) {
      try {
        new URL(company.websiteUrl)
      } catch {
        throw new ValidationException('Invalid websiteUrl: must be a valid URL')
      }
    }

    if (
      isDefined(company) &&
      isDefined(company.billingCountry) &&
      !isString(company.billingCountry)
    ) {
      throw new ValidationException('Invalid billingCountry: must be a string')
    }

    if (
      isDefined(company) &&
      isDefined(company.billingCountry) &&
      isString(company.billingCountry) &&
      !/^[A-Z]{2}$/.test(company.billingCountry)
    ) {
      throw new ValidationException(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )
    }

    if (isDefined(company) && isDefined(company.timezone) && !isString(company.timezone)) {
      throw new ValidationException('Invalid timezone: must be a string')
    }

    // Validate keyPerson object
    if (isDefined(keyPerson) && !isObject(keyPerson)) {
      throw new ValidationException('Invalid keyPerson: must be a defined object')
    }

    if (isDefined(keyPerson?.keyPersonId)) {
      if (!isString(keyPerson.keyPersonId)) {
        throw new ValidationException('Invalid keyPersonId: must be a string')
      }
      try {
        new Uuid(keyPerson.keyPersonId)
      } catch {
        throw new ValidationException('Invalid keyPersonId: must be a valid UUID')
      }
    }

    if (isDefined(keyPerson?.firstName) && !isString(keyPerson.firstName)) {
      throw new ValidationException('Invalid firstName: must be a string')
    }

    if (
      isDefined(keyPerson?.firstName) &&
      (keyPerson.firstName.length < 1 || keyPerson.firstName.length > 100)
    ) {
      throw new ValidationException('Invalid firstName: must be between 1 and 100 characters long')
    }

    if (isDefined(keyPerson?.lastName) && !isString(keyPerson.lastName)) {
      throw new ValidationException('Invalid lastName: must be a string')
    }

    if (
      isDefined(keyPerson?.lastName) &&
      (keyPerson.lastName.length < 1 || keyPerson.lastName.length > 100)
    ) {
      throw new ValidationException('Invalid lastName: must be between 1 and 100 characters long')
    }

    if (isDefined(keyPerson?.email) && !isString(keyPerson.email)) {
      throw new ValidationException('Invalid email: must be a string')
    }

    if (isDefined(keyPerson?.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(keyPerson.email)) {
      throw new ValidationException('Invalid email: must be a valid email address')
    }

    if (isDefined(keyPerson?.phone) && !isString(keyPerson.phone)) {
      throw new ValidationException('Invalid phone: must be a string')
    }

    if (isDefined(keyPerson?.phone) && keyPerson.phone.length > 30) {
      throw new ValidationException('Invalid phone: must be less than 30 characters long')
    }

    if (isDefined(keyPerson?.jobTitle) && !isString(keyPerson.jobTitle)) {
      throw new ValidationException('Invalid jobTitle: must be a string')
    }

    if (isDefined(keyPerson?.jobTitle) && keyPerson.jobTitle.length > 100) {
      throw new ValidationException('Invalid jobTitle: must be less than 100 characters long')
    }

    if (isDefined(keyPerson?.isActive) && !isBoolean(keyPerson.isActive)) {
      throw new ValidationException('Invalid isActive: must be a boolean')
    }

    return new UpdateCompanyDTO(company, keyPerson)
  }
}
