'use server'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { getAuthToken } from '@/lib/auth.js'

import { backendRequest } from './baseServerAction.js'

const logger = createLogger({ prefix: '[delete-users:action]' })

export interface DeleteUsersResult {
  success: boolean
  message: string
  status: number
}

/**
 * Server Action for deleting users
 * Calls backend DELETE /users endpoint server-side
 *
 * @param userIds - Array of user IDs to delete
 * @returns Result with success status and message
 */
export async function deleteUsersAction(userIds: string[]): Promise<DeleteUsersResult> {
  try {
    logger.info('Deleting users', { count: userIds.length })

    // Get auth token for the request
    const token = await getAuthToken()
    if (!token) {
      logger.error('No auth token found')
      return {
        success: false,
        message: 'Authentication required',
        status: 401,
      }
    }

    await backendRequest<{ message: string }>({
      method: 'DELETE',
      endpoint: '/users',
      body: { userIds },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: 10000,
    })

    logger.info('Users deleted successfully', { count: userIds.length })

    return {
      success: true,
      message: `Successfully deleted ${userIds.length} user${userIds.length > 1 ? 's' : ''}`,
      status: 200,
    }
  } catch (error_) {
    const err = error_ as Error & { status?: number; body?: unknown }

    logger.error('deleteUsersAction error', {
      error: err.message,
      status: err.status,
      body: err.body,
    })

    // Map backend errors to user-friendly messages
    if (err.status === 401) {
      return {
        success: false,
        message: 'Authentication expired. Please sign in again.',
        status: 401,
      }
    }

    if (err.status === 403) {
      return {
        success: false,
        message: 'You do not have permission to delete users.',
        status: 403,
      }
    }

    if (err.status === 404) {
      return {
        success: false,
        message: 'One or more users not found.',
        status: 404,
      }
    }

    // Generic error message for other cases
    return {
      success: false,
      message: err.message || 'Failed to delete users. Please try again.',
      status: err.status || 500,
    }
  }
}
