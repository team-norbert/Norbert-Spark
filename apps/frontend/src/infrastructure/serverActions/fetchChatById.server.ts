'use server'

import type { AIFetchChatResponseSchemaType } from '@norberts-spark/shared'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

const logger = createLogger({ prefix: '[fetchChatById:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

/**
 * Server Action to fetch a specific chat by its ID
 * Calls backend /ai/fetchChat/{chatId} endpoint server-side (single network hop)
 *
 * @param chatId - The UUID v7 of the chat
 * @returns Response with success flag and chat data including messages
 */
export async function fetchChatByIdAction(chatId: string): Promise<AIFetchChatResponseSchemaType> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in fetchChatByIdAction', {
        event: 'server-action.fetch-chat.failed',
      })
      return { success: false, data: { id: chatId, messages: [] } }
    }

    const response = await backendRequest<AIFetchChatResponseSchemaType>({
      method: 'GET',
      endpoint: `/ai/fetchChat/${chatId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: 10000,
      // 404 is expected for brand-new chats that have no messages yet
      suppressLogForStatus: [404],
    })

    return response
  } catch (error) {
    const err = error as BackendError

    // A 404 on a new chat is expected — the chat doesn't exist in the DB yet.
    // Treat it as empty message history rather than a failure.
    if (err.status === 404) {
      logger.debug('Chat not found — new chat, returning empty messages', {
        event: 'server-action.fetch-chat.not-found',
        chatId,
      })
      return { success: true, data: { id: chatId, messages: [] } }
    }

    logger.error('fetchChatByIdAction error', err, { event: 'server-action.fetch-chat.failed' })

    // Return empty response on error to prevent UI breaking
    return { success: false, data: { id: chatId, messages: [] } }
  }
}
