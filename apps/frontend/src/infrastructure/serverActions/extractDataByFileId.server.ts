'use server'

import type { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

import { env } from '@/env/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { getAuthToken } from '@/lib/auth/auth.js'

type ExtractedInvoiceData = z.infer<typeof pdfSchema>

const logger = createLogger({ prefix: '[extractDataByFileId:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

type NDJSONResult = {
  fileName: string
  data: string
  success: boolean
  error?: string
}

/**
 * Parse and process a single NDJSON line
 * @param line - NDJSON line to parse
 * @returns Extracted invoice data if successful, null otherwise
 */
function parseNDJSONLine(line: string): ExtractedInvoiceData | null {
  try {
    const result = JSON.parse(line) as NDJSONResult

    if (result.success && result.data) {
      const parsedData = JSON.parse(result.data) as ExtractedInvoiceData
      return parsedData
    }
  } catch (parseError) {
    logger.error(
      'Failed to parse NDJSON line',
      parseError instanceof Error ? parseError : new Error(String(parseError)),
      { event: 'server-action.extract-data.failed', lineLength: line.length }
    )
  }
  return null
}

/**
 * Server Action to extract data from a file by its fileKey
 * Calls backend /ai/extract-data/{fileId} endpoint server-side
 *
 * @param fileKey - The unique identifier for the file in the bucket
 * @returns Response with success flag and extracted data
 */
export async function extractDataByFileIdAction(fileKey: string): Promise<{
  success: boolean
  data?: ExtractedInvoiceData
  allResults?: ExtractedInvoiceData[]
  error?: string
  sessionExpired?: boolean
}> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in extractDataByFileIdAction', {
        event: 'server-action.extract-data.failed',
      })
      return { success: false, error: 'No authentication token' }
    }

    logger.info('Calling extract data endpoint', {
      event: 'server-action.extract-data.started',
      fileKey,
    })

    const backendUrl = env.BACKEND_URL
    const url = `${backendUrl}/api/v1/ai/extract-data/${encodeURIComponent(fileKey)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // Check for 401 Unauthorized (JWT expired on backend)
      if (response.status === 401) {
        logger.warn('JWT expired or unauthorized in extractDataByFileIdAction', {
          event: 'server-action.extract-data.failed',
        })
        return {
          success: false,
          error: 'Session expired. Please sign in again.',
          sessionExpired: true,
        }
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    // Stream NDJSON response line-by-line to avoid loading entire response into memory
    const allResults: ExtractedInvoiceData[] = []

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode chunk and append to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines from buffer
        const lines = buffer.split('\n')
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          const parsedData = parseNDJSONLine(trimmedLine)
          if (parsedData) {
            allResults.push(parsedData)
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const parsedData = parseNDJSONLine(buffer.trim())
        if (parsedData) {
          allResults.push(parsedData)
        }
      }
    } finally {
      reader.releaseLock()
    }

    logger.info('Response from extract data', {
      event: 'server-action.extract-data.completed',
      count: allResults.length,
    })

    return {
      success: true,
      allResults,
      data: allResults[allResults.length - 1],
    }
  } catch (error) {
    const err = error as BackendError

    logger.error('extractDataByFileIdAction error', err, {
      event: 'server-action.extract-data.failed',
      fileKey,
      // Surface the class name (e.g. 'TypeError', 'FetchError') separately from
      // err.name, which can be an empty string on some undici/fetch errors
      errorClass: error instanceof Error ? error.constructor.name : typeof error,
      // Surface the cause chain as a plain string so it appears even if
      // serializeError doesn't recurse deeply enough
      errorCause:
        err.cause instanceof Error
          ? `${err.cause.constructor.name}: ${err.cause.message}`
          : err.cause !== undefined
            ? String(err.cause)
            : undefined,
    })

    return { success: false, error: err.message || 'Failed to extract data' }
  }
}
