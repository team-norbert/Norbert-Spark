import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIChatOptionSettingsResponse } from '@/domain/ai/chat-config.js'

describe('getAIChatSettingsById', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'
  const TEST_CHAT_ID = '019b659a-2ad2-7fd8-9f32-35624caef900'

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should return AI chat settings when authentication is successful', async () => {
      const mockResponse: AIChatOptionSettingsResponse = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          chatTypeId: '019b659a-2ad2-7fd8-9f32-35624caef901',
          prompt: 'You are a helpful AI assistant...',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
          topK: 40,
          stopSequences: ['END', 'STOP'],
          seed: 12345,
          maxRetries: 3,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      const result = await getAIChatSettingsById(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: `/ai/chats/config/${TEST_CHAT_ID}/settings`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      })
    })

    it('should handle settings with nullable fields', async () => {
      const mockResponse: AIChatOptionSettingsResponse = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          chatTypeId: '019b659a-2ad2-7fd8-9f32-35624caef901',
          prompt: 'You are a helpful AI assistant...',
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
          topK: null,
          stopSequences: null,
          seed: null,
          maxRetries: null,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      const result = await getAIChatSettingsById(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data.maxTokens).toBeNull()
      expect(result.data.temperature).toBeNull()
      expect(result.data.stopSequences).toBeNull()
    })

    it('should handle settings with all required fields', async () => {
      const mockResponse: AIChatOptionSettingsResponse = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          chatTypeId: '019b659a-2ad2-7fd8-9f32-35624caef901',
          prompt: 'Detailed system prompt...',
          maxTokens: 8192,
          temperature: 0.8,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
          topK: 50,
          stopSequences: ['END', 'STOP', 'FINISH'],
          seed: 54321,
          maxRetries: 5,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-16T15:45:00Z',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      const result = await getAIChatSettingsById(TEST_CHAT_ID)

      expect(result.data).toHaveProperty('id')
      expect(result.data).toHaveProperty('chatTypeId')
      expect(result.data).toHaveProperty('prompt')
      expect(result.data).toHaveProperty('maxTokens')
      expect(result.data).toHaveProperty('temperature')
      expect(result.data).toHaveProperty('topP')
      expect(result.data).toHaveProperty('frequencyPenalty')
      expect(result.data).toHaveProperty('presencePenalty')
      expect(result.data).toHaveProperty('topK')
      expect(result.data).toHaveProperty('stopSequences')
      expect(result.data).toHaveProperty('seed')
      expect(result.data).toHaveProperty('maxRetries')
      expect(result.data).toHaveProperty('createdAt')
      expect(result.data).toHaveProperty('updatedAt')
    })

    it('should pass correct chat ID to the endpoint', async () => {
      const differentChatId = '019b659a-ffff-7fd8-9f32-35624caef999'
      const mockResponse: AIChatOptionSettingsResponse = {
        success: true,
        data: {
          id: differentChatId,
          chatTypeId: '019b659a-2ad2-7fd8-9f32-35624caef901',
          prompt: 'Test prompt',
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
          topK: null,
          stopSequences: null,
          seed: null,
          maxRetries: null,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await getAIChatSettingsById(differentChatId)

      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: `/ai/chats/config/${differentChatId}/settings`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      })
    })
  })

  describe('authentication errors', () => {
    it('should throw error when no authentication token is available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when authentication token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when authentication token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request errors', () => {
    it('should propagate errors from backendRequest', async () => {
      const testError = new Error('Network error')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(testError)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow('Network error')
    })

    it('should handle 404 not found errors', async () => {
      const error = new Error('Not found') as Error & { status?: number }
      error.status = 404

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow('Not found')
    })

    it('should handle 403 forbidden errors', async () => {
      const error = new Error('Forbidden') as Error & { status?: number }
      error.status = 403

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow('Forbidden')
    })

    it('should handle 500 server errors', async () => {
      const error = new Error('Internal server error') as Error & { status?: number }
      error.status = 500

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      await expect(getAIChatSettingsById(TEST_CHAT_ID)).rejects.toThrow('Internal server error')
    })
  })

  describe('parameter validation', () => {
    it('should accept valid UUID format', async () => {
      const mockResponse: AIChatOptionSettingsResponse = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          chatTypeId: '019b659a-2ad2-7fd8-9f32-35624caef901',
          prompt: 'Test',
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
          topK: null,
          stopSequences: null,
          seed: null,
          maxRetries: null,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getAIChatSettingsById } =
        await import('@/infrastructure/serverActions/getAIChatSettingsById.server.js')

      const result = await getAIChatSettingsById(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
    })
  })
})
