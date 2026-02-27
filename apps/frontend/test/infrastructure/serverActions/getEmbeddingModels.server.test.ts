import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EmbeddingModelsResponse } from '@/domain/ai/embedding-models.js'

describe('getEmbeddingModels', () => {
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
    it('should return embedding models when authentication is successful', async () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'text-embedding-3-large',
            provider: 'openai',
            dimension: 3072,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
            name: 'text-embedding-3-small',
            provider: 'openai',
            dimension: 1536,
            createdAt: '2024-01-16T10:30:00Z',
            updatedAt: '2024-01-16T10:30:00Z',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      const result = await getEmbeddingModels()

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/ai/embedding-models',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      })
    })

    it('should return empty array when no embedding models exist', async () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      const result = await getEmbeddingModels()

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(0)
    })

    it('should return single embedding model', async () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'text-embedding-3-large',
            provider: 'openai',
            dimension: 3072,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      const result = await getEmbeddingModels()

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
    })

    it('should return models with all required fields', async () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'nomic-embed-text',
            provider: 'ollama',
            dimension: 768,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-16T15:45:00Z',
          },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      const result = await getEmbeddingModels()

      expect(result.data[0]).toHaveProperty('id')
      expect(result.data[0]).toHaveProperty('name')
      expect(result.data[0]).toHaveProperty('provider')
      expect(result.data[0]).toHaveProperty('dimension')
      expect(result.data[0]).toHaveProperty('createdAt')
      expect(result.data[0]).toHaveProperty('updatedAt')
    })

    it('should handle models with all supported dimension values', async () => {
      const dimensions = [3072, 1536, 1024, 768, 384] as const
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: dimensions.map((dimension, i) => ({
          id: `01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0${i}`,
          name: `model-${dimension}`,
          provider: 'openai',
          dimension,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        })),
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      const result = await getEmbeddingModels()

      expect(result.data).toHaveLength(5)
      expect(result.data.map((m) => m.dimension)).toEqual(dimensions)
    })
  })

  describe('authentication failures', () => {
    it('should throw error when no auth token available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('No authentication token available')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request failures', () => {
    it('should propagate error when backend request fails', async () => {
      const mockError = new Error('Backend service unavailable')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Backend service unavailable')
    })

    it('should propagate error when backend returns 401 unauthorized', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { success: false, error: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Unauthorized')
    })

    it('should propagate error when backend returns 403 forbidden', async () => {
      const mockError = Object.assign(new Error('Access denied'), {
        status: 403,
        body: { success: false, error: 'Admin role required' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Access denied')
    })

    it('should propagate error when backend returns 500 internal server error', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { success: false, error: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Internal server error')
    })

    it('should handle network errors', async () => {
      const mockError = new Error('Network request failed')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Network request failed')
    })

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await expect(getEmbeddingModels()).rejects.toThrow('Request timeout')
    })
  })

  describe('request configuration', () => {
    it('should call backend with correct endpoint', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await getEmbeddingModels()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/ai/embedding-models',
        })
      )
    })

    it('should use GET method', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await getEmbeddingModels()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should include authorization header with Bearer token', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await getEmbeddingModels()

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

      const { getEmbeddingModels } =
        await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')

      await getEmbeddingModels()

      expect(mockGetAuthToken).toHaveBeenCalledBefore(mockBackendRequest)
    })
  })
})
