import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CreateVectorStoreRequest,
  CreateVectorStoreResponse,
} from '@/domain/ai/vector-store.js'

// ── Shared fixtures ───────────────────────────────────────────────────────────

const TEST_TOKEN = 'test-jwt-token'

const VECTOR_STORE_ID = '01933c89-6f67-7b3a-8e4c-123456789abc'
const CHAT_TYPE_ID = '01933c89-6f67-7b3a-8e4c-000000000001'
const EXISTING_MODEL_ID = '01933c89-6f67-7b3a-8e4c-000000000002'
const TIMESTAMP = '2026-03-14T10:00:00.000Z'

/** Minimal valid request using a pre-seeded embedding model */
const BASE_REQUEST_EXISTING_MODEL: CreateVectorStoreRequest = {
  id: VECTOR_STORE_ID,
  documents: [{ title: 'Heart of Darkness', source: 'rag/uuid/heart-of-darkness.pdf' }],
  embeddingModels: { existingModelId: EXISTING_MODEL_ID },
  vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: 300, chunkOverlap: 40 },
  chatAIOptions: { chatTypeId: CHAT_TYPE_ID },
}

/** Minimal valid request using a manually-defined embedding model */
const BASE_REQUEST_MANUAL_MODEL: CreateVectorStoreRequest = {
  id: VECTOR_STORE_ID,
  documents: [{ title: 'My Doc', source: 'rag/uuid/doc.pdf' }],
  embeddingModels: {
    modelName: 'text-embedding-3-large',
    modelProvider: 'openai',
    dimension: 1536,
  },
  vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: 500, chunkOverlap: 50 },
  chatAIOptions: { chatTypeId: CHAT_TYPE_ID },
}

