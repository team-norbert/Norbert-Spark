'use server'

import type { AIChatOptionsResponse } from '@/domain/ai/chat-config.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth.js'

/**
 * Server Action to fetch AI chat types
 *
 * Retrieves all available chat types with their details and SEO-friendly identifiers.
 * This endpoint is accessible to all authenticated users (not restricted to admin/moderator).
 *
 * @returns Promise with the chat types data
 * @throws {Error} If the request fails or user is not authenticated
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
    endpoint: '/ai/chats/types',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
