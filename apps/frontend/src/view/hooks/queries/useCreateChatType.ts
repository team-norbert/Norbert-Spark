'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateChatTypeData, CreateChatTypeResponse } from '@/domain/ai/chat-config.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { createChatType } from '@/infrastructure/serverActions/createChatType.server.js'

const logger = createLogger({ prefix: '[useCreateChatType]' })

/**
 * TanStack Query mutation hook for creating a new AI chat type.
 *
 * Wraps the `createChatType` server action and invalidates the
 * `ai-chat-config` query cache on success so the chat types list
 * refreshes automatically.
 *
 * @example
 * ```typescript
 * const mutation = useCreateChatType()
 * await mutation.mutateAsync({ name: 'Support', description: 'Customer support chat' })
 * ```
 */
export function useCreateChatType() {
  const queryClient = useQueryClient()

  return useMutation<CreateChatTypeResponse, Error, CreateChatTypeData>({
    mutationFn: (data: CreateChatTypeData) => createChatType(data),
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ['ai-chat-config'] }).catch((error) => {
          logger.error('Failed to invalidate ai-chat-config query after creation', { error })
        })
      }
    },
  })
}
