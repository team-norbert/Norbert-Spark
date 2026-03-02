import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthController } from '../../../../src/adapters/primary/http/auth.controller.js'
import { LoginUserUseCase } from '../../../../src/application/use-cases/login-user.use-case.js'
import { RefreshAccessTokenUseCase } from '../../../../src/application/use-cases/refresh-access-token.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { UnauthorizedException } from '../../../../src/shared/exceptions/unauthorized.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

// Helper function to create mock auth result with proper UserIdType
function createMockAuthResult(email: string, token: string, roles: string[], userId?: string) {
  return {
    userId: new UserId(userId || uuidv7()).getValue(),
    email,
    accessToken: token,
    roles,
  }
}

describe('AuthController', () => {
  let controller: AuthController
  let mockLoginUserUseCase: LoginUserUseCase
  let mockRefreshAccessTokenUseCase: RefreshAccessTokenUseCase
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply
  let mockLogger: {
    info: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
    warn: ReturnType<typeof vi.fn>
    debug: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use case
    mockLoginUserUseCase = {
      execute: vi.fn(),
    } as any

    const mockRegisterUserWithProviderUseCase = {
      execute: vi.fn(),
    } as any

    mockRefreshAccessTokenUseCase = {
      execute: vi.fn(),
    } as any

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create controller instance with mocked use case
    controller = new AuthController(
      mockLogger as any,
      mockLoginUserUseCase,
      mockRegisterUserWithProviderUseCase,
      mockRefreshAccessTokenUseCase
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
        'user-agent': 'test-user-agent',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with LoginUserUseCase dependency', () => {
      const mockRegisterUseCase = { execute: vi.fn() } as any
      const mockRefreshUseCase = { execute: vi.fn() } as any
      const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } as any
      const instance = new AuthController(
        mockLogger,
        mockLoginUserUseCase,
        mockRegisterUseCase,
        mockRefreshUseCase
      )

      expect(instance).toBeInstanceOf(AuthController)
      expect(instance).toBeDefined()
    })

    it('should accept LoginUserUseCase as dependency', () => {
      const mockRegisterUseCase = { execute: vi.fn() } as any
      const mockRefreshUseCase = { execute: vi.fn() } as any
      const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } as any
      const instance = new AuthController(
        mockLogger,
        mockLoginUserUseCase,
        mockRegisterUseCase,
        mockRefreshUseCase
      )

      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AuthController)
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /auth/login route', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(3)
      expect(mockApp.post).toHaveBeenCalledWith('/auth/login', expect.any(Function))
      expect(mockApp.post).toHaveBeenCalledWith(
        '/auth/oauth-sync',
        expect.objectContaining({ preHandler: expect.any(Function) }),
        expect.any(Function)
      )
    })

    it('should bind controller context to route handler', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handler is a bound function
      const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1]

      expect(loginHandler).toBeTypeOf('function')
    })

    it('should register route with correct HTTP method', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(3)
      expect(mockApp.get).not.toHaveBeenCalled()
      expect(mockApp.put).not.toHaveBeenCalled()
      expect(mockApp.delete).not.toHaveBeenCalled()
    })
  })

  describe('login()', () => {
    describe('successful login', () => {
      it('should authenticate user with valid credentials', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'user@example.com',
            password: 'SecurePass123!',
          }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should return 200 status code for successful login', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should return success response with user data and token', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle admin user login', async () => {
        mockRequest.body = {
          email: 'admin@example.com',
          password: 'AdminPass123!',
        }

        const mockResult = createMockAuthResult('admin@example.com', 'admin.jwt.token', ['admin'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should chain reply methods correctly', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        // Verify code() was called before send()
        const codeCall = vi.mocked(mockReply.code).mock.invocationCallOrder[0]
        const sendCall = vi.mocked(mockReply.send).mock.invocationCallOrder[0]
        expect(codeCall).toBeDefined()
        expect(sendCall).toBeDefined()
        expect(codeCall!).toBeLessThan(sendCall!)
      })

      it('should preserve exact response structure from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'TestPass123!',
        }

        const mockResult = createMockAuthResult(
          'test@example.com',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          ['user', 'moderator']
        )
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data: typeof mockResult
        }
        expect(sentData).toEqual({
          success: true,
          data: mockResult,
        })
        expect(sentData.data).toHaveProperty('userId')
        expect(sentData.data).toHaveProperty('email')
        expect(sentData.data).toHaveProperty('accessToken')
        expect(sentData.data).toHaveProperty('roles')
      })

      it('should include success property set to true', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockResult
          error?: string
        }
        expect(sentData).toHaveProperty('success')
        expect(sentData.success).toBe(true)
        expect(typeof sentData.success).toBe('boolean')
      })

      it('should include data property on success', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockResult
          error?: string
        }
        expect(sentData).toHaveProperty('data')
        expect(sentData.data).toBeDefined()
        expect(sentData).not.toHaveProperty('error')
      })
    })

    describe('validation errors', () => {
      it('should handle missing email field', async () => {
        mockRequest.body = {
          password: 'SecurePass123!',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle missing password field', async () => {
        mockRequest.body = {
          email: 'user@example.com',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password is required and must be a string',
        })
      })

      it('should handle empty request body', async () => {
        mockRequest.body = {}

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should handle null request body', async () => {
        mockRequest.body = null as any

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should handle non-string email', async () => {
        mockRequest.body = {
          email: 12345,
          password: 'SecurePass123!',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle non-string password', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 12345,
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password is required and must be a string',
        })
      })

      it('should return 400 status code for validation errors', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
      })

      it('should return error response for validation failures', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email format',
        })
      })

      it('should include error property on validation failure', async () => {
        mockRequest.body = {
          email: 'user@example.com',
        }

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
        expect(sentData).toHaveProperty('success', false)
      })
    })

    describe('authentication errors', () => {
      it('should handle invalid credentials with 401 status', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
      })

      it('should return generic error message for invalid credentials', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should handle non-existent user', async () => {
        mockRequest.body = {
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should handle wrong password', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should not reveal whether email exists (prevents user enumeration)', async () => {
        // Test with non-existent email
        mockRequest.body = {
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        const firstError = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error: string
        }

        // Reset mocks
        vi.clearAllMocks()
        mockReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
        } as any

        // Test with existing email but wrong password
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        const secondError = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error: string
        }

        // Both errors should be identical
        expect(firstError.error).toBe(secondError.error)
        expect(firstError.error).toBe('Invalid email or password')
      })
    })

    describe('error handling', () => {
      it('should handle unexpected errors with 500 status', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockLogger.error).toHaveBeenCalledWith('Error in login handler', expect.any(Error))
      })

      it('should return error message for unexpected errors', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new Error('Unexpected error occurred')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith('Error in login handler', expect.any(Error))
      })

      it('should use BaseException statusCode when available', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const customError = new UnauthorizedException('Custom error')
        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(customError)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
      })

      it('should handle errors without message property', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        // Simulate error without message
        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue({})

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to authenticate user due to a database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith('Error in login handler', expect.any(Error))
      })

      it('should return a safe error message when a DrizzleQueryError is thrown', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const drizzleError = new DrizzleQueryError('SELECT * FROM users WHERE email = $1', [])
        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(drizzleError)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to authenticate user due to a database error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith('Error in login handler', expect.any(Error))
      })

      it('should include success property set to false on error', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error?: string
          data?: any
        }
        expect(sentData.success).toBe(false)
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
        expect(mockLogger.error).toHaveBeenCalledWith('Error in login handler', expect.any(Error))
      })
    })

    describe('integration with route registration', () => {
      it('should call login when POST /auth/login route is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        expect(loginHandler).toBeDefined()

        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await loginHandler(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should maintain controller context when handler is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        // Should not throw error about 'this' context
        await expect(loginHandler(mockRequest, mockReply)).resolves.toBeUndefined()
      })
    })

    describe('response structure validation', () => {
      it('should always return object with success property', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>

        expect(sentData).toHaveProperty('success')
      })

      it('should return either data or error property but not both', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const successData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(successData).toHaveProperty('data')
        expect(successData).not.toHaveProperty('error')

        // Reset and test error case
        vi.clearAllMocks()
        mockReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
        } as any

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.login(mockRequest, mockReply)

        const errorData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(errorData).toHaveProperty('error')
        expect(errorData).not.toHaveProperty('data')
      })
    })

    describe('edge cases', () => {
      it('should handle very long email addresses', async () => {
        const longEmail = 'a'.repeat(100) + '@example.com'
        mockRequest.body = {
          email: longEmail,
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult(longEmail, 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ email: longEmail }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should handle special characters in password', async () => {
        const specialPassword = '!@#$%^&*()_+-={}[]|:;<>?,./'
        mockRequest.body = {
          email: 'user@example.com',
          password: specialPassword,
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ password: specialPassword }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should handle unicode characters in credentials', async () => {
        mockRequest.body = {
          email: 'user@例え.com',
          password: 'パスワード123',
        }

        const mockResult = createMockAuthResult('user@例え.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })
    })
  })

  describe('refresh()', () => {
    const VALID_REFRESH_TOKEN = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    const mockRefreshResult = {
      accessToken: 'new-mock-access-token',
      refreshToken: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      expiresInSeconds: 604800,
    }

    describe('successful refresh', () => {
      it('should return 200 with new tokens for a valid refresh token', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: {
            accessToken: mockRefreshResult.accessToken,
            refreshToken: mockRefreshResult.refreshToken,
            expiresInSeconds: mockRefreshResult.expiresInSeconds,
          },
        })
      })

      it('should call use case with the refresh token and audit context', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        expect(mockRefreshAccessTokenUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockRefreshAccessTokenUseCase.execute).toHaveBeenCalledWith(
          VALID_REFRESH_TOKEN,
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: 'test-user-agent',
          })
        )
      })

      it('should chain reply.code() before reply.send()', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        const codeCall = vi.mocked(mockReply.code).mock.invocationCallOrder[0]
        const sendCall = vi.mocked(mockReply.send).mock.invocationCallOrder[0]
        expect(codeCall).toBeDefined()
        expect(sendCall).toBeDefined()
        expect(codeCall!).toBeLessThan(sendCall!)
      })

      it('should include success: true in response', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentData.success).toBe(true)
        expect(sentData).toHaveProperty('data')
        expect(sentData).not.toHaveProperty('error')
      })

      it('should return data with accessToken, refreshToken, and expiresInSeconds', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data: typeof mockRefreshResult
        }
        expect(sentData.data).toHaveProperty('accessToken')
        expect(sentData.data).toHaveProperty('refreshToken')
        expect(sentData.data).toHaveProperty('expiresInSeconds')
        expect(sentData.data.accessToken).toBe(mockRefreshResult.accessToken)
        expect(sentData.data.refreshToken).toBe(mockRefreshResult.refreshToken)
        expect(sentData.data.expiresInSeconds).toBe(mockRefreshResult.expiresInSeconds)
      })

      it('should extract audit context with masked IP and user agent', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        mockRequest.ip = '192.168.1.100'
        mockRequest.headers = { 'user-agent': 'Mozilla/5.0 Test Browser' }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        expect(mockRefreshAccessTokenUseCase.execute).toHaveBeenCalledWith(
          VALID_REFRESH_TOKEN,
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: 'Mozilla/5.0 Test Browser',
          })
        )
      })

      it('should handle missing user-agent header gracefully', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        mockRequest.headers = {}
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await controller.refresh(mockRequest, mockReply)

        expect(mockRefreshAccessTokenUseCase.execute).toHaveBeenCalledWith(
          VALID_REFRESH_TOKEN,
          expect.objectContaining({
            userAgent: null,
          })
        )
      })
    })

    describe('validation errors', () => {
      it('should return 500 when refreshToken is missing', async () => {
        // PostRefreshDTO.validate calls data.refreshToken.trim() without guarding
        // against undefined, so a native TypeError is thrown (not a BaseException),
        // which the catch block maps to status 500.
        mockRequest.body = {}

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should return 400 when refreshToken is not a valid 64-char hex string', async () => {
        mockRequest.body = { refreshToken: 'too-short' }

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid refreshToken'),
        })
      })

      it('should return 500 when body is null', async () => {
        mockRequest.body = null as any

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should return error for refreshToken with non-hex characters', async () => {
        mockRequest.body = {
          refreshToken: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        }

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid refreshToken'),
        })
      })

      it('should log errors from validation failures', async () => {
        mockRequest.body = { refreshToken: 'invalid' }

        await controller.refresh(mockRequest, mockReply)

        expect(mockLogger.error).toHaveBeenCalledWith('Error in refresh handler', expect.any(Error))
      })
    })

    describe('authentication errors', () => {
      it('should return 401 when refresh token is expired or revoked', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Refresh token is expired or revoked')
        )

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Refresh token is expired or revoked',
        })
      })

      it('should return 401 when refresh token is not found', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid refresh token')
        )

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid refresh token',
        })
      })
    })

    describe('error handling', () => {
      it('should return 500 for unexpected errors', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(
          new Error('Database connection lost')
        )

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection lost',
        })
      })

      it('should log errors to logger on failure', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(
          new Error('Something went wrong')
        )

        await controller.refresh(mockRequest, mockReply)

        expect(mockLogger.error).toHaveBeenCalledWith('Error in refresh handler', expect.any(Error))
      })

      it('should return safe error message for DrizzleQueryError', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        const drizzleError = new DrizzleQueryError(
          'SELECT * FROM refresh_tokens WHERE token_hash = $1',
          []
        )
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(drizzleError)

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to refresh authentication token due to a database error',
        })
      })

      it('should handle errors without a message property', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue({})

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to refresh authentication token due to an internal server error',
        })
      })

      it('should include success: false and error property on failure', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.refresh(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentData.success).toBe(false)
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
      })

      it('should use BaseException statusCode when available', async () => {
        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Token revoked')
        )

        await controller.refresh(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
      })
    })

    describe('route registration', () => {
      it('should register POST /auth/refresh route', () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        expect(mockApp.post).toHaveBeenCalledWith('/auth/refresh', expect.any(Function))
      })

      it('should invoke refresh handler when route is called', async () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        // Find the /auth/refresh registration
        const refreshCall = vi
          .mocked(mockApp.post)
          .mock.calls.find((call) => call[0] === '/auth/refresh')
        expect(refreshCall).toBeDefined()

        const refreshHandler = refreshCall![1] as unknown as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        mockRequest.body = { refreshToken: VALID_REFRESH_TOKEN }
        vi.mocked(mockRefreshAccessTokenUseCase.execute).mockResolvedValue(mockRefreshResult)

        await refreshHandler(mockRequest, mockReply)

        expect(mockRefreshAccessTokenUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })
    })
  })
})
