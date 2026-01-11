import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('deleteUsersAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerInfo: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'
  const TEST_USER_IDS = ['user-123', 'user-456']

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth.js', () => ({
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
    it('should successfully delete a single user', async () => {
      const singleUserId = ['user-123']
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'User deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(singleUserId)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 1 user',
        status: 200,
      })
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        endpoint: '/users',
        body: { userIds: singleUserId },
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 1 })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Users deleted successfully', { count: 1 })
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should successfully delete multiple users', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 2 users',
        status: 200,
      })
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        endpoint: '/users',
        body: { userIds: TEST_USER_IDS },
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 2 })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Users deleted successfully', { count: 2 })
    })

    it('should handle deleting three users with correct pluralization', async () => {
      const threeUserIds = ['user-1', 'user-2', 'user-3']
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(threeUserIds)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 3 users',
        status: 200,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 3 })
    })

    it('should handle UUID formatted user IDs', async () => {
      const uuidUserIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ]
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(uuidUserIds)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 2 users',
        status: 200,
      })
      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userIds: uuidUserIds },
        })
      )
    })

    it('should handle maximum number of user IDs (10)', async () => {
      const tenUserIds = Array.from({ length: 10 }, (_, i) => `user-${i + 1}`)
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(tenUserIds)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 10 users',
        status: 200,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 10 })
    })

    it('should use DELETE method for the request', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should call correct endpoint /users', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/users',
        })
      )
    })

    it('should set 10 second timeout', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })

    it('should include Bearer token in Authorization header', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Authentication required',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should not attempt deletion when authentication fails', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockBackendRequest).not.toHaveBeenCalled()
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 2 })
      expect(mockLoggerInfo).not.toHaveBeenCalledWith(
        'Users deleted successfully',
        expect.anything()
      )
    })
  })

  describe('backend request failures - HTTP errors', () => {
    it('should handle 401 unauthorized error with custom message', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { message: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Authentication expired. Please sign in again.',
        status: 401,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: mockError.message,
        status: 401,
        body: mockError.body,
      })
    })

    it('should handle 403 forbidden error with permission message', async () => {
      const mockError = Object.assign(new Error('Forbidden'), {
        status: 403,
        body: { message: 'Insufficient permissions' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'You do not have permission to delete users.',
        status: 403,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: mockError.message,
        status: 403,
        body: mockError.body,
      })
    })

    it('should handle 404 not found error', async () => {
      const mockError = Object.assign(new Error('Not found'), {
        status: 404,
        body: { message: 'Users not found' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'One or more users not found.',
        status: 404,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: mockError.message,
        status: 404,
        body: mockError.body,
      })
    })

    it('should handle 500 internal server error', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { message: 'Database error' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Internal server error',
        status: 500,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: mockError.message,
        status: 500,
        body: mockError.body,
      })
    })

    it('should handle 400 bad request error', async () => {
      const mockError = Object.assign(new Error('Invalid user IDs'), {
        status: 400,
        body: { message: 'Invalid format' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Invalid user IDs',
        status: 400,
      })
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should use error message when available', async () => {
      const customErrorMessage = 'Custom error occurred'
      const mockError = Object.assign(new Error(customErrorMessage), {
        status: 503,
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: customErrorMessage,
        status: 503,
      })
    })

    it('should provide default error message when error has no message', async () => {
      const mockError = Object.assign(new Error(), {
        status: 502,
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete users. Please try again.',
        status: 502,
      })
    })

    it('should default to status 500 when error has no status', async () => {
      const mockError = new Error('Network failure')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Network failure',
        status: 500,
      })
      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: 'Network failure',
        status: undefined,
        body: undefined,
      })
    })
  })

  describe('backend request failures - network errors', () => {
    it('should handle network timeout error', async () => {
      const mockError = new Error('Request timeout')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

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

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(TEST_USER_IDS)

      expect(result).toEqual({
        success: false,
        message: 'Network request failed',
        status: 500,
      })
    })
  })

  describe('edge cases and input validation', () => {
    it('should handle empty userIds array', async () => {
      const emptyArray: string[] = []
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'No users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(emptyArray)

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 0 user',
        status: 200,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 0 })
    })

    it('should log correct count for single user', async () => {
      const singleUser = ['user-only']
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'User deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(singleUser)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 1 })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Users deleted successfully', { count: 1 })
    })

    it('should log correct count for multiple users', async () => {
      const fiveUsers = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(fiveUsers)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 5 })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Users deleted successfully', { count: 5 })
    })

    it('should handle very long user ID strings', async () => {
      const longUserId = ['a'.repeat(500)]
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'User deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(longUserId)

      expect(result.success).toBe(true)
      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userIds: longUserId },
        })
      )
    })

    it('should handle special characters in user IDs', async () => {
      const specialIds = ['user-with-dash', 'user_with_underscore', 'user.with.dot']
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Users deleted' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      const result = await deleteUsersAction(specialIds)

      expect(result.success).toBe(true)
      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userIds: specialIds },
        })
      )
    })
  })

  describe('error logging', () => {
    it('should log error details with status and body', async () => {
      const mockError = Object.assign(new Error('Test error'), {
        status: 503,
        body: { details: 'Service temporarily unavailable' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: 'Test error',
        status: 503,
        body: { details: 'Service temporarily unavailable' },
      })
    })

    it('should log error even when status is missing', async () => {
      const mockError = new Error('Unknown error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerError).toHaveBeenCalledWith('deleteUsersAction error', {
        error: 'Unknown error',
        status: undefined,
        body: undefined,
      })
    })

    it('should log initial deletion attempt with count', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Success' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 2 })
    })

    it('should log successful completion with count', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ message: 'Success' })

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Users deleted successfully', { count: 2 })
    })

    it('should not log success when authentication fails', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 2 })
      expect(mockLoggerInfo).not.toHaveBeenCalledWith(
        'Users deleted successfully',
        expect.anything()
      )
      expect(mockLoggerError).toHaveBeenCalledWith('No auth token found')
    })

    it('should not log success when backend request fails', async () => {
      const mockError = new Error('Backend error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { deleteUsersAction } =
        await import('@/infrastructure/serverActions/deleteUsers.server.js')

      await deleteUsersAction(TEST_USER_IDS)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Deleting users', { count: 2 })
      expect(mockLoggerInfo).not.toHaveBeenCalledWith(
        'Users deleted successfully',
        expect.anything()
      )
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })
})
