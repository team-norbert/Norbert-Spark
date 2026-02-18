'use server'

import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

interface UpdateChatTypePayload {
  id: string
  name?: string
  seoFriendlyId?: string
  description?: string
}

interface UpdateChatTypeResult {
  success: boolean
  error?: string
}

/**
 * Server Action to update a chat type
 *
 * Updates a chat type's name, SEO friendly ID, and/or description.
 * Only accessible to users with 'admin' or 'moderator' roles.
 *
 * @param {UpdateChatTypePayload} payload - The chat type data to update
 * @returns Promise with a result object indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await updateChatType({ id: 'uuid', name: 'New Name' })
 * if (result.success) { ... }
 * ```
 */
export async function updateChatType(
  payload: UpdateChatTypePayload
): Promise<UpdateChatTypeResult> {
  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: 'No authentication token available' }
  }

  try {
    await backendRequest<void>({
      method: 'PUT',
      endpoint: '/ai/chats/config',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}
