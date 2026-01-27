import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { UpdateCompanyDTO } from '../../../src/application/dtos/update-company.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('UpdateCompanyDTO', () => {
  describe('constructor', () => {
    it('should create UpdateCompanyDTO with company data', () => {
      const company = {
        companyId: uuidv7(),
        legalName: 'Test Company Ltd',
        displayName: 'Test Company',
        status: 'active' as const,
      }

      const dto = new UpdateCompanyDTO(company, undefined)

      expect(dto.company).toEqual(company)
      expect(dto.keyPerson).toBeUndefined()
    })

    it('should create UpdateCompanyDTO with keyPerson data', () => {
      const keyPerson = {
        keyPersonId: uuidv7(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }

      const dto = new UpdateCompanyDTO(undefined, keyPerson)

      expect(dto.company).toBeUndefined()
      expect(dto.keyPerson).toEqual(keyPerson)
    })

    it('should create UpdateCompanyDTO with both company and keyPerson data', () => {
      const company = {
        companyId: uuidv7(),
        legalName: 'Test Company Ltd',
      }
      const keyPerson = {
        keyPersonId: uuidv7(),
        firstName: 'John',
      }

      const dto = new UpdateCompanyDTO(company, keyPerson)

      expect(dto.company).toEqual(company)
      expect(dto.keyPerson).toEqual(keyPerson)
    })

    it('should create UpdateCompanyDTO with no data', () => {
      const dto = new UpdateCompanyDTO()

      expect(dto.company).toBeUndefined()
      expect(dto.keyPerson).toBeUndefined()
    })
  })

  describe('validate() - type validation', () => {
    it('should throw TypeException when data is undefined', () => {
      expect(() => UpdateCompanyDTO.validate(undefined)).toThrow(TypeException)
      expect(() => UpdateCompanyDTO.validate(undefined)).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is null', () => {
      expect(() => UpdateCompanyDTO.validate(null)).toThrow(TypeException)
      expect(() => UpdateCompanyDTO.validate(null)).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is not an object', () => {
      expect(() => UpdateCompanyDTO.validate('string')).toThrow(TypeException)
      expect(() => UpdateCompanyDTO.validate(123)).toThrow(TypeException)
      expect(() => UpdateCompanyDTO.validate(true)).toThrow(TypeException)
      expect(() => UpdateCompanyDTO.validate([])).toThrow(TypeException)
    })

    it('should throw ValidationException when company is not an object', () => {
      expect(() => UpdateCompanyDTO.validate({ company: 'invalid' })).toThrow(ValidationException)
      expect(() => UpdateCompanyDTO.validate({ company: 'invalid' })).toThrow(
        'Invalid company: must be a defined object'
      )
    })

    it('should throw ValidationException when keyPerson is not an object', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: 'invalid' })).toThrow(ValidationException)
      expect(() => UpdateCompanyDTO.validate({ keyPerson: 'invalid' })).toThrow(
        'Invalid keyPerson: must be a defined object'
      )
    })
  })

  describe('validate() - company.companyId validation', () => {
    it('should accept valid UUID v7 for companyId', () => {
      const validUuid = uuidv7()
      const data = {
        company: { companyId: validUuid },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.companyId).toBe(validUuid)
    })

    it('should throw ValidationException when companyId is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { companyId: 123 } })).toThrow(
        ValidationException
      )
      expect(() => UpdateCompanyDTO.validate({ company: { companyId: 123 } })).toThrow(
        'Invalid companyId: must be a string'
      )
    })

    it('should throw ValidationException when companyId is not a valid UUID', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { companyId: 'not-a-uuid' } })).toThrow(
        ValidationException
      )
      expect(() => UpdateCompanyDTO.validate({ company: { companyId: 'not-a-uuid' } })).toThrow(
        'Invalid companyId: must be a valid UUID'
      )
    })

    it('should throw ValidationException when companyId is not UUID v7', () => {
      const uuidv4 = '123e4567-e89b-12d3-a456-426614174000'
      expect(() => UpdateCompanyDTO.validate({ company: { companyId: uuidv4 } })).toThrow(
        ValidationException
      )
    })
  })

  describe('validate() - company.legalName validation', () => {
    it('should accept valid legalName', () => {
      const data = {
        company: { legalName: 'Acme Corporation Ltd.' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.legalName).toBe('Acme Corporation Ltd.')
    })

    it('should throw ValidationException when legalName is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { legalName: 123 } })).toThrow(
        'Invalid legalName: must be a string'
      )
    })

    it('should throw ValidationException when legalName is too short', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { legalName: 'A' } })).toThrow(
        'Invalid legalName: must be between 2 and 200 characters long'
      )
    })

    it('should throw ValidationException when legalName is too long', () => {
      const longName = 'A'.repeat(201)
      expect(() => UpdateCompanyDTO.validate({ company: { legalName: longName } })).toThrow(
        'Invalid legalName: must be between 2 and 200 characters long'
      )
    })

    it('should accept legalName at minimum length', () => {
      const data = {
        company: { legalName: 'AB' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.legalName).toBe('AB')
    })

    it('should accept legalName at maximum length', () => {
      const maxName = 'A'.repeat(200)
      const data = {
        company: { legalName: maxName },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.legalName).toBe(maxName)
    })
  })

  describe('validate() - company.displayName validation', () => {
    it('should accept valid displayName', () => {
      const data = {
        company: { displayName: 'Acme Corp' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.displayName).toBe('Acme Corp')
    })

    it('should throw ValidationException when displayName is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { displayName: 123 } })).toThrow(
        'Invalid displayName: must be a string'
      )
    })

    it('should throw ValidationException when displayName is too short', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { displayName: 'A' } })).toThrow(
        'Invalid displayName: must be between 2 and 200 characters long'
      )
    })

    it('should throw ValidationException when displayName is too long', () => {
      const longName = 'A'.repeat(201)
      expect(() => UpdateCompanyDTO.validate({ company: { displayName: longName } })).toThrow(
        'Invalid displayName: must be between 2 and 200 characters long'
      )
    })
  })

  describe('validate() - company.status validation', () => {
    it('should accept valid status "prospect"', () => {
      const data = {
        company: { status: 'prospect' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.status).toBe('prospect')
    })

    it('should accept valid status "active"', () => {
      const data = {
        company: { status: 'active' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.status).toBe('active')
    })

    it('should accept valid status "paused"', () => {
      const data = {
        company: { status: 'paused' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.status).toBe('paused')
    })

    it('should accept valid status "churned"', () => {
      const data = {
        company: { status: 'churned' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.status).toBe('churned')
    })

    it('should throw ValidationException when status is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { status: 123 } })).toThrow(
        'Invalid status: must be a string'
      )
    })

    it('should throw ValidationException when status is invalid', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { status: 'invalid' } })).toThrow(
        'Invalid status: must be one of "prospect", "active", "paused", "churned"'
      )
    })
  })

  describe('validate() - company.industry validation', () => {
    it('should accept valid industry', () => {
      const data = {
        company: { industry: 'Technology' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.industry).toBe('Technology')
    })

    it('should throw ValidationException when industry is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { industry: 123 } })).toThrow(
        'Invalid industry: must be a string'
      )
    })

    it('should throw ValidationException when industry is too long', () => {
      const longIndustry = 'A'.repeat(101)
      expect(() => UpdateCompanyDTO.validate({ company: { industry: longIndustry } })).toThrow(
        'Invalid industry: must be less than 100 characters long'
      )
    })

    it('should accept industry at maximum length', () => {
      const maxIndustry = 'A'.repeat(100)
      const data = {
        company: { industry: maxIndustry },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.industry).toBe(maxIndustry)
    })
  })

  describe('validate() - company.companySize validation', () => {
    it('should accept valid companySize', () => {
      const data = {
        company: { companySize: 500 },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.companySize).toBe(500)
    })

    it('should throw ValidationException when companySize is not a number', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { companySize: '500' } })).toThrow(
        'Invalid companySize: must be a number'
      )
    })

    it('should throw ValidationException when companySize is less than 1', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { companySize: 0 } })).toThrow(
        'Invalid companySize: must be greater than 0'
      )

      expect(() => UpdateCompanyDTO.validate({ company: { companySize: -5 } })).toThrow(
        'Invalid companySize: must be greater than 0'
      )
    })

    it('should accept companySize at minimum value', () => {
      const data = {
        company: { companySize: 1 },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.companySize).toBe(1)
    })
  })

  describe('validate() - company.websiteUrl validation', () => {
    it('should accept valid websiteUrl', () => {
      const data = {
        company: { websiteUrl: 'https://acme.com' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.websiteUrl).toBe('https://acme.com')
    })

    it('should accept valid websiteUrl with http', () => {
      const data = {
        company: { websiteUrl: 'http://acme.com' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.websiteUrl).toBe('http://acme.com')
    })

    it('should throw ValidationException when websiteUrl is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { websiteUrl: 123 } })).toThrow(
        'Invalid websiteUrl: must be a string'
      )
    })

    it('should throw ValidationException when websiteUrl is invalid', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { websiteUrl: 'not-a-url' } })).toThrow(
        'Invalid websiteUrl: must be a valid URL'
      )
    })
  })

  describe('validate() - company.billingCountry validation', () => {
    it('should accept valid billingCountry', () => {
      const data = {
        company: { billingCountry: 'US' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.billingCountry).toBe('US')
    })

    it('should accept other valid country codes', () => {
      const countryCodes = ['GB', 'DE', 'FR', 'JP', 'CA']

      for (const code of countryCodes) {
        const data = {
          company: { billingCountry: code },
        }

        const dto = UpdateCompanyDTO.validate(data)

        expect(dto.company?.billingCountry).toBe(code)
      }
    })

    it('should throw ValidationException when billingCountry is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: 123 } })).toThrow(
        'Invalid billingCountry: must be a string'
      )
    })

    it('should throw ValidationException when billingCountry is not 2 letters', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: 'USA' } })).toThrow(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )

      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: 'U' } })).toThrow(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )
    })

    it('should throw ValidationException when billingCountry is not uppercase', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: 'us' } })).toThrow(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )

      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: 'Us' } })).toThrow(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )
    })

    it('should throw ValidationException when billingCountry contains non-letters', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { billingCountry: '12' } })).toThrow(
        'Invalid billingCountry: must be a 2-letter ISO country code (uppercase)'
      )
    })
  })

  describe('validate() - company.timezone validation', () => {
    it('should accept valid timezone', () => {
      const data = {
        company: { timezone: 'America/New_York' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.company?.timezone).toBe('America/New_York')
    })

    it('should accept other valid timezones', () => {
      const timezones = ['UTC', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']

      for (const timezone of timezones) {
        const data = {
          company: { timezone },
        }

        const dto = UpdateCompanyDTO.validate(data)

        expect(dto.company?.timezone).toBe(timezone)
      }
    })

    it('should throw ValidationException when timezone is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ company: { timezone: 123 } })).toThrow(
        'Invalid timezone: must be a string'
      )
    })
  })

  describe('validate() - keyPerson.keyPersonId validation', () => {
    it('should accept valid UUID v7 for keyPersonId', () => {
      const validUuid = uuidv7()
      const data = {
        keyPerson: { keyPersonId: validUuid },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.keyPersonId).toBe(validUuid)
    })

    it('should throw ValidationException when keyPersonId is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { keyPersonId: 123 } })).toThrow(
        'Invalid keyPersonId: must be a string'
      )
    })

    it('should throw ValidationException when keyPersonId is not a valid UUID', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { keyPersonId: 'not-a-uuid' } })).toThrow(
        'Invalid keyPersonId: must be a valid UUID'
      )
    })
  })

  describe('validate() - keyPerson.firstName validation', () => {
    it('should accept valid firstName', () => {
      const data = {
        keyPerson: { firstName: 'John' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.firstName).toBe('John')
    })

    it('should throw ValidationException when firstName is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { firstName: 123 } })).toThrow(
        'Invalid firstName: must be a string'
      )
    })

    it('should throw ValidationException when firstName is too short', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { firstName: '' } })).toThrow(
        'Invalid firstName: must be between 1 and 100 characters long'
      )
    })

    it('should throw ValidationException when firstName is too long', () => {
      const longName = 'A'.repeat(101)
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { firstName: longName } })).toThrow(
        'Invalid firstName: must be between 1 and 100 characters long'
      )
    })

    it('should accept firstName at minimum length', () => {
      const data = {
        keyPerson: { firstName: 'A' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.firstName).toBe('A')
    })

    it('should accept firstName at maximum length', () => {
      const maxName = 'A'.repeat(100)
      const data = {
        keyPerson: { firstName: maxName },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.firstName).toBe(maxName)
    })
  })

  describe('validate() - keyPerson.lastName validation', () => {
    it('should accept valid lastName', () => {
      const data = {
        keyPerson: { lastName: 'Doe' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.lastName).toBe('Doe')
    })

    it('should throw ValidationException when lastName is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { lastName: 123 } })).toThrow(
        'Invalid lastName: must be a string'
      )
    })

    it('should throw ValidationException when lastName is too short', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { lastName: '' } })).toThrow(
        'Invalid lastName: must be between 1 and 100 characters long'
      )
    })

    it('should throw ValidationException when lastName is too long', () => {
      const longName = 'A'.repeat(101)
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { lastName: longName } })).toThrow(
        'Invalid lastName: must be between 1 and 100 characters long'
      )
    })
  })

  describe('validate() - keyPerson.email validation', () => {
    it('should accept valid email', () => {
      const data = {
        keyPerson: { email: 'john.doe@acme.com' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.email).toBe('john.doe@acme.com')
    })

    it('should accept various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user+tag@example.co.uk',
        'first.last@subdomain.example.com',
        'user_name@example.org',
      ]

      for (const email of validEmails) {
        const data = {
          keyPerson: { email },
        }

        const dto = UpdateCompanyDTO.validate(data)

        expect(dto.keyPerson?.email).toBe(email)
      }
    })

    it('should throw ValidationException when email is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { email: 123 } })).toThrow(
        'Invalid email: must be a string'
      )
    })

    it('should throw ValidationException when email is invalid', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ]

      for (const email of invalidEmails) {
        expect(() => UpdateCompanyDTO.validate({ keyPerson: { email } })).toThrow(
          'Invalid email: must be a valid email address'
        )
      }
    })
  })

  describe('validate() - keyPerson.phone validation', () => {
    it('should accept valid phone', () => {
      const data = {
        keyPerson: { phone: '+1-555-123-4567' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.phone).toBe('+1-555-123-4567')
    })

    it('should accept various phone formats', () => {
      const validPhones = ['+1-555-123-4567', '555-123-4567', '(555) 123-4567', '+44 20 7123 4567']

      for (const phone of validPhones) {
        const data = {
          keyPerson: { phone },
        }

        const dto = UpdateCompanyDTO.validate(data)

        expect(dto.keyPerson?.phone).toBe(phone)
      }
    })

    it('should throw ValidationException when phone is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { phone: 123 } })).toThrow(
        'Invalid phone: must be a string'
      )
    })

    it('should throw ValidationException when phone is too long', () => {
      const longPhone = '1'.repeat(31)
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { phone: longPhone } })).toThrow(
        'Invalid phone: must be less than 30 characters long'
      )
    })

    it('should accept phone at maximum length', () => {
      const maxPhone = '1'.repeat(30)
      const data = {
        keyPerson: { phone: maxPhone },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.phone).toBe(maxPhone)
    })
  })

  describe('validate() - keyPerson.jobTitle validation', () => {
    it('should accept valid jobTitle', () => {
      const data = {
        keyPerson: { jobTitle: 'Chief Executive Officer' },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.jobTitle).toBe('Chief Executive Officer')
    })

    it('should throw ValidationException when jobTitle is not a string', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { jobTitle: 123 } })).toThrow(
        'Invalid jobTitle: must be a string'
      )
    })

    it('should throw ValidationException when jobTitle is too long', () => {
      const longTitle = 'A'.repeat(101)
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { jobTitle: longTitle } })).toThrow(
        'Invalid jobTitle: must be less than 100 characters long'
      )
    })

    it('should accept jobTitle at maximum length', () => {
      const maxTitle = 'A'.repeat(100)
      const data = {
        keyPerson: { jobTitle: maxTitle },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.jobTitle).toBe(maxTitle)
    })
  })

  describe('validate() - keyPerson.isActive validation', () => {
    it('should accept isActive as true', () => {
      const data = {
        keyPerson: { isActive: true },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.isActive).toBe(true)
    })

    it('should accept isActive as false', () => {
      const data = {
        keyPerson: { isActive: false },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto.keyPerson?.isActive).toBe(false)
    })

    it('should throw ValidationException when isActive is not a boolean', () => {
      expect(() => UpdateCompanyDTO.validate({ keyPerson: { isActive: 'true' } })).toThrow(
        'Invalid isActive: must be a boolean'
      )

      expect(() => UpdateCompanyDTO.validate({ keyPerson: { isActive: 1 } })).toThrow(
        'Invalid isActive: must be a boolean'
      )
    })
  })

  describe('validate() - complete data validation', () => {
    it('should validate complete company and keyPerson data', () => {
      const companyId = uuidv7()
      const keyPersonId = uuidv7()
      const data = {
        company: {
          companyId,
          legalName: 'Acme Corporation Ltd.',
          displayName: 'Acme Corp',
          status: 'active',
          industry: 'Technology',
          companySize: 500,
          websiteUrl: 'https://acme.com',
          billingCountry: 'US',
          timezone: 'America/New_York',
        },
        keyPerson: {
          keyPersonId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@acme.com',
          phone: '+1-555-123-4567',
          jobTitle: 'Chief Executive Officer',
          isActive: true,
        },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.company?.companyId).toBe(companyId)
      expect(dto.company?.legalName).toBe('Acme Corporation Ltd.')
      expect(dto.company?.displayName).toBe('Acme Corp')
      expect(dto.company?.status).toBe('active')
      expect(dto.company?.industry).toBe('Technology')
      expect(dto.company?.companySize).toBe(500)
      expect(dto.company?.websiteUrl).toBe('https://acme.com')
      expect(dto.company?.billingCountry).toBe('US')
      expect(dto.company?.timezone).toBe('America/New_York')
      expect(dto.keyPerson?.keyPersonId).toBe(keyPersonId)
      expect(dto.keyPerson?.firstName).toBe('John')
      expect(dto.keyPerson?.lastName).toBe('Doe')
      expect(dto.keyPerson?.email).toBe('john.doe@acme.com')
      expect(dto.keyPerson?.phone).toBe('+1-555-123-4567')
      expect(dto.keyPerson?.jobTitle).toBe('Chief Executive Officer')
      expect(dto.keyPerson?.isActive).toBe(true)
    })

    it('should validate with only company data', () => {
      const companyId = uuidv7()
      const data = {
        company: {
          companyId,
          legalName: 'Acme Corporation Ltd.',
        },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.company?.companyId).toBe(companyId)
      expect(dto.company?.legalName).toBe('Acme Corporation Ltd.')
      expect(dto.keyPerson).toBeUndefined()
    })

    it('should validate with only keyPerson data', () => {
      const keyPersonId = uuidv7()
      const data = {
        keyPerson: {
          keyPersonId,
          firstName: 'John',
        },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.company).toBeUndefined()
      expect(dto.keyPerson?.keyPersonId).toBe(keyPersonId)
      expect(dto.keyPerson?.firstName).toBe('John')
    })

    it('should validate with empty object', () => {
      const data = {}

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.company).toBeUndefined()
      expect(dto.keyPerson).toBeUndefined()
    })

    it('should validate with partial company data', () => {
      const data = {
        company: {
          status: 'active',
          timezone: 'UTC',
        },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.company?.status).toBe('active')
      expect(dto.company?.timezone).toBe('UTC')
    })

    it('should validate with partial keyPerson data', () => {
      const data = {
        keyPerson: {
          email: 'john@example.com',
          isActive: false,
        },
      }

      const dto = UpdateCompanyDTO.validate(data)

      expect(dto).toBeInstanceOf(UpdateCompanyDTO)
      expect(dto.keyPerson?.email).toBe('john@example.com')
      expect(dto.keyPerson?.isActive).toBe(false)
    })
  })
})
