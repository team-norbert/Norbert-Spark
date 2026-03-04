'use server'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

const logger = createLogger({ prefix: '[logout:action]' })

export interface LogoutResponse {
  success: boolean
  data?: {
    message?: string
  }
  error?: string
}

export interface LogoutResult {
  success: boolean
  message: string
  status: number
}

/**
 * Server Action for user logout
 * Calls backend POST /auth/logout endpoint server-side
 *
 * @returns Result with success status and message
 */
export async function logoutUserAction(): Promise<LogoutResult> {
  try {
    logger.info('Logging out user')

    const token = await getAuthToken()
    if (!token) {
      logger.error('No auth token found')
      return {
        success: false,
        message: 'Authentication required',
        status: 401,
      }
    }

    const parsed = await backendRequest<LogoutResponse>({
      method: 'POST',
      endpoint: '/auth/logout',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      redirectOn401: false,
      timeoutMs: 10000,
    })

    const message = parsed?.data?.message ?? 'Logged out'

    logger.info('Logout successful')

    return {
      success: true,
      message,
      status: 200,
    }
  } catch (error_) {
    const err = error_ as Error & { status?: number; body?: unknown }

    logger.error('logoutUserAction error', {
      error: err.message,
      status: err.status,
      body: err.body,
    })

    if (err.status === 401) {
      return {
        success: false,
        message: 'Authentication expired. Please sign in again.',
        status: 401,
      }
    }

    const body = err?.body as { error?: string } | undefined
    const errorMessage = body?.error ?? err.message

    return {
      success: false,
      message: errorMessage || 'Failed to log out. Please try again.',
      status: err.status || 500,
    }
  }
}
