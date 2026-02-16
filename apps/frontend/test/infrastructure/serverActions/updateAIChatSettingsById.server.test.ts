import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PutAIChatSettings } from '@/domain/ai/chat-config.js'

describe('updateAIChatSettingsById', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'
  const TEST_CHAT_ID = '019b659a-2ad2-7fd8-9f32-35624caef900'

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
    it('should update AI chat settings when authentication is successful', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)

      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: `/ai/chats/config/${TEST_CHAT_ID}/settings`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: mockSettings,
      })
    })

    it('should handle settings with nullable fields set to null', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)

      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: `/ai/chats/config/${TEST_CHAT_ID}/settings`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: mockSettings,
      })
    })

    it('should pass correct chat ID to the endpoint', async () => {
      const differentChatId = '019b659a-ffff-7fd8-9f32-35624caef999'
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await updateAIChatSettingsById(differentChatId, mockSettings)

      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: `/ai/chats/config/${differentChatId}/settings`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: mockSettings,
      })
    })

    it('should send all settings fields in request body', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)

      const callArgs = mockBackendRequest.mock.calls[0]?.[0]
      expect(callArgs.body).toHaveProperty('prompt', mockSettings.prompt)
      expect(callArgs.body).toHaveProperty('maxTokens', mockSettings.maxTokens)
      expect(callArgs.body).toHaveProperty('temperature', mockSettings.temperature)
      expect(callArgs.body).toHaveProperty('topP', mockSettings.topP)
      expect(callArgs.body).toHaveProperty('frequencyPenalty', mockSettings.frequencyPenalty)
      expect(callArgs.body).toHaveProperty('presencePenalty', mockSettings.presencePenalty)
      expect(callArgs.body).toHaveProperty('topK', mockSettings.topK)
      expect(callArgs.body).toHaveProperty('stopSequences', mockSettings.stopSequences)
      expect(callArgs.body).toHaveProperty('seed', mockSettings.seed)
      expect(callArgs.body).toHaveProperty('maxRetries', mockSettings.maxRetries)
    })

    it('should not return a value on successful update', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      const result = await updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)

      expect(result).toBeUndefined()
    })
  })

  describe('authentication errors', () => {
    it('should throw error when no authentication token is available', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(null)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when authentication token is undefined', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should throw error when authentication token is empty string', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue('')

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'No authentication token available'
      )

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request errors', () => {
    it('should propagate errors from backendRequest', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      const testError = new Error('Network error')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(testError)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle 400 bad request errors', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      const error = new Error('Invalid request data') as Error & { status?: number }
      error.status = 400

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'Invalid request data'
      )
    })

    it('should handle 404 not found errors', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      const error = new Error('Not found') as Error & { status?: number }
      error.status = 404

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'Not found'
      )
    })

    it('should handle 403 forbidden errors', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      const error = new Error('Forbidden') as Error & { status?: number }
      error.status = 403

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'Forbidden'
      )
    })

    it('should handle 500 server errors', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      const error = new Error('Internal server error') as Error & { status?: number }
      error.status = 500

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).rejects.toThrow(
        'Internal server error'
      )
    })
  })

  describe('parameter validation', () => {
    it('should accept valid UUID format for chat ID', async () => {
      const mockSettings: PutAIChatSettings = {
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
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await expect(updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)).resolves.toBeUndefined()
    })

    it('should require prompt field in settings', async () => {
      const mockSettings: PutAIChatSettings = {
        prompt: 'Required prompt field',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateAIChatSettingsById } =
        await import('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

      await updateAIChatSettingsById(TEST_CHAT_ID, mockSettings)

      expect(mockBackendRequest.mock.calls[0]?.[0]?.body.prompt).toBeDefined()
      expect(mockBackendRequest.mock.calls[0]?.[0]?.body.prompt).toBe('Required prompt field')
    })
  })
})
