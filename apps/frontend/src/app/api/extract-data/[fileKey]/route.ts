import { env } from '@/env/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { getAuthToken } from '@/lib/auth/auth.js'

const logger = createLogger({ prefix: '[api:extract-data]' })

/**
 * API Route Handler to proxy NDJSON streaming from backend to frontend
 * This avoids SSL/CORS issues by doing server-to-server backend call
 * and streaming results to client on same origin
 */
export async function GET(request: Request, { params }: { params: Promise<{ fileKey: string }> }) {
  try {
    const { fileKey } = await params

    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available')
      return new Response(JSON.stringify({ error: 'No authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    logger.info('Proxying extraction request to backend', { fileKey })
    const backendUrl = env.BACKEND_URL
    const url = `${backendUrl}/api/v1/ai/extract-data/${encodeURIComponent(fileKey)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      logger.error('Backend returned error', undefined, { statusCode: response.status })
      return new Response(JSON.stringify({ error: `Backend error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stream the NDJSON response directly to client
    logger.info('Streaming response from backend to client')

    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    logger.error('API route error', error instanceof Error ? error : new Error(String(error)))
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
