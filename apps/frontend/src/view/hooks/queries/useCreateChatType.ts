'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation.js'

import type { CreateChatTypeData, CreateChatTypeResponse } from '@/domain/ai/chat-config.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { createAIChatSettingsById } from '@/infrastructure/serverActions/createAIChatSettingsById.server.js'
import { createChatType } from '@/infrastructure/serverActions/createChatType.server.js'

const logger = createLogger({ prefix: '[useCreateChatType]' })

/**
 * TanStack Query mutation hook for creating a new AI chat type.
 *
 * On success this hook performs two sequential operations:
 *   1. POST /ai/chats/config          — creates the chat type
 *   2. POST /ai/chats/config/{id}/settings — seeds initial AI settings with a
 *      default prompt, using the new chat type's ID as chatTypeId
 *
 * After both calls succeed the user is redirected to /chat-types.
 *
 * @example
 * ```typescript
 * const mutation = useCreateChatType()
 * await mutation.mutateAsync({ name: 'Support', description: 'Customer support chat' })
 * ```
 */
export function useCreateChatType() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<CreateChatTypeResponse, Error, CreateChatTypeData>({
    mutationFn: async (data: CreateChatTypeData) => {
      // Step 1: Create the chat type
      const result = await createChatType(data)

      if (result?.success) {
        const newId = result.data.id

        try {
          // Step 2: Seed initial AI settings for the new chat type
          await createAIChatSettingsById(newId, {
            chatTypeId: newId,
            prompt: 'Enter prompt here',
          })
        } catch (error) {
          logger.error('Failed to seed initial AI settings for new chat type', {
            error,
            chatTypeId: newId,
          })

          // Surface a clear, actionable error so the caller knows the chat type
          // exists but needs manual configuration for its AI settings.
          throw new Error(
            'The chat type was created, but initial AI settings could not be created. ' +
              'Please open the new chat type and configure its AI settings manually.',
            { cause: error }
          )
        }
      }

      return result
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ['ai-chat-config'] }).catch((error) => {
          logger.error('Failed to invalidate ai-chat-config query after creation', { error })
        })

        // Redirect to the chat types list
        router.push('/chat-types')
      }
    },
  })
}
