'use server'

import type { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { getAuthToken } from '@/lib/auth.js'

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
    logger.error('Failed to parse NDJSON line', { line, error: parseError })
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
}> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in extractDataByFileIdAction')
      return { success: false, error: 'No authentication token' }
    }

    logger.info('Calling extract data endpoint', { fileKey })

    const backendUrl = process.env.BACKEND_URL || 'https://127.0.0.1:3001'
    const url = `${backendUrl}/api/v1/ai/extract-data/${encodeURIComponent(fileKey)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
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

    logger.info('Response from extract data', { count: allResults.length })

    return {
      success: true,
      allResults,
      data: allResults[allResults.length - 1],
    }
  } catch (error) {
    const err = error as BackendError
    logger.error('extractDataByFileIdAction error', { fileKey, error: err })

    return { success: false, error: err.message || 'Failed to extract data' }
  }
}
