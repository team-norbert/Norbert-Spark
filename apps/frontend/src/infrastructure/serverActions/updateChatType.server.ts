'use server'

import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

interface UpdateChatTypePayload {
  id: string
  name?: string
  seoFriendlyId?: string
  description?: string
}

/**
 * Server Action to update a chat type
 *
 * Updates a chat type's name, SEO friendly ID, and/or description.
 * Only accessible to users with 'admin' or 'moderator' roles.
 *
 * @param {UpdateChatTypePayload} payload - The chat type data to update
 * @returns Promise that resolves when update is successful
 * @throws {Error} If the request fails or user is not authenticated/authorized
 *
 * @example
 * ```typescript
 * try {
 *   await updateChatType({ id: 'uuid', name: 'New Name' })
 * } catch (error) {
 *   console.error('Failed to update chat type:', error)
 * }
 * ```
 */
export async function updateChatType(payload: UpdateChatTypePayload): Promise<void> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  await backendRequest<void>({
    method: 'PUT',
    endpoint: '/ai/chats/config',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}
