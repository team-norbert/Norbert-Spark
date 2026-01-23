import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('loginUserAction', () => {
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>

  const TEST_CREDENTIALS = {
    email: 'test@example.com',
    password: 'password123',
  }

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock backend request
    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
    }))

    // Mock logger
    mockLoggerError = vi.fn()
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: vi.fn(() => ({
        error: mockLoggerError,
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      })),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful Login', () => {
    it('should return success response with JWT token when login is successful', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result).toEqual(mockResponse)
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/auth/login',
        body: {
          email: TEST_CREDENTIALS.email,
          password: TEST_CREDENTIALS.password,
        },
        timeoutMs: 10000,
        redirectOn401: false,
      })
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should add default status 200 if not present in response', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.status).toBe(200)
    })

    it('should preserve existing status code in response', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 201,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.status).toBe(201)
    })
  })

  describe('Authentication Errors', () => {
    it('should return error when credentials are invalid (401)', async () => {
      const error = new Error('Unauthorized') as Error & { status?: number; body?: unknown }
      error.status = 401
      error.body = { error: 'Invalid email or password' }

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(result.status).toBe(401)
      expect(mockLoggerError).toHaveBeenCalledWith('loginUserAction error', error)
    })

    it('should use custom error message from backend response', async () => {
      const error = new Error('Unauthorized') as Error & { status?: number; body?: unknown }
      error.status = 401
      error.body = { error: 'Account is locked' }

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Account is locked')
      expect(result.status).toBe(401)
    })

    it('should return default error message when no specific error is provided', async () => {
      const error = new Error() as Error & { status?: number; body?: unknown }
      error.status = 401

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(result.status).toBe(401)
    })
  })

  describe('Connection Errors', () => {
    it('should return 503 when backend connection fails (fetch failed)', async () => {
      const error = new Error('fetch failed')

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Unable to connect to backend service. Please ensure the backend server is running.'
      )
      expect(result.status).toBe(503)
      expect(mockLoggerError).toHaveBeenCalledWith('loginUserAction error', error)
    })

    it('should return 503 when ECONNREFUSED error occurs in message', async () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:3000')

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Unable to connect to backend service. Please ensure the backend server is running.'
      )
      expect(result.status).toBe(503)
    })

    it('should return 503 when ECONNREFUSED error occurs in cause', async () => {
      const error = new Error('Network error') as Error & { cause?: { code?: string } }
      error.cause = { code: 'ECONNREFUSED' }

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Unable to connect to backend service. Please ensure the backend server is running.'
      )
      expect(result.status).toBe(503)
    })
  })

  describe('Server Errors', () => {
    it('should return error with status 500 for generic server errors', async () => {
      const error = new Error('Internal server error') as Error & { status?: number }
      error.status = 500

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal server error')
      expect(result.status).toBe(500)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should default to status 500 when no status is provided', async () => {
      const error = new Error('Unexpected error')

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
    })

    it('should handle error with status and body', async () => {
      const error = new Error('Backend error') as Error & { status?: number; body?: unknown }
      error.status = 503
      error.body = { error: 'Service temporarily unavailable' }

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service temporarily unavailable')
      expect(result.status).toBe(503)
    })
  })

  describe('Request Parameters', () => {
    it('should pass correct endpoint to backendRequest', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      await loginUserAction(TEST_CREDENTIALS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/auth/login',
        })
      )
    })

    it('should use POST method', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      await loginUserAction(TEST_CREDENTIALS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should set timeout to 10 seconds', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      await loginUserAction(TEST_CREDENTIALS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })

    it('should disable redirect on 401', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      await loginUserAction(TEST_CREDENTIALS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectOn401: false,
        })
      )
    })

    it('should pass email and password in request body', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        token: 'jwt-token-123',
        userId: 'user-id-123',
        status: 200,
      }

      mockBackendRequest.mockResolvedValue(mockResponse)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      await loginUserAction(TEST_CREDENTIALS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: TEST_CREDENTIALS.email,
            password: TEST_CREDENTIALS.password,
          },
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle non-Error thrown values', async () => {
      mockBackendRequest.mockRejectedValue('String error')

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
    })

    it('should handle null error message', async () => {
      const error = new Error() as Error & { status?: number; body?: unknown }
      error.message = ''
      error.status = 400

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should handle error with undefined body', async () => {
      const error = new Error('Something went wrong') as Error & { status?: number; body?: unknown }
      error.status = 500
      error.body = undefined

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong')
    })

    it('should handle error with empty body object', async () => {
      const error = new Error('Something went wrong') as Error & { status?: number; body?: unknown }
      error.status = 500
      error.body = {}

      mockBackendRequest.mockRejectedValue(error)

      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      const result = await loginUserAction(TEST_CREDENTIALS)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong')
    })
  })
})
