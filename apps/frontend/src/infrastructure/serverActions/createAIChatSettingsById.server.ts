'use server'

import { getAuthToken } from '@/lib/auth/auth.js'

import { backendRequest } from './baseServerAction.js'

interface CreateAIChatSettingsPayload {
  chatTypeId: string
  prompt: string
}

/**
 * Create initial AI chat settings for a newly created chat type.
 *
 * @param id - The chat type UUID (used in the URL path)
 * @param payload - Must include chatTypeId and prompt
 * @throws Error if no authentication token is available or request fails
 */
export async function createAIChatSettingsById(
  id: string,
  payload: CreateAIChatSettingsPayload
): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('No authentication token available')
  }

  await backendRequest<void>({
    method: 'POST',
    endpoint: `/ai/chats/config/${id}/settings`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}
