import {
  contactRoleEnum,
  customerPeople,
  customers,
  customerStatusEnum,
  type DBCustomer,
  type DBCustomerPerson,
  type DBCustomerPersonSelect,
  type DBCustomerSelect,
  type DBPerson,
  type DBPersonSelect,
  people,
} from '@norberts-spark/shared'
import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

describe('Customer Schemas', () => {
  describe('customerStatusEnum', () => {
    it('should be defined', () => {
      expect(customerStatusEnum).toBeDefined()
    })

    it('should have correct enum name', () => {
      expect(customerStatusEnum.enumName).toBe('customer_status')
    })

    it('should have all status values', () => {
      const values = customerStatusEnum.enumValues
      expect(values).toContain('prospect')
      expect(values).toContain('active')
      expect(values).toContain('paused')
      expect(values).toContain('churned')
      expect(values).toHaveLength(4)
    })
  })

  describe('contactRoleEnum', () => {
    it('should be defined', () => {
      expect(contactRoleEnum).toBeDefined()
    })

    it('should have correct enum name', () => {
      expect(contactRoleEnum.enumName).toBe('contact_role')
    })

    it('should have all role values', () => {
      const values = contactRoleEnum.enumValues
      expect(values).toContain('primary_contact')
      expect(values).toContain('decision_maker')
      expect(values).toContain('billing_contact')
      expect(values).toContain('technical_contact')
      expect(values).toContain('stakeholder')
      expect(values).toHaveLength(5)
    })
  })

  describe('customers table', () => {
    it('should export customers table constant', () => {
      expect(customers).toBeDefined()
      expect(typeof customers).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(customers)).toBe('customers')
    })

    describe('columns', () => {
      it('should have customerId column', () => {
        expect(customers.customerId).toBeDefined()
        expect(customers.customerId.name).toBe('user_id')
      })

      it('should have legalName column', () => {
        expect(customers.legalName).toBeDefined()
        expect(customers.legalName.name).toBe('legal_name')
      })

      it('should have displayName column', () => {
        expect(customers.displayName).toBeDefined()
        expect(customers.displayName.name).toBe('display_name')
      })

      it('should have status column', () => {
        expect(customers.status).toBeDefined()
        expect(customers.status.name).toBe('status')
      })

      it('should have industry column', () => {
        expect(customers.industry).toBeDefined()
        expect(customers.industry.name).toBe('industry')
      })

      it('should have companySize column', () => {
        expect(customers.companySize).toBeDefined()
        expect(customers.companySize.name).toBe('company_size')
      })

      it('should have websiteUrl column', () => {
        expect(customers.websiteUrl).toBeDefined()
        expect(customers.websiteUrl.name).toBe('website_url')
      })

      it('should have billingCountry column', () => {
        expect(customers.billingCountry).toBeDefined()
        expect(customers.billingCountry.name).toBe('billing_country')
      })

      it('should have timezone column', () => {
        expect(customers.timezone).toBeDefined()
        expect(customers.timezone.name).toBe('timezone')
      })

      it('should have createdAt column', () => {
        expect(customers.createdAt).toBeDefined()
        expect(customers.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(customers.updatedAt).toBeDefined()
        expect(customers.updatedAt.name).toBe('updated_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on customerId', () => {
        expect(customers.customerId.primary).toBe(true)
      })

      it('should have not null constraint on legalName', () => {
        expect(customers.legalName.notNull).toBe(true)
      })

      it('should have not null constraint on displayName', () => {
        expect(customers.displayName.notNull).toBe(true)
      })

      it('should have not null constraint on status', () => {
        expect(customers.status.notNull).toBe(true)
      })

      it('should have not null constraint on timezone', () => {
        expect(customers.timezone.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(customers.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(customers.updatedAt.notNull).toBe(true)
      })

      it('should have nullable industry', () => {
        expect(customers.industry.notNull).toBe(false)
      })

      it('should have nullable companySize', () => {
        expect(customers.companySize.notNull).toBe(false)
      })

      it('should have nullable websiteUrl', () => {
        expect(customers.websiteUrl.notNull).toBe(false)
      })

      it('should have nullable billingCountry', () => {
        expect(customers.billingCountry.notNull).toBe(false)
      })
    })
  })

  describe('people table', () => {
    it('should export people table constant', () => {
      expect(people).toBeDefined()
      expect(typeof people).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(people)).toBe('people')
    })

    describe('columns', () => {
      it('should have personId column', () => {
        expect(people.personId).toBeDefined()
        expect(people.personId.name).toBe('user_id')
      })

      it('should have firstName column', () => {
        expect(people.firstName).toBeDefined()
        expect(people.firstName.name).toBe('first_name')
      })

      it('should have lastName column', () => {
        expect(people.lastName).toBeDefined()
        expect(people.lastName.name).toBe('last_name')
      })

      it('should have email column', () => {
        expect(people.email).toBeDefined()
        expect(people.email.name).toBe('email')
      })

      it('should have phone column', () => {
        expect(people.phone).toBeDefined()
        expect(people.phone.name).toBe('phone')
      })

      it('should have jobTitle column', () => {
        expect(people.jobTitle).toBeDefined()
        expect(people.jobTitle.name).toBe('job_title')
      })

      it('should have linkedinUrl column', () => {
        expect(people.linkedinUrl).toBeDefined()
        expect(people.linkedinUrl.name).toBe('linkedin_url')
      })

      it('should have isActive column', () => {
        expect(people.isActive).toBeDefined()
        expect(people.isActive.name).toBe('is_active')
      })

      it('should have createdAt column', () => {
        expect(people.createdAt).toBeDefined()
        expect(people.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(people.updatedAt).toBeDefined()
        expect(people.updatedAt.name).toBe('updated_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on personId', () => {
        expect(people.personId.primary).toBe(true)
      })

      it('should have not null constraint on firstName', () => {
        expect(people.firstName.notNull).toBe(true)
      })

      it('should have not null constraint on lastName', () => {
        expect(people.lastName.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(people.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(people.updatedAt.notNull).toBe(true)
      })

      it('should have nullable email', () => {
        expect(people.email.notNull).toBe(false)
      })

      it('should have nullable phone', () => {
        expect(people.phone.notNull).toBe(false)
      })

      it('should have nullable jobTitle', () => {
        expect(people.jobTitle.notNull).toBe(false)
      })

      it('should have nullable linkedinUrl', () => {
        expect(people.linkedinUrl.notNull).toBe(false)
      })

      it('should have nullable isActive with default', () => {
        expect(people.isActive.notNull).toBe(false)
      })
    })
  })

  describe('customerPeople table', () => {
    it('should export customerPeople table constant', () => {
      expect(customerPeople).toBeDefined()
      expect(typeof customerPeople).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(customerPeople)).toBe('customer_people')
    })

    describe('columns', () => {
      it('should have customerPersonId column', () => {
        expect(customerPeople.customerPersonId).toBeDefined()
        expect(customerPeople.customerPersonId.name).toBe('customer_person_id')
      })

      it('should have customerId column', () => {
        expect(customerPeople.customerId).toBeDefined()
        expect(customerPeople.customerId.name).toBe('customer_id')
      })

      it('should have personId column', () => {
        expect(customerPeople.personId).toBeDefined()
        expect(customerPeople.personId.name).toBe('person_id')
      })

      it('should have role column', () => {
        expect(customerPeople.role).toBeDefined()
        expect(customerPeople.role.name).toBe('role')
      })

      it('should have isPrimary column', () => {
        expect(customerPeople.isPrimary).toBeDefined()
        expect(customerPeople.isPrimary.name).toBe('is_primary')
      })

      it('should have startDate column', () => {
        expect(customerPeople.startDate).toBeDefined()
        expect(customerPeople.startDate.name).toBe('start_date')
      })

      it('should have endDate column', () => {
        expect(customerPeople.endDate).toBeDefined()
        expect(customerPeople.endDate.name).toBe('end_date')
      })

      it('should have createdAt column', () => {
        expect(customerPeople.createdAt).toBeDefined()
        expect(customerPeople.createdAt.name).toBe('created_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on customerPersonId', () => {
        expect(customerPeople.customerPersonId.primary).toBe(true)
      })

      it('should have not null constraint on customerId', () => {
        expect(customerPeople.customerId.notNull).toBe(true)
      })

      it('should have not null constraint on personId', () => {
        expect(customerPeople.personId.notNull).toBe(true)
      })

      it('should have not null constraint on role', () => {
        expect(customerPeople.role.notNull).toBe(true)
      })

      it('should have not null constraint on startDate', () => {
        expect(customerPeople.startDate.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(customerPeople.createdAt.notNull).toBe(true)
      })

      it('should have nullable isPrimary with default', () => {
        expect(customerPeople.isPrimary.notNull).toBe(false)
      })

      it('should have nullable endDate', () => {
        expect(customerPeople.endDate.notNull).toBe(false)
      })
    })
  })

  describe('DBCustomer type', () => {
    it('should be a valid insert type', () => {
      const mockCustomer: DBCustomer = {
        legalName: 'Acme Corporation',
        displayName: 'Acme Corp',
        timezone: 'America/New_York',
      }

      expect(mockCustomer).toBeDefined()
      expect(mockCustomer.legalName).toBe('Acme Corporation')
      expect(mockCustomer.displayName).toBe('Acme Corp')
    })

    it('should allow optional fields', () => {
      const mockCustomer: DBCustomer = {
        legalName: 'Tech Startup Inc',
        displayName: 'Tech Startup',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://example.com',
        billingCountry: 'US',
      }

      expect(mockCustomer.industry).toBe('Technology')
      expect(mockCustomer.companySize).toBe(50)
      expect(mockCustomer.websiteUrl).toBe('https://example.com')
      expect(mockCustomer.billingCountry).toBe('US')
    })

    it('should allow status enum values', () => {
      const statuses: DBCustomer['status'][] = ['prospect', 'active', 'paused', 'churned']

      statuses.forEach((status) => {
        const mockCustomer: DBCustomer = {
          legalName: 'Test Company',
          displayName: 'Test',
          status,
        }
        expect(mockCustomer.status).toBe(status)
      })
    })
  })

  describe('DBCustomerSelect type', () => {
    it('should be a valid select type', () => {
      const mockCustomer: DBCustomerSelect = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        legalName: 'Acme Corporation',
        displayName: 'Acme Corp',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: null,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(mockCustomer).toBeDefined()
      expect(mockCustomer.customerId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockCustomer.status).toBe('active')
    })
  })

  describe('DBPerson type', () => {
    it('should be a valid insert type', () => {
      const mockPerson: DBPerson = {
        firstName: 'John',
        lastName: 'Doe',
      }

      expect(mockPerson).toBeDefined()
      expect(mockPerson.firstName).toBe('John')
      expect(mockPerson.lastName).toBe('Doe')
    })

    it('should allow optional fields', () => {
      const mockPerson: DBPerson = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        jobTitle: 'CEO',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        isActive: true,
      }

      expect(mockPerson.email).toBe('jane@example.com')
      expect(mockPerson.phone).toBe('+1234567890')
      expect(mockPerson.jobTitle).toBe('CEO')
      expect(mockPerson.linkedinUrl).toBe('https://linkedin.com/in/janesmith')
      expect(mockPerson.isActive).toBe(true)
    })
  })

  describe('DBPersonSelect type', () => {
    it('should be a valid select type', () => {
      const mockPerson: DBPersonSelect = {
        personId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: null,
        phone: null,
        jobTitle: null,
        linkedinUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(mockPerson).toBeDefined()
      expect(mockPerson.personId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockPerson.firstName).toBe('John')
    })
  })

  describe('DBCustomerPerson type', () => {
    it('should be a valid insert type', () => {
      const mockRelation: DBCustomerPerson = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        personId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'primary_contact',
      }

      expect(mockRelation).toBeDefined()
      expect(mockRelation.customerId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockRelation.personId).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
      expect(mockRelation.role).toBe('primary_contact')
    })

    it('should allow all contact role enum values', () => {
      const roles: DBCustomerPerson['role'][] = [
        'primary_contact',
        'decision_maker',
        'billing_contact',
        'technical_contact',
        'stakeholder',
      ]

      roles.forEach((role) => {
        const mockRelation: DBCustomerPerson = {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          personId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
          role,
        }
        expect(mockRelation.role).toBe(role)
      })
    })

    it('should allow optional fields', () => {
      const mockRelation: DBCustomerPerson = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        personId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'primary_contact',
        isPrimary: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      expect(mockRelation.isPrimary).toBe(true)
      expect(mockRelation.startDate).toBe('2024-01-01')
      expect(mockRelation.endDate).toBe('2024-12-31')
    })
  })

  describe('DBCustomerPersonSelect type', () => {
    it('should be a valid select type', () => {
      const mockRelation: DBCustomerPersonSelect = {
        customerPersonId: '111e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        personId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'primary_contact',
        isPrimary: false,
        startDate: '2024-01-01',
        endDate: null,
        createdAt: new Date(),
      }

      expect(mockRelation).toBeDefined()
      expect(mockRelation.customerPersonId).toBe('111e4567-e89b-12d3-a456-426614174000')
      expect(mockRelation.role).toBe('primary_contact')
    })
  })

  describe('table structure validation', () => {
    it('should have all three table constants exported', () => {
      const tables = [customers, people, customerPeople]
      expect(tables).toHaveLength(3)
      tables.forEach((table) => {
        expect(table).toBeDefined()
        expect(typeof table).toBe('object')
      })
    })

    it('should have unique table names', () => {
      const tableNames = [
        getTableName(customers),
        getTableName(people),
        getTableName(customerPeople),
      ]
      const uniqueNames = new Set(tableNames)
      expect(uniqueNames.size).toBe(3)
    })

    it('should have consistent timestamp column naming', () => {
      expect(customers.createdAt.name).toBe('created_at')
      expect(customers.updatedAt.name).toBe('updated_at')
      expect(people.createdAt.name).toBe('created_at')
      expect(people.updatedAt.name).toBe('updated_at')
      expect(customerPeople.createdAt.name).toBe('created_at')
    })

    it('should have consistent primary key naming pattern', () => {
      expect(customers.customerId.name).toBe('user_id')
      expect(people.personId.name).toBe('user_id')
      expect(customerPeople.customerPersonId.name).toBe('customer_person_id')
    })

    it('should have consistent foreign key naming pattern', () => {
      expect(customerPeople.customerId.name).toBe('customer_id')
      expect(customerPeople.personId.name).toBe('person_id')
    })
  })
})
