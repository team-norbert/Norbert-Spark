import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyController } from '../../../../src/adapters/primary/http/company.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { GetCompanyDetailsUseCase } from '../../../../src/application/use-cases/get-company-details.use-case.js'
import type {
  DBCompanySelect,
  DBKeyPersonSelect,
} from '../../../../src/infrastructure/database/schema.js'
import { NotFoundException } from '../../../../src/shared/exceptions/not-found.exception.js'
import { UnauthorizedException } from '../../../../src/shared/exceptions/unauthorized.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

describe('CompanyController', () => {
  let controller: CompanyController
  let mockLogger: LoggerPort
  let mockGetCompanyDetailsUseCase: GetCompanyDetailsUseCase
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any

    // Create mock use case
    mockGetCompanyDetailsUseCase = {
      execute: vi.fn(),
    } as any

    // Create controller instance with mocked dependencies
    controller = new CompanyController(mockLogger, mockGetCompanyDetailsUseCase)

    // Create mock Fastify reply with chainable methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    // Create mock Fastify request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
      user: {
        sub: 'user-123',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      const instance = new CompanyController(mockLogger, mockGetCompanyDetailsUseCase)

      expect(instance).toBeInstanceOf(CompanyController)
      expect(instance).toBeDefined()
    })
  })

  describe('registerRoutes()', () => {
    it('should register GET /company/details route with auth middleware', () => {
      const mockApp = {
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(1)
      expect(mockApp.get).toHaveBeenCalledWith(
        '/company/details',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
    })

    it('should bind controller context to route handler', () => {
      const mockApp = {
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const handler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2]

      expect(handler).toBeTypeOf('function')
    })
  })

  describe('getCompanyDetails()', () => {
    describe('successful retrieval', () => {
      it('should retrieve company and key person details successfully', async () => {
        const mockCompany: DBCompanySelect = {
          companyId: 'company-123',
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
          keyPersonId: 'person-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          jobTitle: 'CEO',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        const mockResult = {
          company: mockCompany,
          keyPerson: mockKeyPerson,
        }

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Received company GET request')
        expect(mockGetCompanyDetailsUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle null company and key person', async () => {
        const mockResult = {
          company: null,
          keyPerson: null,
        }

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should extract audit context from request', async () => {
        const mockResult = {
          company: null,
          keyPerson: null,
        }

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockGetCompanyDetailsUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      })

      it('should handle missing user in request', async () => {
        mockRequest.user = undefined

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication required',
        })
        expect(mockGetCompanyDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should handle missing user-agent header', async () => {
        const mockResult = {
          company: null,
          keyPerson: null,
        }

        mockRequest.headers['user-agent'] = undefined

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockGetCompanyDetailsUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: null,
        })
      })
    })

    describe('error handling', () => {
      it('should handle BaseException with custom status code', async () => {
        const error = new NotFoundException('Company')

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Company not found',
        })
      })

      it('should handle generic errors with 500 status code', async () => {
        const error = new Error('Database connection failed')

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle errors without message', async () => {
        const error = {} as Error

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should handle null error', async () => {
        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(null)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should handle validation errors', async () => {
        const error = new ValidationException('Validation failed', {
          errors: [{ field: 'companyId', message: 'Invalid ID' }],
        })

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
        })
      })

      it('should handle unauthorized errors', async () => {
        const error = new UnauthorizedException('Invalid credentials')

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid credentials',
        })
      })
    })

    describe('logging', () => {
      it('should log incoming request', async () => {
        const mockResult = {
          company: null,
          keyPerson: null,
        }

        vi.mocked(mockGetCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.getCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Received company GET request')
      })
    })
  })
})
