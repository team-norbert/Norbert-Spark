import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIChatOptionsResponse } from '@/domain/ai/chat-config.js'

describe('getAIChatConfig', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should return chat configuration when authentication is successful', async () => {
      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant for everyday tasks',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
          },
          {
            id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
            name: 'Fitness Tracker',
            description: 'Track your fitness goals and progress',
            createdAt: '2024-01-16T10:30:00Z',
            updatedAt: '2024-01-16T10:30:00Z',
            seoFriendlyId: 'fitness-tracker',
            seoFriendlyBase64Id: 'AZQv42ejfD2OX2p7jJ',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      const result = await getAIChatConfig()

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/ai/chats/config',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      })
    })

    it('should return empty array when no chat types exist', async () => {
      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      const result = await getAIChatConfig()

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(0)
    })

    it('should return single chat type', async () => {
      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      const result = await getAIChatConfig()

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
    })

    it('should handle chat types with all required fields', async () => {
      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'Level 2 Gym Instructor',
            description: 'Expert fitness and training assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-16T15:45:00Z',
            seoFriendlyId: 'level-2-gym-instructor',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      const result = await getAIChatConfig()

      expect(result.data[0]).toHaveProperty('id')
      expect(result.data[0]).toHaveProperty('name')
      expect(result.data[0]).toHaveProperty('description')
      expect(result.data[0]).toHaveProperty('createdAt')
      expect(result.data[0]).toHaveProperty('updatedAt')
      expect(result.data[0]).toHaveProperty('seoFriendlyId')
      expect(result.data[0]).toHaveProperty('seoFriendlyBase64Id')
      expect(result.data[0]?.seoFriendlyBase64Id).toBeTruthy()
      expect(result.data[0]?.seoFriendlyBase64Id?.length).toBeGreaterThan(0)
    })
  })

  describe('authentication failures', () => {
    it('should throw error when no auth token available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request failures', () => {
    it('should propagate error when backend request fails', async () => {
      const mockError = new Error('Backend service unavailable')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Backend service unavailable')
    })

    it('should propagate error when backend returns 401 unauthorized', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { success: false, error: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Unauthorized')
    })

    it('should propagate error when backend returns 403 forbidden', async () => {
      const mockError = Object.assign(new Error('Access denied'), {
        status: 403,
        body: { success: false, error: 'Admin role required' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Access denied')
    })

    it('should propagate error when backend returns 500 internal server error', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { success: false, error: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Internal server error')
    })

    it('should handle network errors', async () => {
      const mockError = new Error('Network request failed')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Network request failed')
    })

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await expect(getAIChatConfig()).rejects.toThrow('Request timeout')
    })
  })

  describe('request configuration', () => {
    it('should call backend with correct endpoint', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await getAIChatConfig()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/ai/chats/config',
        })
      )
    })

    it('should use GET method', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await getAIChatConfig()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should include authorization header with Bearer token', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await getAIChatConfig()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        })
      )
    })

    it('should call getAuthToken before making backend request', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getAIChatConfig } =
        await import('@/infrastructure/serverActions/getAIChatConfig.server.js')

      await getAIChatConfig()

      expect(mockGetAuthToken).toHaveBeenCalledBefore(mockBackendRequest)
    })
  })
})
