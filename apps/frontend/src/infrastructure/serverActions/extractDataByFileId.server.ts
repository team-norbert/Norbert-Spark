'use server'

import type { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth.js'

type ExtractedInvoiceData = z.infer<typeof pdfSchema>

const logger = createLogger({ prefix: '[extractDataByFileId:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

/**
 * Server Action to extract data from a file by its fileKey
 * Calls backend /ai/extract-data/{fileId} endpoint server-side
 *
 * @param fileKey - The unique identifier for the file in the bucket
 * @returns Response with success flag and extracted data
 */
export async function extractDataByFileIdAction(
  fileKey: string
): Promise<{ success: boolean; data?: ExtractedInvoiceData; error?: string }> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in extractDataByFileIdAction')
      return { success: false, error: 'No authentication token' }
    }

    logger.info('Calling extract data endpoint', { fileKey })

    const response = await backendRequest<{
      success: boolean
      data?: ExtractedInvoiceData
      error?: string
    }>({
      method: 'GET',
      endpoint: `/ai/extract-data/${encodeURIComponent(fileKey)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: 30000, // Longer timeout for AI extraction
    })

    logger.info('Response from extract data', { response })

    return response
  } catch (error) {
    const err = error as BackendError
    logger.error('extractDataByFileIdAction error', { fileKey, error: err })

    // Return error response
    return { success: false, error: err.message || 'Failed to extract data' }
  }
}
