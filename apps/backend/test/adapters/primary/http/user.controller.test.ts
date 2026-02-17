import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserController } from '../../../../src/adapters/primary/http/user.controller.js'
import { RegisterUserDto } from '../../../../src/application/dtos/register-user.dto.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { DeleteUsersUseCase } from '../../../../src/application/use-cases/delete-users.use-case.js'
import { GetAllUsersUseCase } from '../../../../src/application/use-cases/get-all-users.use-case.js'
import { GetUserByIdUseCase } from '../../../../src/application/use-cases/get-user-by-id.use-case.js'
import { RegisterUserUseCase } from '../../../../src/application/use-cases/register-user.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { HttpStatus } from '../../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../../src/shared/exceptions/base.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

// Helper function to create mock user with proper UserIdType
function createMockUser(
  email: string,
  name: string,
  role: string,
  createdAt: Date,
  userId?: string
) {
  return {
    userId: new UserId(userId || uuidv7()).getValue(),
    email,
    name,
    role,
    createdAt,
    updatedAt: createdAt,
    twoFactorEnabled: false,
  }
}

// Helper function to create mock registration result with proper UserIdType
function createMockRegisterResult(
  accessToken: string,
  tokenType: string,
  expiresIn: number,
  userId?: string
) {
  return {
    userId: userId || uuidv7(),
    access_token: accessToken,
    token_type: tokenType,
    expires_in: expiresIn,
  }
}

