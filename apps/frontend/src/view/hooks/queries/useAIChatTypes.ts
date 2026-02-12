import { useQuery } from '@tanstack/react-query'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { getAIChatTypes } from '@/infrastructure/serverActions/getAIChatTypes.server.js'

interface UseAIChatTypesReturn {
  chatTypes: readonly ChatType[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * React Query hook for fetching available AI chat types
 * Provides automatic caching, refetching, and loading states
 * This hook is accessible to all authenticated users (not restricted to admin/moderator)
 *
 * Use this hook to discover available chatTypeIds for the /ai/chat endpoint.
 *
 * @returns Object containing chat types, loading state, error, and refetch function
 *
 * @example
 * ```typescript
 * const { chatTypes, isLoading, error, refetch } = useAIChatTypes()
 * ```
 */
export function useAIChatTypes(): UseAIChatTypesReturn {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['ai-chat-types'],
    queryFn: async () => {
      const response = await getAIChatTypes()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - config doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    chatTypes: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch()
    },
  }
}
