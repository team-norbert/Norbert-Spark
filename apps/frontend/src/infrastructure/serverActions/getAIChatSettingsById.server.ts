'use server'

import type { AIChatOptionSettingsResponse } from '@/domain/ai/chat-config.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth.js'

/**
 * Server Action to fetch AI chat settings by ID
 *
 * Retrieves AI configuration settings for a specific chat type using its unique identifier.
 * Only accessible to authenticated users with proper authorization.
 *
 * @param id - The unique identifier (UUID) for the chat option
 * @returns Promise with the AI chat settings data
 * @throws {Error} If the request fails or user is not authenticated/authorized
 *
 * @example
 * ```typescript
 * const settings = await getAIChatSettingsById('019b659a-2ad2-7fd8-9f32-35624caef900')
 * console.log(settings.data) // AI chat option settings object
 * ```
 */
export async function getAIChatSettingsById(id: string): Promise<AIChatOptionSettingsResponse> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  return backendRequest<AIChatOptionSettingsResponse>({
    method: 'GET',
    endpoint: `/ai/chats/config/${id}/settings`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