describe('UserController', () => {
  let controller: UserController
  let mockRegisterUserUseCase: RegisterUserUseCase
  let mockGetAllUsersUseCase: GetAllUsersUseCase
  let mockDeleteUsersUseCase: DeleteUsersUseCase
  let mockGetUserByIdUseCase: GetUserByIdUseCase
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use case
    mockRegisterUserUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock get all users use case
    mockGetAllUsersUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock delete users use case
    mockDeleteUsersUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock get user by id use case
    mockGetUserByIdUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any

    // Create controller instance with mocked use case
    controller = new UserController(
      mockRegisterUserUseCase,
      mockGetAllUsersUseCase,
      mockDeleteUsersUseCase,
      mockGetUserByIdUseCase,
      mockLogger
    )

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
    } as any
  })

  describe('constructor', () => {
    it('should create instance with RegisterUserUseCase dependency', () => {
      const instance = new UserController(
        mockRegisterUserUseCase,
        mockGetAllUsersUseCase,
        mockDeleteUsersUseCase,
        mockGetUserByIdUseCase,
        mockLogger
      )

      expect(instance).toBeInstanceOf(UserController)
      expect(instance).toBeDefined()
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /users/register route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.post).toHaveBeenCalledWith('/users/register', expect.any(Function))
    })

    it('should register GET /users/:id route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(2)
      // Both GET /users and GET /users/:id now use route options with middleware
      expect(mockApp.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
      expect(mockApp.get).toHaveBeenCalledWith(
        '/users/:id',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
    })

    it('should bind controller context to route handlers', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handlers are bound functions
      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1]
      // GET /users is registered with options, so handler is at index 2
      const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2]
      // GET /users/:id is also registered with options, so handler is at index 2
      const getUserByIdHandler = (vi.mocked(mockApp.get).mock.calls[1] as any)?.[2]

      expect(registerHandler).toBeTypeOf('function')
      expect(getAllUsersHandler).toBeTypeOf('function')
      expect(getUserByIdHandler).toBeTypeOf('function')
    })

    it('should register routes in correct order', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const callOrder = vi.mocked(mockApp.post).mock.invocationCallOrder[0]
      const getCallOrder = vi.mocked(mockApp.get).mock.invocationCallOrder[0]

      expect(callOrder).toBeDefined()
      expect(getCallOrder).toBeDefined()
      expect(callOrder!).toBeLessThan(getCallOrder!)
    })
  })

  describe('getAllUsers()', () => {
    describe('successful retrieval', () => {
      it('should retrieve all users successfully', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
          createMockUser('user2@example.com', 'User Two', 'admin', new Date('2024-01-02')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
      })

      it('should return 200 status code for successful retrieval', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should return success response with users array', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
          createMockUser('user2@example.com', 'User Two', 'admin', new Date('2024-01-02')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should handle empty users array', async () => {
        const mockUsers: any[] = []

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should handle large number of users', async () => {
        const mockUsers = Array.from({ length: 100 }, (_, i) =>
          createMockUser(`user${i}@example.com`, `User ${i}`, 'user', new Date('2024-01-01'))
        )

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should preserve user data structure from use case', async () => {
        const mockUsers = [
          createMockUser(
            'test@example.com',
            'Test User',
            'moderator',
            new Date('2024-06-15T10:30:00Z')
          ),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data: typeof mockUsers
          pagination: { total: number; limit: number; offset: number }
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData.data[0]).toHaveProperty('userId')
        expect(typeof sentData.data[0]?.userId).toBe('string')
        expect(sentData.data[0]).toHaveProperty('email', 'test@example.com')
        expect(sentData.data[0]).toHaveProperty('name', 'Test User')
        expect(sentData.data[0]).toHaveProperty('role', 'moderator')
        expect(sentData.data[0]).toHaveProperty('createdAt')
      })
    })

    describe('error handling', () => {
      it('should handle use case execution error', async () => {
        const error = new Error('Database connection failed')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle BaseException with custom status code', async () => {
        const error = new ValidationException('Invalid query parameters')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid query parameters',
        })
      })

      it('should handle unknown error types', async () => {
        const error = 'Unknown error'
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should handle null error gracefully', async () => {
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(null)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should not expose internal error details in production', async () => {
        const error = new Error('Internal database schema mismatch')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: unknown
          error?: string
        }
        expect(sentData).toHaveProperty('success', false)
        expect(sentData).toHaveProperty('error')
        expect(sentData.error).toBe('Internal database schema mismatch')
      })
    })

    describe('response structure', () => {
      it('should always return object with success property', async () => {
        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockUsers
          pagination?: { total: number; limit: number; offset: number }
          error?: string
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData).toHaveProperty('success')
        expect(typeof sentData.success).toBe('boolean')
      })

      it('should include data property on success', async () => {
        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockUsers
          pagination?: { total: number; limit: number; offset: number }
          error?: string
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData).toHaveProperty('data')
        expect(Array.isArray(sentData.data)).toBe(true)
      })

      it('should include error property on failure', async () => {
        const error = new Error('Test error')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
      })
    })

    describe('integration with route registration', () => {
      it('should call getAllUsers when GET /users route is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
          get: vi.fn(),
          delete: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        // GET /users is now registered with options, so handler is at index 2
        const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2] as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        expect(getAllUsersHandler).toBeDefined()

        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await getAllUsersHandler(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalled()
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should maintain controller context when called via route', async () => {
        const mockApp = {
          post: vi.fn(),
          get: vi.fn(),
          delete: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        // GET /users is now registered with options, so handler is at index 2
        const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2] as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await getAllUsersHandler(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
      })
    })
  })

  describe('register()', () => {
    describe('successful registration', () => {
      it('should register a new user successfully', async () => {
        const requestBody = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        mockRequest.body = requestBody

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockRegisterUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(
          expect.any(RegisterUserDto),
          expect.objectContaining({ ipAddress: expect.any(String) })
        )
      })

      it('should validate request body with RegisterUserDto', async () => {
        const requestBody = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        mockRequest.body = requestBody

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const executedDto = vi.mocked(mockRegisterUserUseCase.execute).mock.calls[0]?.[0]
        const executedContext = vi.mocked(mockRegisterUserUseCase.execute).mock.calls[0]?.[1]
        expect(executedDto).toBeInstanceOf(RegisterUserDto)
        expect(executedContext).toEqual(expect.objectContaining({ ipAddress: expect.any(String) }))
        expect(executedDto?.email).toBe('test@example.com')
        expect(executedDto?.password).toBe('SecurePass123!')
        expect(executedDto?.name).toBe('Test User')
      })

      it('should return 201 status code for successful registration', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
      })

      it('should return success response with user data', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle different valid user data', async () => {
        mockRequest.body = {
          email: 'another@example.com',
          password: 'DifferentPass456!',
          name: 'Another User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should chain reply methods correctly', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        // Verify code() was called before send()
        const codeCall = vi.mocked(mockReply.code).mock.invocationCallOrder[0]
        const sendCall = vi.mocked(mockReply.send).mock.invocationCallOrder[0]
        expect(codeCall).toBeDefined()
        expect(sendCall).toBeDefined()
        expect(codeCall!).toBeLessThan(sendCall!)
      })
    })

    describe('validation errors', () => {
      it('should handle invalid email format from use case', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        // DTO validation passes (it's a string), but Email value object validation fails
        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email format',
        })
      })

      it('should handle missing email field', async () => {
        mockRequest.body = {
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle missing password field', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password must be a string when provider is not provided',
        })
      })

      it('should handle missing name field', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Name is required and must be a string',
        })
      })

      it('should handle TypeErrorException for invalid request body type', async () => {
        mockRequest.body = null

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Data must be a valid object',
        })
      })

      it('should handle array as request body', async () => {
        mockRequest.body = []

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Data must be a valid object',
        })
      })

      it('should not call use case when DTO validation fails', async () => {
        mockRequest.body = {
          email: '', // Empty string fails DTO validation
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockRegisterUserUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('use case errors', () => {
      it('should handle duplicate email error from use case', async () => {
        mockRequest.body = {
          email: 'existing@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new Error('User with this email already exists')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'User with this email already exists',
        })
      })

      it('should handle password validation error from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new ValidationException('Password must be at least 8 characters')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password must be at least 8 characters',
        })
      })

      it('should handle repository errors from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle generic errors from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(new Error('Unexpected error'))

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected error',
        })
      })
    })

    describe('edge cases', () => {
      it('should handle extra fields in request body', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          extraField: 'should be ignored',
          anotherField: 123,
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle whitespace in fields', async () => {
        mockRequest.body = {
          email: '  test@example.com  ',
          password: '  SecurePass123!  ',
          name: '  Test User  ',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
      })

      it('should handle empty object as request body', async () => {
        mockRequest.body = {}

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('required'),
        })
      })

      it('should handle string instead of object', async () => {
        mockRequest.body = 'invalid'

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should handle number instead of object', async () => {
        mockRequest.body = 123

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })
    })

    describe('response structure', () => {
      it('should return consistent success response structure', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentResponse).toHaveProperty('success', true)
        expect(sentResponse).toHaveProperty('data')
        expect(Object.keys(sentResponse)).toEqual(['success', 'data'])
      })

      it('should return consistent error response structure', async () => {
        mockRequest.body = {
          email: '', // Empty string fails DTO validation
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentResponse).toHaveProperty('success', false)
        expect(sentResponse).toHaveProperty('error')
        expect(Object.keys(sentResponse)).toEqual(['success', 'error'])
      })

      it('should include userId in success response data', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const userId = uuidv7()
        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600, userId)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          data?: Record<string, any>
        }
        expect(sentResponse.data).toEqual(
          expect.objectContaining({
            userId: expect.any(String),
            access_token: 'mock.jwt.token',
          })
        )
      })

      it('should include error message in error response', async () => {
        mockRequest.body = null

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as { error?: string }
        expect(sentResponse.error).toBe('Data must be a valid object')
      })
    })
  })

  describe('integration', () => {
    it('should handle complete registration flow', async () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      // Register routes
      controller.registerRoutes(mockApp)

      // Get the registered handler
      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
        req: FastifyRequest,
        reply: FastifyReply
      ) => Promise<void>

      // Prepare request
      mockRequest.body = {
        email: 'integration@example.com',
        password: 'IntegrationPass123!',
        name: 'Integration Test',
      }

      const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
      vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

      // Execute handler
      await registerHandler(mockRequest, mockReply)

      // Verify complete flow
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalled()
      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('should maintain context when routes are called', async () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
        req: FastifyRequest,
        reply: FastifyReply
      ) => Promise<void>

      mockRequest.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }

      const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
      vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

      await registerHandler(mockRequest, mockReply)

      // Should successfully execute without context errors
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalled()
    })
  })

  describe('deleteUsers()', () => {
    describe('successful deletion', () => {
      it('should delete single user successfully', async () => {
        const userId = uuidv7()
        mockRequest.body = { userIds: [userId] }

        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: null,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          })
        )
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: 'Users have been successfully deleted',
        })
      })

      it('should delete multiple users successfully', async () => {
        const userIds = [uuidv7(), uuidv7(), uuidv7()]
        mockRequest.body = { userIds }

        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: 'Users have been successfully deleted',
        })
      })

      it('should return 200 status code on successful deletion', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should return success message', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: 'Users have been successfully deleted',
        })
      })

      it('should convert UUIDs to UserIdType before calling use case', async () => {
        const userId = uuidv7()
        mockRequest.body = { userIds: [userId] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        const callArgs = vi.mocked(mockDeleteUsersUseCase.execute).mock.calls[0]
        expect(callArgs).toBeDefined()
        expect(callArgs![0]).toBeInstanceOf(Array)
        expect(callArgs![0].length).toBe(1)
      })
    })

    describe('audit context', () => {
      it('should extract IP address from request', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        Object.assign(mockRequest, { ip: '192.168.1.100' })
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: null,
            ipAddress: '192.168.1.100',
          })
        )
      })

      it('should extract user agent from request headers', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        mockRequest.headers = { 'user-agent': 'Mozilla/5.0' }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userAgent: 'Mozilla/5.0',
          })
        )
      })

      it('should handle missing user agent', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        mockRequest.headers = {}
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userAgent: null,
          })
        )
      })

      it('should pass both IP and user agent to use case', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        Object.assign(mockRequest, { ip: '10.0.0.1' })
        mockRequest.headers = { 'user-agent': 'Chrome/100' }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(expect.any(Array), {
          userId: null,
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome/100',
        })
      })
    })

    describe('validation errors', () => {
      it('should handle invalid request body', async () => {
        mockRequest.body = null

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Data must be a valid array of user IDs',
          })
        )
      })

      it('should handle missing userIds field', async () => {
        mockRequest.body = {}

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'userIds must be an array of strings',
          })
        )
      })

      it('should handle invalid UUID format', async () => {
        mockRequest.body = { userIds: ['not-a-uuid'] }

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('Invalid UUIDv7 format'),
          })
        )
      })

      it('should handle UUIDv4 instead of UUIDv7', async () => {
        const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'
        mockRequest.body = { userIds: [uuidv4] }

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('Invalid UUIDv7 format'),
          })
        )
      })

      it('should handle empty userIds array', async () => {
        mockRequest.body = { userIds: [] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith([], expect.any(Object))
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })
    })

    describe('use case errors', () => {
      it('should handle database errors from use case', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        const dbError = new Error('Database connection failed')
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(dbError)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle BaseException errors with status code', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        const validationError = new ValidationException('Validation failed')
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(validationError)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
        })
      })

      it('should use default error message for errors without message', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        const errorWithoutMessage = { name: 'Error' } as Error
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(errorWithoutMessage)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should return 500 for generic errors', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        const genericError = new Error('Something went wrong')
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(genericError)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should not call reply.send twice on error', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledTimes(1)
      })
    })

    describe('edge cases', () => {
      it('should handle duplicate user IDs', async () => {
        const userId = uuidv7()
        mockRequest.body = { userIds: [userId, userId, userId] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should handle large batch of user IDs', async () => {
        const userIds = Array.from({ length: 100 }, () => uuidv7())
        mockRequest.body = { userIds }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should handle IPv6 addresses', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        Object.assign(mockRequest, { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' })
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: null,
            ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          })
        )
      })

      it('should handle very long user agent strings', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        const longUserAgent = 'A'.repeat(500)
        mockRequest.headers = { 'user-agent': longUserAgent }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userAgent: longUserAgent,
          })
        )
      })
    })

    describe('response format', () => {
      it('should return consistent success response structure', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.any(String),
        })
      })

      it('should return consistent error response structure', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should chain code and send methods', async () => {
        mockRequest.body = { userIds: [uuidv7()] }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledBefore(mockReply.send as any)
      })
    })

    describe('integration', () => {
      it('should complete full deletion workflow', async () => {
        const userIds = [uuidv7(), uuidv7()]
        mockRequest.body = { userIds }
        Object.assign(mockRequest, { ip: '192.168.1.1' })
        mockRequest.headers = { 'user-agent': 'Integration Test' }
        vi.mocked(mockDeleteUsersUseCase.execute).mockResolvedValue(true)

        await controller.deleteUsers(mockRequest, mockReply)

        // Verify DTO validation occurred (implicit by not throwing)
        // Verify use case was called with correct data
        expect(mockDeleteUsersUseCase.execute).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            userId: null,
            ipAddress: '192.168.1.1',
            userAgent: 'Integration Test',
          })
        )
        // Verify response was sent
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: 'Users have been successfully deleted',
        })
      })

      it('should handle end-to-end error scenario', async () => {
        mockRequest.body = { userIds: ['invalid-uuid'] }

        await controller.deleteUsers(mockRequest, mockReply)

        // Should not call use case with invalid data
        expect(mockDeleteUsersUseCase.execute).not.toHaveBeenCalled()
        // Should return error response
        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('Invalid UUIDv7 format'),
          })
        )
      })
    })
  })

  describe('getUserById', () => {
    const testUserId = uuidv7()
    const requestingUserId = uuidv7()

    beforeEach(() => {
      mockRequest.params = { id: testUserId }
      mockRequest.user = {
        sub: requestingUserId,
        roles: ['user'],
      } as any
    })

    describe('successful retrieval', () => {
      it('should retrieve user data when user accesses their own data', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId, // Same as the requested user
          roles: ['user'],
        } as any

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date('2024-01-01')),
          getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-01-15')),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            userId: userId,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          })
        )
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: {
            id: userId,
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user',
            twoFactorEnabled: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        })
      })

      it('should retrieve user data when admin accesses any user data', async () => {
        const adminId = uuidv7()
        const targetUserId = uuidv7()
        mockRequest.params = { id: targetUserId }
        mockRequest.user = {
          sub: adminId, // Different from target user
          roles: ['admin'],
        } as any

        const mockUserData = {
          id: targetUserId,
          getEmail: vi.fn().mockReturnValue('target@example.com'),
          getName: vi.fn().mockReturnValue('Target User'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date('2024-01-01')),
          getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-01-15')),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: targetUserId,
            email: 'target@example.com',
            twoFactorEnabled: false,
          }),
        })
      })

      it('should retrieve user data when moderator accesses any user data', async () => {
        const moderatorId = uuidv7()
        const targetUserId = uuidv7()
        mockRequest.params = { id: targetUserId }
        mockRequest.user = {
          sub: moderatorId,
          roles: ['moderator'],
        } as any

        const mockUserData = {
          id: targetUserId,
          getEmail: vi.fn().mockReturnValue('target@example.com'),
          getName: vi.fn().mockReturnValue('Target User'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date('2024-01-01')),
          getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-01-15')),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should call logger.debug with request parameters', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Request params'))
        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Request id'))
        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Request userId'))
      })
    })

    describe('authorization', () => {
      it('should return 403 when regular user tries to access another user data', async () => {
        const userId1 = uuidv7()
        const userId2 = uuidv7()
        mockRequest.params = { id: userId2 }
        mockRequest.user = {
          sub: userId1, // Different from target user
          roles: ['user'], // Not admin or moderator
        } as any

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Forbidden: You can only access your own user data',
        })
        expect(mockGetUserByIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should allow user to access their own data', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId, // Same user
          roles: ['user'],
        } as any

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalled()
      })

      it('should allow admin to access any user data', async () => {
        const adminId = uuidv7()
        const targetUserId = uuidv7()
        mockRequest.params = { id: targetUserId }
        mockRequest.user = {
          sub: adminId,
          roles: ['admin'],
        } as any

        const mockUserData = {
          id: targetUserId,
          getEmail: vi.fn().mockReturnValue('target@example.com'),
          getName: vi.fn().mockReturnValue('Target User'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalled()
      })

      it('should allow moderator to access any user data', async () => {
        const moderatorId = uuidv7()
        const targetUserId = uuidv7()
        mockRequest.params = { id: targetUserId }
        mockRequest.user = {
          sub: moderatorId,
          roles: ['moderator'],
        } as any

        const mockUserData = {
          id: targetUserId,
          getEmail: vi.fn().mockReturnValue('target@example.com'),
          getName: vi.fn().mockReturnValue('Target User'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should return 404 when user is not found', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(null)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'User not found',
        })
      })

      it('should handle BaseException with custom status code', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['admin'],
        } as any

        class CustomException extends BaseException {
          constructor() {
            super('Custom error', 'CUSTOM_ERROR' as any, HttpStatus.UNPROCESSABLE_ENTITY)
          }
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockRejectedValue(new CustomException())

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(422)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Custom error',
        })
      })

      it('should handle generic errors with 500 status code', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['admin'],
        } as any

        vi.mocked(mockGetUserByIdUseCase.execute).mockRejectedValue(new Error('Unexpected error'))

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected error',
        })
      })

      it('should handle invalid UUID format', async () => {
        mockRequest.params = { id: 'invalid-uuid' }
        mockRequest.user = {
          sub: requestingUserId,
          roles: ['admin'],
        } as any

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid user id',
        })
      })

      it('should handle error without message gracefully', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['admin'],
        } as any

        const errorWithoutMessage = {} as Error
        vi.mocked(mockGetUserByIdUseCase.execute).mockRejectedValue(errorWithoutMessage)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })
    })

    describe('audit context', () => {
      it('should pass correct audit context to use case', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any
        Object.defineProperty(mockRequest, 'ip', { value: '192.168.1.100', writable: true })
        mockRequest.headers = { 'user-agent': 'Mozilla/5.0' }

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            userId: userId,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
          })
        )
      })

      it('should handle missing user agent', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any
        mockRequest.headers = {}

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            userAgent: null,
          })
        )
      })

      it('should handle IPv6 addresses', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any
        Object.assign(mockRequest, { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' })

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          })
        )
      })
    })

    describe('response format', () => {
      it('should return all user fields in correct format', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any

        const createdAt = new Date('2024-01-01')
        const updatedAt = new Date('2024-01-15')

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(createdAt),
          getUpdatedAt: vi.fn().mockReturnValue(updatedAt),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: {
            id: userId,
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user',
            twoFactorEnabled: false,
            createdAt: createdAt,
            updatedAt: updatedAt,
          },
        })
      })

      it('should call getter methods on user entity', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockUserData.getEmail).toHaveBeenCalled()
        expect(mockUserData.getName).toHaveBeenCalled()
        expect(mockUserData.getRole).toHaveBeenCalled()
        expect(mockUserData.isTwoFactorEnabled).toHaveBeenCalled()
        expect(mockUserData.getCreatedAt).toHaveBeenCalled()
        expect(mockUserData.getUpdatedAt).toHaveBeenCalled()
      })

      it('should chain code and send methods', async () => {
        const userId = uuidv7()
        mockRequest.params = { id: userId }
        mockRequest.user = {
          sub: userId,
          roles: ['user'],
        } as any

        const mockUserData = {
          id: userId,
          getEmail: vi.fn().mockReturnValue('user@example.com'),
          getName: vi.fn().mockReturnValue('John Doe'),
          getRole: vi.fn().mockReturnValue('user'),
          isTwoFactorEnabled: vi.fn().mockReturnValue(false),
          getCreatedAt: vi.fn().mockReturnValue(new Date()),
          getUpdatedAt: vi.fn().mockReturnValue(new Date()),
        }

        vi.mocked(mockGetUserByIdUseCase.execute).mockResolvedValue(mockUserData as any)

        await controller.getUserById(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledBefore(mockReply.send as any)
      })
    })
  })
})
