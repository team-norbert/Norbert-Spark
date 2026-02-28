import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EmbeddingModel } from '@/domain/ai/embedding-models.js'
import { useEmbeddingModels } from '@/view/hooks/queries/useEmbeddingModels.js'

// ---------------------------------------------------------------------------
// Inline asset data — does NOT import the real embedding_models.json file
// ---------------------------------------------------------------------------
vi.mock('@/assets/embedding_models.json', () => ({
  default: {
    embedding_models: [
      {
        provider: 'openai',
        name: 'text-embedding-3-large',
        dimension: 3072,
        status: 'current',
        release_year: 2024,
        recommended_usage: 'High-accuracy retrieval and enterprise search',
      },
      {
        provider: 'openai',
        name: 'text-embedding-ada-002',
        dimension: 1536,
        status: 'legacy',
        release_year: 2022,
        recommended_usage: 'Only for backward compatibility with existing vector databases',
      },
      {
        provider: 'cohere',
        name: 'embed-english-v3.0',
        dimension: 1024,
        status: 'current',
        release_year: 2023,
        recommended_usage: 'Strong English semantic search and enterprise document retrieval',
      },
    ],
  },
}))

vi.mock('@/infrastructure/serverActions/getEmbeddingModels.server.js', () => ({
  getEmbeddingModels: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

/** Matches the "openai::text-embedding-3-large" entry in the inline JSON mock */
const MODEL_OPENAI_LARGE: EmbeddingModel = {
  id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
  name: 'text-embedding-3-large',
  provider: 'openai',
  dimension: 3072,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
}

/** Matches the "openai::text-embedding-ada-002" entry in the inline JSON mock (legacy) */
const MODEL_OPENAI_ADA: EmbeddingModel = {
  id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
  name: 'text-embedding-ada-002',
  provider: 'openai',
  dimension: 1536,
  createdAt: '2022-04-01T10:00:00Z',
  updatedAt: '2022-04-01T10:00:00Z',
}

/** Matches the "cohere::embed-english-v3.0" entry in the inline JSON mock */
const MODEL_COHERE: EmbeddingModel = {
  id: '01942f8e-67a5-8d4e-9f6a-7b8c9d0e1f2a',
  name: 'embed-english-v3.0',
  provider: 'cohere',
  dimension: 1024,
  createdAt: '2023-11-01T10:00:00Z',
  updatedAt: '2023-11-01T10:00:00Z',
}

/** Does NOT match any entry in the inline JSON mock — meta fields must be absent */
const MODEL_UNKNOWN: EmbeddingModel = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  name: 'voyage-4',
  provider: 'voyage',
  dimension: 1024,
  createdAt: '2024-03-01T10:00:00Z',
  updatedAt: '2024-03-01T10:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useEmbeddingModels', () => {
  let getEmbeddingModelsMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetAllMocks()
    const { getEmbeddingModels } =
      await import('@/infrastructure/serverActions/getEmbeddingModels.server.js')
    getEmbeddingModelsMock = vi.mocked(getEmbeddingModels)
  })

  // -------------------------------------------------------------------------
  // Successful data fetching
  // -------------------------------------------------------------------------

  describe('Successful data fetching', () => {
    it('should fetch embedding models successfully', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({
        success: true,
        data: [MODEL_OPENAI_LARGE, MODEL_OPENAI_ADA],
      })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.embeddingModels).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1)
      expect(result.current.embeddingModels).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('should return empty array when no models are available', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.embeddingModels).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should return a single model', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.embeddingModels).toHaveLength(1)
      expect(result.current.embeddingModels[0]?.id).toBe(MODEL_OPENAI_LARGE.id)
    })

    it('should return all base EmbeddingModel fields on each item', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const model = result.current.embeddingModels[0]
      expect(model?.id).toBe(MODEL_OPENAI_LARGE.id)
      expect(model?.name).toBe(MODEL_OPENAI_LARGE.name)
      expect(model?.provider).toBe(MODEL_OPENAI_LARGE.provider)
      expect(model?.dimension).toBe(MODEL_OPENAI_LARGE.dimension)
      expect(model?.createdAt).toBe(MODEL_OPENAI_LARGE.createdAt)
      expect(model?.updatedAt).toBe(MODEL_OPENAI_LARGE.updatedAt)
    })
  })

  // -------------------------------------------------------------------------
  // Metadata merging (unique feature of this hook)
  // -------------------------------------------------------------------------

  describe('Metadata merging', () => {
    it('should merge status, release_year and recommended_usage for a matched model', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const model = result.current.embeddingModels[0]
      expect(model?.status).toBe('current')
      expect(model?.release_year).toBe(2024)
      expect(model?.recommended_usage).toBe('High-accuracy retrieval and enterprise search')
    })

    it('should merge "legacy" status for a legacy model', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_ADA] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const model = result.current.embeddingModels[0]
      expect(model?.status).toBe('legacy')
      expect(model?.release_year).toBe(2022)
      expect(model?.recommended_usage).toBe(
        'Only for backward compatibility with existing vector databases'
      )
    })

    it('should not add meta fields for a model with no matching JSON entry', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_UNKNOWN] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const model = result.current.embeddingModels[0]
      expect(model?.status).toBeUndefined()
      expect(model?.release_year).toBeUndefined()
      expect(model?.recommended_usage).toBeUndefined()
    })

    it('should correctly merge metadata across a mixed list of matched and unmatched models', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({
        success: true,
        data: [MODEL_OPENAI_LARGE, MODEL_UNKNOWN, MODEL_COHERE],
      })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const [openai, unknown, cohere] = result.current.embeddingModels

      // Matched — should have meta
      expect(openai?.status).toBe('current')
      expect(openai?.release_year).toBe(2024)
      expect(openai?.recommended_usage).toBe('High-accuracy retrieval and enterprise search')

      // Unmatched — no meta
      expect(unknown?.status).toBeUndefined()
      expect(unknown?.release_year).toBeUndefined()
      expect(unknown?.recommended_usage).toBeUndefined()

      // Matched — should have meta
      expect(cohere?.status).toBe('current')
      expect(cohere?.release_year).toBe(2023)
      expect(cohere?.recommended_usage).toBe(
        'Strong English semantic search and enterprise document retrieval'
      )
    })

    it('should preserve base model fields after merge', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_COHERE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const model = result.current.embeddingModels[0]
      // Base fields must not be overwritten by the merge
      expect(model?.id).toBe(MODEL_COHERE.id)
      expect(model?.name).toBe(MODEL_COHERE.name)
      expect(model?.provider).toBe(MODEL_COHERE.provider)
      expect(model?.dimension).toBe(MODEL_COHERE.dimension)
      expect(model?.createdAt).toBe(MODEL_COHERE.createdAt)
      expect(model?.updatedAt).toBe(MODEL_COHERE.updatedAt)
      // Plus the merged meta
      expect(model?.status).toBe('current')
    })

    it('should key the lookup by provider AND name (not name alone)', async () => {
      // Two models with the same name but different providers:
      // only the one whose provider matches the JSON entry should get meta
      const sameNameDifferentProvider: EmbeddingModel = {
        id: 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
        name: 'text-embedding-3-large', // same name as MODEL_OPENAI_LARGE
        provider: 'some-other-provider', // different provider — no match
        dimension: 3072,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({
        success: true,
        data: [MODEL_OPENAI_LARGE, sameNameDifferentProvider],
      })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const [matched, unmatched] = result.current.embeddingModels
      expect(matched?.status).toBe('current') // openai matches
      expect(unmatched?.status).toBeUndefined() // different provider — no match
    })
  })

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('Error handling', () => {
    it('should expose auth error and return empty array', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('No authentication token available'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('No authentication token available')
      expect(result.current.embeddingModels).toEqual([])
    })

    it('should expose backend server error', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('Backend service unavailable'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Backend service unavailable')
      expect(result.current.embeddingModels).toEqual([])
    })

    it('should expose network error', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('Network request failed'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Network request failed')
      expect(result.current.embeddingModels).toEqual([])
    })

    it('should expose 401 unauthorized error', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('Unauthorized'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Unauthorized')
    })

    it('should expose 403 forbidden error', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('Access denied'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Access denied')
    })
  })

  // -------------------------------------------------------------------------
  // Loading states
  // -------------------------------------------------------------------------

  describe('Loading states', () => {
    it('should set isLoading to true initially', () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockImplementation(() => new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.embeddingModels).toEqual([])
    })

    it('should set isLoading to false after a successful fetch', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading to false after a failed fetch', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockRejectedValue(new Error('Fetch failed'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  // Caching behaviour
  // -------------------------------------------------------------------------

  describe('Caching behaviour', () => {
    it('should not re-fetch on re-render when data is cached', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({
        success: true,
        data: [MODEL_OPENAI_LARGE, MODEL_OPENAI_ADA],
      })

      const { rerender, result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1)

      rerender()

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1) // no second call
      expect(result.current.embeddingModels).toHaveLength(2)
    })

    it('should share cache across multiple hook instances', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      const { result: result1 } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1)

      const { result: result2 } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1) // still only 1 fetch
      expect(result2.current.embeddingModels).toHaveLength(1)
    })
  })

  // -------------------------------------------------------------------------
  // Refetch functionality
  // -------------------------------------------------------------------------

  describe('Refetch functionality', () => {
    it('should update data when refetch is called', async () => {
      const qc = createQueryClient()

      getEmbeddingModelsMock
        .mockResolvedValueOnce({ success: true, data: [MODEL_OPENAI_LARGE] })
        .mockResolvedValueOnce({ success: true, data: [MODEL_OPENAI_LARGE, MODEL_COHERE] })

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.embeddingModels).toHaveLength(1)
      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(1)

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.embeddingModels).toHaveLength(2)
      })

      expect(getEmbeddingModelsMock).toHaveBeenCalledTimes(2)
    })

    it('should expose error when refetch fails', async () => {
      const qc = createQueryClient()

      getEmbeddingModelsMock
        .mockResolvedValueOnce({ success: true, data: [MODEL_OPENAI_LARGE] })
        .mockRejectedValueOnce(new Error('Refetch failed'))

      const { result } = renderHook(() => useEmbeddingModels(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error?.message).toBe('Refetch failed')
    })
  })

  // -------------------------------------------------------------------------
  // Query configuration
  // -------------------------------------------------------------------------

  describe('Query configuration', () => {
    it('should register the query under the "embedding-models" key', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [] })

      renderHook(() => useEmbeddingModels(), { wrapper: createWrapper(qc) })

      await waitFor(() => {
        const queries = qc.getQueryCache().getAll()
        expect(queries).toHaveLength(1)
        expect(queries[0]?.queryKey).toEqual(['embedding-models'])
      })
    })

    it('should record a dataUpdatedAt timestamp after a successful fetch', async () => {
      const qc = createQueryClient()
      getEmbeddingModelsMock.mockResolvedValue({ success: true, data: [MODEL_OPENAI_LARGE] })

      renderHook(() => useEmbeddingModels(), { wrapper: createWrapper(qc) })

      await waitFor(() => {
        const queries = qc.getQueryCache().getAll()
        expect(queries[0]?.state.dataUpdatedAt).toBeGreaterThan(0)
      })
    })
  })
})
