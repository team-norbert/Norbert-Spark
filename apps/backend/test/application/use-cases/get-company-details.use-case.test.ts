import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../../../src/application/ports/company.repository.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetCompanyDetailsUseCase } from '../../../src/application/use-cases/get-company-details.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import type {
  DBCompanySelect,
  DBKeyPersonSelect,
} from '../../../src/infrastructure/database/schema.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('GetCompanyDetailsUseCase', () => {
  let useCase: GetCompanyDetailsUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockCompanyDetailsRepo: CompanyDetailsPort
  let auditContext: AuditContext

  beforeEach(() => {
    vi.clearAllMocks()

    // Create audit context
    auditContext = {
      userId: new UserId(uuidv7()).getValue(),
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent',
    }

    // Create mock implementations
    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockCompanyDetailsRepo = {
      getCompanyDetails: vi.fn(),
      getKeyPersonDetails: vi.fn(),
      putCompanyDetails: vi.fn(),
      putKeyPersonDetails: vi.fn(),
    }

    // Create use case instance with mocks (auditLog parameter is still in constructor but not used)
    useCase = new GetCompanyDetailsUseCase(mockLogger, mockAuditLog, mockCompanyDetailsRepo)
  })

  describe('execute() - successful scenarios', () => {
    it('should retrieve company and key person details successfully', async () => {
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

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(mockKeyPerson)

      const result = await useCase.execute(auditContext)

      expect(result).toEqual({
        company: mockCompany,
        keyPerson: mockKeyPerson,
      })
      expect(mockCompanyDetailsRepo.getCompanyDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.getKeyPersonDetails).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details')
      expect(mockLogger.info).toHaveBeenCalledWith('Company details fetched successfully')
    })

    it('should handle null company and key person', async () => {
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(null)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result).toEqual({
        company: null,
        keyPerson: null,
      })
      expect(mockCompanyDetailsRepo.getCompanyDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.getKeyPersonDetails).toHaveBeenCalledTimes(1)
    })

    it('should handle null company with valid key person', async () => {
      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: null,
        jobTitle: 'CTO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(null)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(mockKeyPerson)

      const result = await useCase.execute(auditContext)

      expect(result).toEqual({
        company: null,
        keyPerson: mockKeyPerson,
      })
    })

    it('should handle valid company with null key person', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Test Corp',
        displayName: 'Test',
        status: 'active',
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: 'CA',
        timezone: 'America/Toronto',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result).toEqual({
        company: mockCompany,
        keyPerson: null,
      })
    })

    it('should fetch company and key person details in parallel', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Parallel Test LLC',
        displayName: 'Parallel Test',
        status: 'active',
        industry: 'Software',
        companySize: 100,
        websiteUrl: 'https://parallel.test',
        billingCountry: 'US',
        timezone: 'America/Los_Angeles',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockKeyPerson: DBKeyPersonSelect = {
        keyPersonId: uuidv7(),
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@parallel.test',
        phone: '+1234567890',
        jobTitle: 'CEO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      let companyCallOrder = 0
      let keyPersonCallOrder = 0
      const callOrderTracker = { counter: 0 }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockImplementation(async () => {
        companyCallOrder = ++callOrderTracker.counter
        await new Promise((resolve) => resolve(undefined))
        return mockCompany
      })

      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockImplementation(async () => {
        keyPersonCallOrder = ++callOrderTracker.counter
        await new Promise((resolve) => resolve(undefined))
        return mockKeyPerson
      })

      await useCase.execute(auditContext)

      // Both should be called (order may vary due to Promise.all)
      expect(companyCallOrder).toBeGreaterThan(0)
      expect(keyPersonCallOrder).toBeGreaterThan(0)
      expect(mockCompanyDetailsRepo.getCompanyDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.getKeyPersonDetails).toHaveBeenCalledTimes(1)
    })
  })

  describe('execute() - error scenarios', () => {
    it('should throw error when company repository fails', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockRejectedValue(repositoryError)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      await expect(useCase.execute(auditContext)).rejects.toThrow('Database connection failed')
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details')
    })

    it('should throw error when key person repository fails', async () => {
      const repositoryError = new Error('Key person fetch failed')
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(null)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockRejectedValue(repositoryError)

      await expect(useCase.execute(auditContext)).rejects.toThrow('Key person fetch failed')
    })

    it('should throw error when both repositories fail', async () => {
      const error1 = new Error('Company fetch failed')
      const error2 = new Error('Key person fetch failed')
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockRejectedValue(error1)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockRejectedValue(error2)

      await expect(useCase.execute(auditContext)).rejects.toThrow()
    })

    it('should not log success message when repository fails', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockRejectedValue(error)

      await expect(useCase.execute(auditContext)).rejects.toThrow()

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details')
      expect(mockLogger.info).not.toHaveBeenCalledWith('Company details fetched successfully')
    })
  })

  describe('execute() - logging behavior', () => {
    it('should log before and after fetching details', async () => {
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(null)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      await useCase.execute(auditContext)

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Fetching company details')
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Company details fetched successfully')
    })

    it('should only log initial message when error occurs', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockRejectedValue(error)

      await expect(useCase.execute(auditContext)).rejects.toThrow()

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching company details')
    })
  })

  describe('execute() - different company statuses', () => {
    it('should handle active company status', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Active Company LLC',
        displayName: 'Active Company',
        status: 'active',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://active.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result.company?.status).toBe('active')
    })

    it('should handle paused company status', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Paused Company LLC',
        displayName: 'Paused Company',
        status: 'paused',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://paused.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result.company?.status).toBe('paused')
    })

    it('should handle churned company status', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Churned Company LLC',
        displayName: 'Churned Company',
        status: 'churned',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://churned.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result.company?.status).toBe('churned')
    })

    it('should handle prospect company status', async () => {
      const mockCompany: DBCompanySelect = {
        companyId: uuidv7(),
        legalName: 'Prospect Company LLC',
        displayName: 'Prospect Company',
        status: 'prospect',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://prospect.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      vi.mocked(mockCompanyDetailsRepo.getCompanyDetails).mockResolvedValue(mockCompany)
      vi.mocked(mockCompanyDetailsRepo.getKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext)

      expect(result.company?.status).toBe('prospect')
    })
  })
})
