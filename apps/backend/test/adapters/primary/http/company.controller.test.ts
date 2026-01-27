import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyController } from '../../../../src/adapters/primary/http/company.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { GetCompanyDetailsUseCase } from '../../../../src/application/use-cases/get-company-details.use-case.js'
import { PutCompanyDetailsUseCase } from '../../../../src/application/use-cases/put-company-details.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
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
  let mockPutCompanyDetailsUseCase: PutCompanyDetailsUseCase
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

    // Create mock put use case
    mockPutCompanyDetailsUseCase = {
      execute: vi.fn(),
    } as any

    // Create controller instance with mocked dependencies
    controller = new CompanyController(
      mockLogger,
      mockGetCompanyDetailsUseCase,
      mockPutCompanyDetailsUseCase
    )

    // Create mock Fastify reply with chainable methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
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
        sub: new UserId(uuidv7()).getValue(),
        email: 'test@example.com',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      const instance = new CompanyController(
        mockLogger,
        mockGetCompanyDetailsUseCase,
        mockPutCompanyDetailsUseCase
      )

      expect(instance).toBeInstanceOf(CompanyController)
      expect(instance).toBeDefined()
    })
  })

  describe('registerRoutes()', () => {
    it('should register GET /company/details route with auth middleware', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
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
        put: vi.fn(),
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
          userId: mockRequest.user?.sub,
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
          userId: mockRequest.user?.sub,
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
          userId: mockRequest.user?.sub,
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

  describe('updateCompanyDetails()', () => {
    describe('successful updates', () => {
      it('should update company details successfully', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: {
            companyId,
            legalName: 'Updated Company LLC',
            displayName: 'Updated Company',
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const mockResult = {
          company: {
            companyId,
            legalName: 'Updated Company LLC',
            displayName: 'Updated Company',
            status: 'active',
            industry: null,
            companySize: null,
            websiteUrl: null,
            billingCountry: 'US',
            timezone: 'UTC',
            singletonCheck: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
          } as any,
        }

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('updateCompanyDetails called')
        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalledWith(
          {
            userId: mockRequest.user?.sub,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          },
          expect.objectContaining({
            company: expect.any(Object),
          })
        )
        expect(mockReply.status).toHaveBeenCalledWith(204)
        expect(mockReply.send).toHaveBeenCalled()
      })

      it('should update key person details successfully', async () => {
        const keyPersonId = uuidv7()
        mockRequest.body = {
          keyPerson: {
            keyPersonId,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const mockResult = {
          keyPerson: {
            keyPersonId,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: null,
            jobTitle: null,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
          },
        }

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
      })

      it('should update both company and key person', async () => {
        const companyId = uuidv7()
        const keyPersonId = uuidv7()
        mockRequest.body = {
          company: {
            companyId,
            status: 'active',
          },
          keyPerson: {
            keyPersonId,
            isActive: true,
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['moderator'],
        }

        const mockResult = {
          company: { companyId, status: 'active' } as any,
          keyPerson: { keyPersonId, isActive: true } as any,
        }

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
      })
    })

    describe('authentication and authorization', () => {
      it('should reject request when user is not authenticated', async () => {
        mockRequest.user = undefined

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Authorization check failed: User not authenticated'
        )
        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication required',
        })
        expect(mockPutCompanyDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should reject when user lacks admin/moderator role', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: { companyId, legalName: 'Test' },
        }
        // User with regular 'user' role should be denied access
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-456@example.com',
          roles: ['user'],
        }

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. Admin or moderator role required to update company details',
        })
        expect(mockPutCompanyDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should allow user with admin role', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: { companyId, legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'admin@example.com',
          roles: ['admin'],
        }

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalled()
        expect(mockReply.status).toHaveBeenCalledWith(204)
      })

      it('should allow user with moderator role', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: { companyId, legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'mod@example.com',
          roles: ['moderator'],
        }

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalled()
        expect(mockReply.status).toHaveBeenCalledWith(204)
      })

      it('should reject user without admin/moderator role', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: { companyId, legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['user'],
        }

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. Admin or moderator role required to update company details',
        })
        expect(mockPutCompanyDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should reject user with missing roles array', async () => {
        const companyId = uuidv7()
        mockRequest.body = {
          company: { companyId, legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-456@example.com',
        }

        await controller.updateCompanyDetails(mockRequest, mockReply)

        // User without roles array should be denied access
        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. Admin or moderator role required to update company details',
        })
        expect(mockPutCompanyDetailsUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('validation', () => {
      it('should reject invalid request body', async () => {
        mockRequest.body = {
          company: {
            companyId: 'invalid-uuid',
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid companyId: must be a valid UUID',
        })
      })

      it('should pass validated DTO to use case', async () => {
        mockRequest.body = {
          company: {
            companyId: '0193df0d-0000-7000-8000-000000000000',
            legalName: 'Valid Company',
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            company: expect.objectContaining({
              companyId: '0193df0d-0000-7000-8000-000000000000',
              legalName: 'Valid Company',
            }),
          })
        )
      })
    })

    describe('error handling', () => {
      it('should handle BaseException with custom status code', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const error = new NotFoundException('Company')

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Company not found',
        })
      })

      it('should handle generic errors with 500 status code', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const error = new Error('Database connection failed')

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle errors without message', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const error = {} as Error

        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockRejectedValue(error)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should handle validation exception', async () => {
        mockRequest.body = {
          company: {
            companyId: 'invalid',
          },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
      })
    })

    describe('audit context', () => {
      it('should extract audit context from request', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }
        ;(mockRequest as any).ip = '192.168.1.100'
        mockRequest.headers['user-agent'] = 'CustomAgent/1.0'

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalledWith(
          {
            userId: mockRequest.user?.sub,
            ipAddress: '192.168.1.100',
            userAgent: 'CustomAgent/1.0',
          },
          expect.any(Object)
        )
      })

      it('should handle missing user-agent header', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }
        mockRequest.headers['user-agent'] = undefined

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockPutCompanyDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: null,
          }),
          expect.any(Object)
        )
      })
    })

    describe('logging', () => {
      it('should log when method is called', async () => {
        mockRequest.body = {
          company: { companyId: '0193df0d-0000-7000-8000-000000000000', legalName: 'Test' },
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user-123@example.com',
          roles: ['admin'],
        }

        const mockResult = { company: {} as any }
        vi.mocked(mockPutCompanyDetailsUseCase.execute).mockResolvedValue(mockResult)

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('updateCompanyDetails called')
      })

      it('should log authorization failure warnings', async () => {
        mockRequest.user = undefined

        await controller.updateCompanyDetails(mockRequest, mockReply)

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Authorization check failed: User not authenticated'
        )
      })
    })
  })
})
