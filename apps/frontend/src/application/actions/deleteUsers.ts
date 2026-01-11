import { UnifiedLogger } from '@/infrastructure/logging/logger.js'

export interface DeleteUsersParams {
  userIds: string[]
}

export interface DeleteUsersResult {
  success: boolean
  message: string
  status: number
}

const logger = new UnifiedLogger({ prefix: '[delete-users]' })

/**
 * Delete multiple users by their IDs.
 * Calls the backend DELETE /api/users endpoint.
 */
export async function deleteUsers(params: DeleteUsersParams): Promise<DeleteUsersResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:4321'
    const { userIds } = params

    logger.info('Deleting users:', { userIds })

    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string
        error?: string
      }
      const errorMessage =
        errorData.message ||
        errorData.error ||
        `Server returned ${response.status} ${response.statusText}`

      logger.error('Failed to delete users:', { status: response.status, errorMessage })

      return {
        status: response.status,
        success: false,
        message: `Failed to delete users: ${errorMessage}`,
      }
    }

    const data = (await response.json()) as { success: boolean; message: string }

    logger.info('Users deleted successfully:', { count: userIds.length })

    return {
      status: response.status,
      success: true,
      message: data.message || 'Users deleted successfully',
    }
  } catch (error) {
    logger.error('Error deleting users:', error)
    return {
      status: 500,
      success: false,
      message:
        'Unable to delete users: Network error or server unavailable. Please check your connection and try again.',
    }
  }
}
