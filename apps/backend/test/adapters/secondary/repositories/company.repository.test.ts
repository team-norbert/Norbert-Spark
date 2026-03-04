import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyRepository } from '../../../../src/adapters/secondary/repositories/company.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import type {
  DBCompanySelect,
  DBKeyPersonSelect,
} from '../../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))

describe('CompanyRepository', () => {
  let repository: CompanyRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = createMockLogger()

    repository = new CompanyRepository(mockLogger)
  })

  describe('getCompanyDetails()', () => {
    it('should successfully fetch company details', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Test Company LLC',
        displayName: 'Test Company',
        status: 'active',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://testcompany.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockCompany])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getCompanyDetails()

      expect(result).toEqual(mockCompany)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details from the database')
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return null when no company exists', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getCompanyDetails()

      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details from the database')
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return null when company result is undefined', async () => {
      const mockLimit = vi.fn().mockResolvedValue([undefined])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getCompanyDetails()

      expect(result).toBeNull()
    })

    it('should handle company with null optional fields', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Minimal Company',
        displayName: 'Minimal',
        status: 'prospect',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'CA',
        timezone: 'America/Toronto',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockCompany])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getCompanyDetails()

      expect(result).toEqual(mockCompany)
      expect(result?.industry).toBeNull()
      expect(result?.companySize).toBeNull()
      expect(result?.websiteUrl).toBeNull()
    })

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed')
      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getCompanyDetails()).rejects.toThrow('Database connection failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching company details', dbError)
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Query timeout')
      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getCompanyDetails()).rejects.toThrow('Query timeout')
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching company details', dbError)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details from the database')
    })

    it('should handle all company statuses', async () => {
      const statuses: Array<'active' | 'prospect' | 'paused' | 'churned'> = [
        'active',
        'prospect',
        'paused',
        'churned',
      ]

      for (const status of statuses) {
        vi.clearAllMocks()

        const mockCompany: DBCompanySelect = {
          companyId: uuidv7(),
          legalName: 'Test Company LLC',
          displayName: 'Test Company',
          status,
          industry: 'Technology',
          companySize: 50,
          websiteUrl: 'https://test.com',
          billingCountry: 'US',
          timezone: 'UTC',
          singletonCheck: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        const mockLimit = vi.fn().mockResolvedValue([mockCompany])
        const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
        vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

        const result = await repository.getCompanyDetails()

        expect(result?.status).toBe(status)
      }
    })

    it('should limit query to 1 result', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Test Company',
        displayName: 'Test',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockCompany])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await repository.getCompanyDetails()

      expect(mockLimit).toHaveBeenCalledWith(1)
      expect(mockLimit).toHaveBeenCalledTimes(1)
    })
  })

  describe('getKeyPersonDetails()', () => {
    it('should successfully fetch key person details', async () => {
      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        jobTitle: 'CEO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockKeyPerson])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getKeyPersonDetails()

      expect(result).toEqual(mockKeyPerson)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching key person details from the database')
      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should return null when no key person exists', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getKeyPersonDetails()

      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching key person details from the database')
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return null when key person result is undefined', async () => {
      const mockLimit = vi.fn().mockResolvedValue([undefined])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getKeyPersonDetails()

      expect(result).toBeNull()
    })

    it('should handle key person with null optional fields', async () => {
      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockKeyPerson])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getKeyPersonDetails()

      expect(result).toEqual(mockKeyPerson)
      expect(result?.phone).toBeNull()
      expect(result?.jobTitle).toBeNull()
    })

    it('should handle inactive key person', async () => {
      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Inactive',
        lastName: 'Person',
        email: 'inactive@example.com',
        phone: null,
        jobTitle: 'Former CEO',
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockKeyPerson])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getKeyPersonDetails()

      expect(result?.isActive).toBe(false)
    })

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed')
      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getKeyPersonDetails()).rejects.toThrow('Database connection failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching key person details', dbError)
    })

    it('should log error and rethrow on database failure', async () => {
      const dbError = new Error('Query timeout')
      const mockLimit = vi.fn().mockRejectedValue(dbError)
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getKeyPersonDetails()).rejects.toThrow('Query timeout')
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching key person details', dbError)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching key person details from the database')
    })

    it('should limit query to 1 result', async () => {
      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockKeyPerson])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await repository.getKeyPersonDetails()

      expect(mockLimit).toHaveBeenCalledWith(1)
      expect(mockLimit).toHaveBeenCalledTimes(1)
    })
  })

  describe('constructor()', () => {
    it('should create instance with logger dependency', () => {
      const instance = new CompanyRepository(mockLogger)

      expect(instance).toBeInstanceOf(CompanyRepository)
      expect(instance).toBeDefined()
    })

    it('should implement CompanyDetailsPort', () => {
      expect(repository.getCompanyDetails).toBeDefined()
      expect(repository.getKeyPersonDetails).toBeDefined()
      expect(typeof repository.getCompanyDetails).toBe('function')
      expect(typeof repository.getKeyPersonDetails).toBe('function')
    })
  })

  describe('logging behavior', () => {
    it('should log before fetching company details', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await repository.getCompanyDetails()

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details from the database')
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should log before fetching key person details', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await repository.getKeyPersonDetails()

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching key person details from the database')
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should not log error when query succeeds', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await repository.getCompanyDetails()
      await repository.getKeyPersonDetails()

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('should handle concurrent calls to both methods', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Concurrent Test LLC',
        displayName: 'Concurrent Test',
        status: 'active',
        industry: 'Software',
        companySize: 100,
        websiteUrl: 'https://concurrent.test',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Concurrent',
        lastName: 'User',
        email: 'concurrent@test.com',
        phone: '+1234567890',
        jobTitle: 'CTO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi
        .fn()
        .mockResolvedValueOnce([mockCompany])
        .mockResolvedValueOnce([mockKeyPerson])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const [companyResult, keyPersonResult] = await Promise.all([
        repository.getCompanyDetails(),
        repository.getKeyPersonDetails(),
      ])

      expect(companyResult).toEqual(mockCompany)
      expect(keyPersonResult).toEqual(mockKeyPerson)
      expect(db.select).toHaveBeenCalledTimes(2)
    })

    it('should handle multiple sequential calls', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Sequential Test',
        displayName: 'Sequential',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockLimit = vi.fn().mockResolvedValue([mockCompany])
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result1 = await repository.getCompanyDetails()
      const result2 = await repository.getCompanyDetails()

      expect(result1).toEqual(mockCompany)
      expect(result2).toEqual(mockCompany)
      expect(db.select).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
    })
  })

  describe('putCompanyDetails()', () => {
    it('should successfully update company details', async () => {
      const updateData = {
        legalName: 'Updated Company LLC',
        displayName: 'Updated Company',
        status: 'active' as const,
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Updated Company LLC',
        displayName: 'Updated Company',
        status: 'active',
        industry: 'Technology',
        companySize: 75,
        websiteUrl: 'https://updated.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toEqual(mockUpdatedCompany)
      expect(mockLogger.info).toHaveBeenCalledWith('Updating company details in the database')
      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(mockReturning).toHaveBeenCalledTimes(1)
    })

    it('should return null when no company exists to update', async () => {
      const updateData = { displayName: 'New Name' }

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Updating company details in the database')
    })

    it('should return null when update result is undefined', async () => {
      const updateData = { legalName: 'Test LLC' }

      const mockReturning = vi.fn().mockResolvedValue([undefined])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toBeNull()
    })

    it('should handle partial updates with only required fields', async () => {
      const updateData = { legalName: 'Minimal Update' }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Minimal Update',
        displayName: 'Original Display',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toEqual(mockUpdatedCompany)
      expect(result?.legalName).toBe('Minimal Update')
    })

    it('should handle updates with all fields', async () => {
      const updateData = {
        legalName: 'Complete Update LLC',
        displayName: 'Complete Update',
        status: 'paused' as const,
        industry: 'Finance',
        companySize: 200,
        websiteUrl: 'https://complete.com',
        billingCountry: 'CA',
        timezone: 'America/Toronto',
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        ...updateData,
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toEqual(mockUpdatedCompany)
      expect(result?.status).toBe('paused')
      expect(result?.industry).toBe('Finance')
      expect(result?.companySize).toBe(200)
      expect(result?.websiteUrl).toBe('https://complete.com')
      expect(result?.billingCountry).toBe('CA')
      expect(result?.timezone).toBe('America/Toronto')
    })

    it('should handle updating status to different values', async () => {
      const statuses: Array<'active' | 'prospect' | 'paused' | 'churned'> = [
        'active',
        'prospect',
        'paused',
        'churned',
      ]

      for (const status of statuses) {
        vi.clearAllMocks()

        const updateData = { status }

        const mockUpdatedCompany: DBCompanySelect = {
          companyId: uuidv7(),
          legalName: 'Test Company',
          displayName: 'Test',
          status,
          industry: null,
          companySize: null,
          websiteUrl: null,
          billingCountry: 'US',
          timezone: 'UTC',
          singletonCheck: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }

        const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
        const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

        const result = await repository.putCompanyDetails(updateData)

        expect(result?.status).toBe(status)
      }
    })

    it('should handle updating nullable fields to null', async () => {
      const updateData = {
        industry: null,
        companySize: null,
        websiteUrl: null,
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Test Company',
        displayName: 'Test',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result?.industry).toBeNull()
      expect(result?.companySize).toBeNull()
      expect(result?.websiteUrl).toBeNull()
    })

    it('should throw error when database update fails', async () => {
      const updateData = { legalName: 'Failed Update' }
      const dbError = new Error('Database connection failed')

      const mockReturning = vi.fn().mockRejectedValue(dbError)
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await expect(repository.putCompanyDetails(updateData)).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating company details', dbError)
    })

    it('should log error and rethrow on database failure', async () => {
      const updateData = { displayName: 'Error Test' }
      const dbError = new Error('Query timeout')

      const mockReturning = vi.fn().mockRejectedValue(dbError)
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await expect(repository.putCompanyDetails(updateData)).rejects.toThrow('Query timeout')
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating company details', dbError)
      expect(mockLogger.info).toHaveBeenCalledWith('Updating company details in the database')
    })

    it('should handle empty update data object', async () => {
      const updateData = {}

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Unchanged Company',
        displayName: 'Unchanged',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result).toEqual(mockUpdatedCompany)
    })

    it('should include updatedAt timestamp in update', async () => {
      const updateData = { legalName: 'Timestamp Test' }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Timestamp Test',
        displayName: 'Test',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putCompanyDetails(updateData)

      expect(result?.updatedAt).toBeInstanceOf(Date)
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining(updateData))
    })

    it('should update only the singleton company record', async () => {
      const updateData = { legalName: 'Singleton Update' }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Singleton Update',
        displayName: 'Singleton',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'US',
        timezone: 'UTC',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedCompany])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await repository.putCompanyDetails(updateData)

      // Verify where clause is called (ensures singleton targeting)
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(mockReturning).toHaveBeenCalledTimes(1)
    })
  })

  describe('putKeyPersonDetails()', () => {
    it('should successfully update key person details', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
        jobTitle: 'CEO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toEqual(mockUpdatedKeyPerson)
      expect(mockLogger.info).toHaveBeenCalledWith('Updating key person details in the database')
      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledTimes(1)
      expect(mockReturning).toHaveBeenCalledTimes(1)
    })

    it('should return null when no key person exists to update', async () => {
      const updateData = { firstName: 'John' }

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith('Updating key person details in the database')
    })

    it('should return null when update result is undefined', async () => {
      const updateData = { email: 'test@example.com' }

      const mockReturning = vi.fn().mockResolvedValue([undefined])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toBeNull()
    })

    it('should handle partial updates with only required fields', async () => {
      const updateData = { firstName: 'Updated' }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Updated',
        lastName: 'Original',
        email: 'original@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toEqual(mockUpdatedKeyPerson)
      expect(result?.firstName).toBe('Updated')
    })

    it('should handle updates with all fields', async () => {
      const updateData = {
        firstName: 'Complete',
        lastName: 'Update',
        email: 'complete@example.com',
        phone: '+9876543210',
        jobTitle: 'CTO',
        isActive: false,
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        ...updateData,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toEqual(mockUpdatedKeyPerson)
      expect(result?.firstName).toBe('Complete')
      expect(result?.lastName).toBe('Update')
      expect(result?.email).toBe('complete@example.com')
      expect(result?.phone).toBe('+9876543210')
      expect(result?.jobTitle).toBe('CTO')
      expect(result?.isActive).toBe(false)
    })

    it('should handle updating isActive status', async () => {
      const updateData = { isActive: false }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Test',
        lastName: 'Person',
        email: 'test@example.com',
        phone: null,
        jobTitle: null,
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result?.isActive).toBe(false)
    })

    it('should handle updating nullable fields to null', async () => {
      const updateData = {
        phone: null,
        jobTitle: null,
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Test',
        lastName: 'Person',
        email: 'test@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result?.phone).toBeNull()
      expect(result?.jobTitle).toBeNull()
    })

    it('should handle updating nullable fields to values', async () => {
      const updateData = {
        phone: '+1111111111',
        jobTitle: 'VP Engineering',
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Test',
        lastName: 'Person',
        email: 'test@example.com',
        phone: '+1111111111',
        jobTitle: 'VP Engineering',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result?.phone).toBe('+1111111111')
      expect(result?.jobTitle).toBe('VP Engineering')
    })

    it('should throw error when database update fails', async () => {
      const updateData = { firstName: 'Failed' }
      const dbError = new Error('Database connection failed')

      const mockReturning = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await expect(repository.putKeyPersonDetails(updateData)).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating key person details', dbError)
    })

    it('should log error and rethrow on database failure', async () => {
      const updateData = { lastName: 'Error Test' }
      const dbError = new Error('Query timeout')

      const mockReturning = vi.fn().mockRejectedValue(dbError)
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await expect(repository.putKeyPersonDetails(updateData)).rejects.toThrow('Query timeout')
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating key person details', dbError)
      expect(mockLogger.info).toHaveBeenCalledWith('Updating key person details in the database')
    })

    it('should handle empty update data object', async () => {
      const updateData = {}

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Unchanged',
        lastName: 'Person',
        email: 'unchanged@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result).toEqual(mockUpdatedKeyPerson)
    })

    it('should include updatedAt timestamp in update', async () => {
      const updateData = { firstName: 'Timestamp' }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Timestamp',
        lastName: 'Test',
        email: 'timestamp@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      const result = await repository.putKeyPersonDetails(updateData)

      expect(result?.updatedAt).toBeInstanceOf(Date)
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining(updateData))
    })

    it('should update the singleton key person record without where clause', async () => {
      const updateData = { firstName: 'Singleton' }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Singleton',
        lastName: 'Person',
        email: 'singleton@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedKeyPerson])
      const mockSet = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)

      await repository.putKeyPersonDetails(updateData)

      // Verify no where clause (singleton enforced by DB constraint)
      expect(mockSet).toHaveBeenCalledTimes(1)
      expect(mockReturning).toHaveBeenCalledTimes(1)
    })
  })
})
