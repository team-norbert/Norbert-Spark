'use server'

import type { CreateChatTypeData, CreateChatTypeResponse } from '@/domain/ai/chat-config.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

/**
 * Server Action to create a new AI chat type
 *
 * Sends a POST request to the backend /ai/chats/config endpoint
 * to create a new chat type with the given name and description.
 * Only accessible to users with 'admin' or 'ai-admin' roles.
 *
 * @param {CreateChatTypeData} payload - The name and description for the new chat type
 * @returns {Promise<CreateChatTypeResponse>} The created chat type with generated IDs
 * @throws {Error} If the request fails or user is not authenticated/authorized
 *
 * @example
 * ```typescript
 * const result = await createChatType({ name: 'Support Chat', description: 'For customer support' })
 * console.log(result.data.id) // newly created UUID
 * ```
 */
export async function createChatType(payload: CreateChatTypeData): Promise<CreateChatTypeResponse> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  return backendRequest<CreateChatTypeResponse>({
    method: 'POST',
    endpoint: '/ai/chats/config',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}
