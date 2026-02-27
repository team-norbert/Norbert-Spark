import { useQuery } from '@tanstack/react-query'

import embeddingModelsAsset from '@/assets/embedding_models.json' with { type: 'json' }
import type { EmbeddingModelMeta,EnrichedEmbeddingModel } from '@/domain/ai/embedding-models.js'
import { getEmbeddingModels } from '@/infrastructure/serverActions/getEmbeddingModels.server.js'

interface UseEmbeddingModelsReturn {
  embeddingModels: readonly EnrichedEmbeddingModel[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

type AssetEntry = {
  provider: string
  name: string
  dimension: number
  status: 'current' | 'legacy'
  release_year: number
  recommended_usage: string
}

// Build a lookup map from the local JSON asset: "provider::name" → metadata
const metaByKey = new Map<string, EmbeddingModelMeta>(
  (embeddingModelsAsset.embedding_models as AssetEntry[]).map((entry) => [
    `${entry.provider}::${entry.name}`,
    {
      status: entry.status,
      release_year: entry.release_year,
      recommended_usage: entry.recommended_usage,
    },
  ])
)

/**
 * React Query hook for fetching available AI embedding models.
 * Merges the API response with local metadata from `embedding_models.json`
 * (status, release_year, recommended_usage) keyed by provider + name.
 * Provides automatic caching, background refetching, and loading states.
 *
 * @returns Object containing enriched embedding models, loading state, error, and refetch function
 *
 * @example
 * ```typescript
 * const { embeddingModels, isLoading, error } = useEmbeddingModels()
 * ```
 */
export function useEmbeddingModels(): UseEmbeddingModelsReturn {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['embedding-models'],
    queryFn: async () => {
      const response = await getEmbeddingModels()
      return response.data.map(
        (model): EnrichedEmbeddingModel => ({
          ...model,
          ...metaByKey.get(`${model.provider}::${model.name}`),
        })
      )
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — model list changes infrequently
    gcTime: 15 * 60 * 1000, // 15 minutes
  })

  return {
    embeddingModels: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch()
    },
  }
}
