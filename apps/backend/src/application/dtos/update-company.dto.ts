import { isDefined, isObject, isNumber, isString, isBoolean } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { Uuid } from '../../domain/value-objects/uuid.js'

export type CompanyUpdate = {
  companyId?: string
  legalName?: string
  displayName?: string
  status?: 'prospect' | 'active' | 'paused' | 'churned'
  industry?: string | null
  companySize?: number | null
  websiteUrl?: string | null
  billingCountry?: string | null
  timezone?: string
}

export type KeyPersonUpdate = {
  keyPersonId?: string
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  jobTitle?: string | null
  isActive?: boolean
}

export class UpdateCompanyDTO {
  constructor(
    public readonly company?: CompanyUpdate,
    public readonly keyPerson?: KeyPersonUpdate
  ) {}
  static validate(data: any): UpdateCompanyDTO {
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
