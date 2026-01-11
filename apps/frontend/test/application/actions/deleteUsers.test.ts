import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteUsers } from '@/application/actions/deleteUsers.js'

describe('deleteUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  describe('Successful User Deletion', () => {
    it('should successfully delete a single user', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully deleted 1 user(s)',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully deleted 1 user(s)')
      expect(result.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: ['user-123'] }),
          cache: 'no-store',
        })
      )
    })

    it('should successfully delete multiple users', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully deleted 3 user(s)',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123', 'user-456', 'user-789'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully deleted 3 user(s)')
      expect(result.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ userIds: ['user-123', 'user-456', 'user-789'] }),
        })
      )
    })

    it('should use default success message if none provided by server', async () => {
      const mockResponse = {
        success: true,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Users deleted successfully')
      expect(result.status).toBe(200)
    })

    it('should use NEXT_PUBLIC_BASE_URL environment variable', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BASE_URL
      process.env.NEXT_PUBLIC_BASE_URL = 'https://custom-api.com'

      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.com/api/users',
        expect.any(Object)
      )

      // Restore original environment
      if (originalEnv) {
        process.env.NEXT_PUBLIC_BASE_URL = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_BASE_URL
      }
    })

    it('should fall back to default base URL if NEXT_PUBLIC_BASE_URL is not set', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BASE_URL
      delete process.env.NEXT_PUBLIC_BASE_URL

      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:4321/api/users',
        expect.any(Object)
      )

      // Restore original environment
      if (originalEnv) {
        process.env.NEXT_PUBLIC_BASE_URL = originalEnv
      }
    })
  })

  describe('Error Handling - HTTP Errors', () => {
    it('should handle 400 Bad Request with server error message', async () => {
      const mockErrorResponse = {
        message: 'Invalid user IDs provided',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
      })

      const params = { userIds: ['invalid-id'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.message).toBe('Failed to delete users: Invalid user IDs provided')
    })

    it('should handle 401 Unauthorized error', async () => {
      const mockErrorResponse = {
        error: 'Authentication required',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => mockErrorResponse,
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Failed to delete users: Authentication required')
    })

    it('should handle 403 Forbidden error', async () => {
      const mockErrorResponse = {
        message: 'Insufficient permissions to delete users',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => mockErrorResponse,
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
      expect(result.message).toBe(
        'Failed to delete users: Insufficient permissions to delete users'
      )
    })

    it('should handle 404 Not Found error', async () => {
      const mockErrorResponse = {
        message: 'One or more users not found',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => mockErrorResponse,
      })

      const params = { userIds: ['non-existent-user'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(404)
      expect(result.message).toBe('Failed to delete users: One or more users not found')
    })

    it('should handle 500 Internal Server Error', async () => {
      const mockErrorResponse = {
        error: 'Database connection failed',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => mockErrorResponse,
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Failed to delete users: Database connection failed')
    })

    it('should handle error response without message or error field', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({}),
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(503)
      expect(result.message).toBe('Failed to delete users: Server returned 503 Service Unavailable')
    })

    it('should handle error response with invalid JSON', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe(
        'Failed to delete users: Server returned 500 Internal Server Error'
      )
    })
  })

  describe('Error Handling - Network Errors', () => {
    it('should handle network error (fetch throws)', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network request failed')
      )

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe(
        'Unable to delete users: Network error or server unavailable. Please check your connection and try again.'
      )
    })

    it('should handle timeout error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Request timeout')
      )

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe(
        'Unable to delete users: Network error or server unavailable. Please check your connection and try again.'
      )
    })

    it('should handle connection refused error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ECONNREFUSED'))

      const params = { userIds: ['user-123'] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe(
        'Unable to delete users: Network error or server unavailable. Please check your connection and try again.'
      )
    })
  })

  describe('Input Validation and Edge Cases', () => {
    it('should handle empty userIds array', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully deleted 0 user(s)',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: [] }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          body: JSON.stringify({ userIds: [] }),
        })
      )
    })

    it('should handle userIds with UUID format', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully deleted 2 user(s)',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
      }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          body: JSON.stringify({
            userIds: [
              '550e8400-e29b-41d4-a716-446655440000',
              '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            ],
          }),
        })
      )
    })

    it('should handle maximum number of user IDs (10)', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully deleted 10 user(s)',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = {
        userIds: Array.from({ length: 10 }, (_, i) => `user-${i + 1}`),
      }
      const result = await deleteUsers(params)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully deleted 10 user(s)')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          body: JSON.stringify({ userIds: params.userIds }),
        })
      )
    })
  })

  describe('Request Configuration', () => {
    it('should set correct HTTP method', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should set Content-Type header to application/json', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should disable caching with no-store', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const params = { userIds: ['user-123'] }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
        })
      )
    })

    it('should send userIds in request body as JSON', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const userIds = ['user-123', 'user-456']
      const params = { userIds }
      await deleteUsers(params)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ userIds }),
        })
      )
    })
  })
})
