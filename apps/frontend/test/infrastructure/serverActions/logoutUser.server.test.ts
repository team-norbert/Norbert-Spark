import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('logoutUserAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerInfo: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    // Mock backend request
    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
    }))

    // Mock logger
    mockLoggerInfo = vi.fn()
    mockLoggerError = vi.fn()
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: vi.fn(() => ({
        info: mockLoggerInfo,
        error: mockLoggerError,
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should successfully log out the user', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { message: 'Successfully logged out' },
      })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: true,
        message: 'Successfully logged out',
        status: 200,
      })
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/auth/logout',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
        redirectOn401: false,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Logging out user')
      expect(mockLoggerInfo).toHaveBeenCalledWith('Logout successful')
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should return custom message from backend response', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { message: 'User session terminated' },
      })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: true,
        message: 'User session terminated',
        status: 200,
      })
    })

    it('should return default message when backend data has no message', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: {},
      })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: true,
        message: 'Logged out',
        status: 200,
      })
    })

    it('should return default message when backend response has no data', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
      })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: true,
        message: 'Logged out',
        status: 200,
      })
    })

    it('should use POST method for the request', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should call correct endpoint /auth/logout', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/auth/logout',
        })
      )
    })

    it('should set 10 second timeout', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })

    it('should include Bearer token in Authorization header', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        })
      )
    })
  })

  describe('authentication failures', () => {
    it('should return error when no auth token available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Authentication required',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Authentication required',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Authentication required',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should not attempt logout when authentication fails', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockBackendRequest).not.toHaveBeenCalled()
      expect(mockLoggerInfo).toHaveBeenCalledWith('Logging out user')
      expect(mockLoggerInfo).not.toHaveBeenCalledWith('Logout successful')
    })
  })

  describe('backend request failures - HTTP errors', () => {
    it('should handle 401 unauthorized error', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { error: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Authentication expired. Please sign in again.',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('logoutUserAction error', mockError, {
        statusCode: 401,
        body: { error: 'Invalid token' },
      })
    })

    it('should handle 500 internal server error with body.error message', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { error: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Database connection failed',
        status: 500,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('logoutUserAction error', mockError, {
        statusCode: 500,
        body: { error: 'Database connection failed' },
      })
    })

    it('should fallback to err.message when body.error is not available', async () => {
      const mockError = Object.assign(new Error('Service unavailable'), {
        status: 503,
        body: {},
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Service unavailable',
        status: 503,
      })
    })

    it('should fallback to err.message when body is undefined', async () => {
      const mockError = Object.assign(new Error('Bad gateway'), {
        status: 502,
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Bad gateway',
        status: 502,
      })
    })

    it('should provide default error message when no message is available', async () => {
      const mockError = Object.assign(new Error(), {
        status: 500,
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Failed to log out. Please try again.',
        status: 500,
      })
    })

    it('should default to status 500 when error has no status', async () => {
      const mockError = new Error('Network failure')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Network failure',
        status: 500,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('logoutUserAction error', mockError, {
        statusCode: undefined,
        body: undefined,
      })
    })
  })

  describe('backend request failures - network errors', () => {
    it('should handle network timeout error', async () => {
      const mockError = new Error('Request timeout')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Request timeout',
        status: 500,
      })
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle connection refused error', async () => {
      const mockError = new Error('ECONNREFUSED')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'ECONNREFUSED',
        status: 500,
      })
    })

    it('should handle DNS resolution error', async () => {
      const mockError = new Error('getaddrinfo ENOTFOUND')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'getaddrinfo ENOTFOUND',
        status: 500,
      })
    })

    it('should handle generic network error', async () => {
      const mockError = new Error('Network request failed')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      const result = await logoutUserAction()

      expect(result).toEqual({
        success: false,
        message: 'Network request failed',
        status: 500,
      })
    })
  })

  describe('error logging', () => {
    it('should log error details with status and body', async () => {
      const mockError = Object.assign(new Error('Test error'), {
        status: 503,
        body: { error: 'Service temporarily unavailable' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerError).toHaveBeenCalledWith('logoutUserAction error', mockError, {
        statusCode: 503,
        body: { error: 'Service temporarily unavailable' },
      })
    })

    it('should log error even when status is missing', async () => {
      const mockError = new Error('Unknown error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerError).toHaveBeenCalledWith('logoutUserAction error', mockError, {
        statusCode: undefined,
        body: undefined,
      })
    })

    it('should log initial logout attempt', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Logging out user')
    })

    it('should log successful completion', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: { message: 'Done' } })

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Logout successful')
    })

    it('should not log success when authentication fails', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Logging out user')
      expect(mockLoggerInfo).not.toHaveBeenCalledWith('Logout successful')
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
    })

    it('should not log success when backend request fails', async () => {
      const mockError = new Error('Backend error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { logoutUserAction } =
        await import('@/infrastructure/serverActions/logoutUser.server.js')

      await logoutUserAction()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Logging out user')
      expect(mockLoggerInfo).not.toHaveBeenCalledWith('Logout successful')
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })
})
