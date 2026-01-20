import { useQuery } from '@tanstack/react-query'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { getAIChatConfig } from '@/infrastructure/serverActions/getAIChatConfig.server.js'

interface UseAIChatConfigReturn {
  chatTypes: readonly ChatType[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * React Query hook for fetching AI chat configuration
 * Provides automatic caching, refetching, and loading states
 *
 * @returns Object containing chat types, loading state, error, and refetch function
 *
 * @example
 * ```typescript
 * const { chatTypes, isLoading, error, refetch } = useAIChatConfig()
 * ```
 */
export function useAIChatConfig(): UseAIChatConfigReturn {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['ai-chat-config'],
    queryFn: async () => {
      const response = await getAIChatConfig()
      console.log('response', response)
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
