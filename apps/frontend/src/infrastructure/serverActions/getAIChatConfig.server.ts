'use server'

import type { AIChatOptionsResponse } from '@/domain/ai/chat-config.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth.js'

/**
 * Server Action to fetch AI chat configuration
 *
 * Retrieves all available chat types with their details and SEO-friendly identifiers.
 * Only accessible to users with 'admin' or 'moderator' roles.
 *
 * @returns Promise with the chat configuration data
 * @throws {Error} If the request fails or user is not authenticated/authorized
 *
 * @example
 * ```typescript
 * const config = await getAIChatConfig()
 * console.log(config.data) // Array of chat types
 * ```
 */
export async function getAIChatConfig(): Promise<AIChatOptionsResponse> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  return backendRequest<AIChatOptionsResponse>({
    method: 'GET',
    endpoint: '/ai/chats/config',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
