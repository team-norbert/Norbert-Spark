import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../../../src/application/ports/company.repository.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { UpdateCompanyDetailsData } from '../../../src/application/use-cases/put-company-details.use-case.js'
import { PutCompanyDetailsUseCase } from '../../../src/application/use-cases/put-company-details.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import type {
  DBCompanySelect,
  DBKeyPersonSelect,
} from '../../../src/infrastructure/database/schema.js'

describe('PutCompanyDetailsUseCase', () => {
  let useCase: PutCompanyDetailsUseCase
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
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

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

    // Create use case instance with mocks
    useCase = new PutCompanyDetailsUseCase(mockLogger, mockAuditLog, mockCompanyDetailsRepo)
  })

  describe('execute() - company updates', () => {
    it('should update company details successfully', async () => {
      const companyId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          legalName: 'Updated Company LLC',
          displayName: 'Updated Company',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Updated Company LLC',
        displayName: 'Updated Company',
        status: 'active',
        industry: 'Technology',
        companySize: 50,
        websiteUrl: 'https://updated.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
        singletonCheck: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: mockUpdatedCompany,
        keyPerson: undefined,
      })
      expect(mockCompanyDetailsRepo.putCompanyDetails).toHaveBeenCalledWith(updateData.company)
      expect(mockCompanyDetailsRepo.putCompanyDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).not.toHaveBeenCalled()
    })

    it('should log audit entry when company update succeeds', async () => {
      const companyId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          legalName: 'Audit Test Company',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Audit Test Company',
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

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)

      await useCase.execute(auditContext, updateData)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: EntityType.COMPANY,
        entityId: companyId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'company_details_updated_successfully',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should return null company when update returns null', async () => {
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId: uuidv7(),
          legalName: 'Nonexistent Company',
        },
      }

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: null,
        keyPerson: undefined,
      })
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should handle audit logging failure gracefully for company', async () => {
      const companyId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          displayName: 'Audit Fail Test',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Test Company',
        displayName: 'Audit Fail Test',
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

      const auditError = new Error('Audit log service unavailable')

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: mockUpdatedCompany,
        keyPerson: undefined,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for company details retrieval',
        auditError,
        { userId: auditContext.userId }
      )
    })
  })

  describe('execute() - key person updates', () => {
    it('should update key person details successfully', async () => {
      const keyPersonId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        keyPerson: {
          keyPersonId,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
        },
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+1234567890',
        jobTitle: 'CEO',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(mockUpdatedKeyPerson)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: undefined,
        keyPerson: mockUpdatedKeyPerson,
      })
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).toHaveBeenCalledWith(updateData.keyPerson)
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.putCompanyDetails).not.toHaveBeenCalled()
    })

    it('should log audit entry when key person update succeeds', async () => {
      const keyPersonId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        keyPerson: {
          keyPersonId,
          firstName: 'Audit',
          lastName: 'Test',
        },
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId,
        firstName: 'Audit',
        lastName: 'Test',
        email: 'audit@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(mockUpdatedKeyPerson)

      await useCase.execute(auditContext, updateData)

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: EntityType.KEY_PERSON,
        entityId: keyPersonId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'key_person_details_updated_successfully',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
    })

    it('should return null key person when update returns null', async () => {
      const updateData: UpdateCompanyDetailsData = {
        keyPerson: {
          keyPersonId: uuidv7(),
          firstName: 'Nonexistent',
        },
      }

      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: undefined,
        keyPerson: null,
      })
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })

    it('should handle audit logging failure gracefully for key person', async () => {
      const keyPersonId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        keyPerson: {
          keyPersonId,
          isActive: false,
        },
      }

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId,
        firstName: 'Test',
        lastName: 'Person',
        email: 'test@example.com',
        phone: null,
        jobTitle: null,
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      const auditError = new Error('Audit database connection failed')

      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(mockUpdatedKeyPerson)
      vi.mocked(mockAuditLog.log).mockRejectedValue(auditError)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: undefined,
        keyPerson: mockUpdatedKeyPerson,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error logging audit for key person details retrieval',
        auditError,
        { userId: auditContext.userId }
      )
    })
  })

  describe('execute() - combined updates', () => {
    it('should update both company and key person successfully', async () => {
      const companyId = uuidv7()
      const keyPersonId = uuidv7()

      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          legalName: 'Combined Update LLC',
        },
        keyPerson: {
          keyPersonId,
          firstName: 'John',
          lastName: 'Smith',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Combined Update LLC',
        displayName: 'Combined',
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

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)
      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(mockUpdatedKeyPerson)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: mockUpdatedCompany,
        keyPerson: mockUpdatedKeyPerson,
      })
      expect(mockCompanyDetailsRepo.putCompanyDetails).toHaveBeenCalledWith(updateData.company)
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).toHaveBeenCalledWith(updateData.keyPerson)
      expect(mockCompanyDetailsRepo.putCompanyDetails).toHaveBeenCalledTimes(1)
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).toHaveBeenCalledTimes(1)
    })

    it('should log audit entries for both updates', async () => {
      const companyId = uuidv7()
      const keyPersonId = uuidv7()

      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          displayName: 'Both Audit Test',
        },
        keyPerson: {
          keyPersonId,
          email: 'bothaudit@example.com',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Test',
        displayName: 'Both Audit Test',
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

      const mockUpdatedKeyPerson: DBKeyPersonSelect = {
        keyPersonId,
        firstName: 'Test',
        lastName: 'Person',
        email: 'bothaudit@example.com',
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)
      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(mockUpdatedKeyPerson)

      await useCase.execute(auditContext, updateData)

      expect(mockAuditLog.log).toHaveBeenCalledTimes(2)
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: EntityType.COMPANY,
        entityId: companyId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'company_details_updated_successfully',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: auditContext.userId,
        entityType: EntityType.KEY_PERSON,
        entityId: keyPersonId,
        action: AuditAction.UPDATE,
        changes: {
          reason: 'key_person_details_updated_successfully',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })
    })

    it('should handle partial success when company updates but key person fails', async () => {
      const companyId = uuidv7()
      const keyPersonId = uuidv7()

      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          status: 'active',
        },
        keyPerson: {
          keyPersonId,
          firstName: 'Fail',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Test',
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

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)
      vi.mocked(mockCompanyDetailsRepo.putKeyPersonDetails).mockResolvedValue(null)

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: mockUpdatedCompany,
        keyPerson: null,
      })
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: EntityType.COMPANY,
        })
      )
    })
  })

  describe('execute() - empty updates', () => {
    it('should handle empty update data', async () => {
      const updateData: UpdateCompanyDetailsData = {}

      const result = await useCase.execute(auditContext, updateData)

      expect(result).toEqual({
        company: undefined,
        keyPerson: undefined,
      })
      expect(mockCompanyDetailsRepo.putCompanyDetails).not.toHaveBeenCalled()
      expect(mockCompanyDetailsRepo.putKeyPersonDetails).not.toHaveBeenCalled()
      expect(mockAuditLog.log).not.toHaveBeenCalled()
    })
  })

  describe('execute() - audit context', () => {
    it('should use audit context userId in audit logs', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const customAuditContext: AuditContext = {
        userId,
        ipAddress: '192.168.1.100',
        userAgent: 'custom-agent',
      }

      const companyId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          legalName: 'Context Test',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'Context Test',
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

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)

      await useCase.execute(customAuditContext, updateData)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          ipAddress: '192.168.1.100',
          userAgent: 'custom-agent',
        })
      )
    })

    it('should handle null userAgent in audit context', async () => {
      const auditContextNoAgent: AuditContext = {
        userId: new UserId(uuidv7()).getValue(),
        ipAddress: '10.0.0.1',
        userAgent: null,
      }

      const companyId = uuidv7()
      const updateData: UpdateCompanyDetailsData = {
        company: {
          companyId,
          legalName: 'No Agent Test',
        },
      }

      const mockUpdatedCompany: DBCompanySelect = {
        companyId,
        legalName: 'No Agent Test',
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

      vi.mocked(mockCompanyDetailsRepo.putCompanyDetails).mockResolvedValue(mockUpdatedCompany)

      await useCase.execute(auditContextNoAgent, updateData)

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: undefined,
        })
      )
    })
  })

  describe('constructor', () => {
    it('should create instance with all dependencies', () => {
      const instance = new PutCompanyDetailsUseCase(
        mockLogger,
        mockAuditLog,
        mockCompanyDetailsRepo
      )

      expect(instance).toBeInstanceOf(PutCompanyDetailsUseCase)
      expect(instance).toBeDefined()
    })
  })
})
