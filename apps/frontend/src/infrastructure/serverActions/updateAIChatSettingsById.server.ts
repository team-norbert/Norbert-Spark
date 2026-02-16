'use server'

import type { PutAIChatSettings } from '@/domain/ai/chat-config.js'
import { getAuthToken } from '@/lib/auth/auth.js'

import { backendRequest } from './baseServerAction.js'

/**
 * Update AI chat settings for a specific chat type by ID
 * @param id - The unique identifier for the chat option
 * @param settings - The settings to update
 * @returns Promise that resolves when update is successful
 * @throws Error if no authentication token is available or if the request fails
 */
export async function updateAIChatSettingsById(
  id: string,
  settings: PutAIChatSettings
): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('No authentication token available')
  }

  await backendRequest<void>({
    method: 'PUT',
    endpoint: `/ai/chats/config/${id}/settings`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: settings,
  })
}
