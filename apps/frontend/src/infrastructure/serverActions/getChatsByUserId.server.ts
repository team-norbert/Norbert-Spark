'use server'

import type { AIUserIdResponseSchemaType } from '@norberts-spark/shared'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

const logger = createLogger({ prefix: '[getChatsByUserId:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

/**
 * Server Action to fetch all chats for a specific user
 * Calls backend /ai/chats/{userId} endpoint server-side (single network hop)
 *
 * @param userId - The UUID v7 of the user
 * @returns Response with success flag and array of chat objects ({ id, chatTypeId, seoFriendlyId })
 */
export async function getChatsByUserIdAction(userId: string): Promise<AIUserIdResponseSchemaType> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in getChatsByUserIdAction')
      return { success: false, data: [] }
    }

    const response = await backendRequest<AIUserIdResponseSchemaType>({
      method: 'GET',
      endpoint: `/ai/chats/${userId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: 10000,
    })

    return response
  } catch (error_) {
    const err = error_ as BackendError
    logger.error('getChatsByUserIdAction error', err)

    // Return empty response on error to prevent UI breaking
    return { success: false, data: [] }
  }
}