/** Full response fixture */
const MOCK_RESPONSE: CreateVectorStoreResponse = {
  success: true,
  data: {
    documents: {
      id: '01933c89-0000-0000-0000-000000000001',
      title: 'Heart of Darkness',
      source: 'rag/uuid/heart-of-darkness.pdf',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    embeddingModels: {
      id: EXISTING_MODEL_ID,
      modelName: 'text-embedding-3-large',
      modelProvider: 'openai',
      dimension: 1536,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    vectorEmbeddings: {
      id: '01933c89-0000-0000-0000-000000000003',
      distanceMetric: 'cosine',
      chunkSize: 300,
      chunkOverlap: 40,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    chatAIOptions: {
      id: '01933c89-0000-0000-0000-000000000004',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
  },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createVectorStoreAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()

    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Successful requests ───────────────────────────────────────────────────

  describe('successful requests', () => {
    it('returns the backend response on success with an existing model', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      const result = await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(result).toEqual(MOCK_RESPONSE)
    })

    it('returns the backend response on success with a manually-defined model', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      const result = await createVectorStoreAction(BASE_REQUEST_MANUAL_MODEL)

      expect(result).toEqual(MOCK_RESPONSE)
    })

    it('passes the full payload as the request body', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({ body: BASE_REQUEST_EXISTING_MODEL })
      )
    })

    it('handles multiple documents in the request', async () => {
      const multiDocRequest: CreateVectorStoreRequest = {
        ...BASE_REQUEST_EXISTING_MODEL,
        documents: [
          { title: 'Chapter One', source: 'rag/uuid/ch1.pdf' },
          { title: 'Chapter Two', source: 'rag/uuid/ch2.pdf' },
          { title: 'Chapter Three', source: 'rag/uuid/ch3.pdf' },
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(multiDocRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({ body: multiDocRequest })
      )
    })

    it('handles all optional chatAIOptions fields', async () => {
      const fullOptionsRequest: CreateVectorStoreRequest = {
        ...BASE_REQUEST_EXISTING_MODEL,
        chatAIOptions: {
          chatTypeId: CHAT_TYPE_ID,
          maxTokens: 2000,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: -0.1,
          stopSequences: ['\n', ' Human:'],
          seed: 42,
          maxRetries: 3,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(fullOptionsRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({ body: fullOptionsRequest })
      )
    })

    it('handles all supported distance metrics', async () => {
      const distanceMetrics = ['cosine', 'euclidean', 'dot_product'] as const

      for (const distanceMetric of distanceMetrics) {
        vi.resetModules()
        mockGetAuthToken = vi.fn().mockResolvedValue(TEST_TOKEN)
        mockBackendRequest = vi.fn().mockResolvedValue(MOCK_RESPONSE)
        vi.doMock('@/lib/auth/auth.js', () => ({ getAuthToken: mockGetAuthToken }))
        vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
          backendRequest: mockBackendRequest,
        }))

        const request: CreateVectorStoreRequest = {
          ...BASE_REQUEST_EXISTING_MODEL,
          vectorEmbeddings: { ...BASE_REQUEST_EXISTING_MODEL.vectorEmbeddings, distanceMetric },
        }

        const { createVectorStoreAction } =
          await import('@/infrastructure/serverActions/createVectorStore.server.js')

        await createVectorStoreAction(request)

        expect(mockBackendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              vectorEmbeddings: expect.objectContaining({ distanceMetric }),
            }),
          })
        )
      }
    })

    it('handles all supported embedding model dimension values', async () => {
      const dimensions = [3072, 1536, 1024, 768, 384] as const

      for (const dimension of dimensions) {
        vi.resetModules()
        mockGetAuthToken = vi.fn().mockResolvedValue(TEST_TOKEN)
        mockBackendRequest = vi.fn().mockResolvedValue(MOCK_RESPONSE)
        vi.doMock('@/lib/auth/auth.js', () => ({ getAuthToken: mockGetAuthToken }))
        vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
          backendRequest: mockBackendRequest,
        }))

        const request: CreateVectorStoreRequest = {
          ...BASE_REQUEST_MANUAL_MODEL,
          embeddingModels: { modelName: 'model', modelProvider: 'openai', dimension },
        }

        const { createVectorStoreAction } =
          await import('@/infrastructure/serverActions/createVectorStore.server.js')

        await createVectorStoreAction(request)

        expect(mockBackendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              embeddingModels: expect.objectContaining({ dimension }),
            }),
          })
        )
      }
    })
  })

  // ── Request configuration ─────────────────────────────────────────────────

  describe('request configuration', () => {
    it('calls backendRequest with POST method', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }))
    })

    it('calls backendRequest with the correct endpoint', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/ai/create-vector-store' })
      )
    })

    it('includes Authorization Bearer header with the token', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        })
      )
    })

    it('calls backendRequest with the exact full options object', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/ai/create-vector-store',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        body: BASE_REQUEST_EXISTING_MODEL,
      })
    })

    it('retrieves the auth token before making the backend request', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockGetAuthToken).toHaveBeenCalledBefore(mockBackendRequest)
    })

    it('calls getAuthToken exactly once per invocation', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockGetAuthToken).toHaveBeenCalledOnce()
    })

    it('calls backendRequest exactly once per invocation', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(MOCK_RESPONSE)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)

      expect(mockBackendRequest).toHaveBeenCalledOnce()
    })
  })

  // ── Authentication failures ───────────────────────────────────────────────

  describe('authentication failures', () => {
    it('throws when getAuthToken returns null', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'No authentication token available'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('throws when getAuthToken returns undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'No authentication token available'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('throws when getAuthToken returns empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'No authentication token available'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('does not call backendRequest when auth token is missing', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow()

      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  // ── Backend request failures ──────────────────────────────────────────────

  describe('backend request failures', () => {
    it('propagates generic network errors', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Network request failed'))

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Network request failed'
      )
    })

    it('propagates 400 Bad Request errors', async () => {
      const error = Object.assign(new Error('Bad request'), {
        status: 400,
        body: { success: false, error: 'Invalid input data' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Bad request'
      )
    })

    it('propagates 401 Unauthorized errors', async () => {
      const error = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { success: false, error: 'Authentication required' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Unauthorized'
      )
    })

    it('propagates 403 Forbidden errors', async () => {
      const error = Object.assign(new Error('Forbidden'), {
        status: 403,
        body: { success: false, error: 'Insufficient permissions' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Forbidden'
      )
    })

    it('propagates 500 Internal Server Error', async () => {
      const error = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { success: false, error: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Internal server error'
      )
    })

    it('propagates timeout errors', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Request timeout'))

      const { createVectorStoreAction } =
        await import('@/infrastructure/serverActions/createVectorStore.server.js')

      await expect(createVectorStoreAction(BASE_REQUEST_EXISTING_MODEL)).rejects.toThrow(
        'Request timeout'
      )
    })
  })
})
