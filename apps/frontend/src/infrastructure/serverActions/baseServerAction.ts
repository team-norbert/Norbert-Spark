'use server'
// Shared utilities (error handling, logging, SSL handling)
import { redirect } from 'next/navigation.js'
import { getServerSession } from 'next-auth'

import { env } from '@/env/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { authOptions } from '@/lib/auth/auth-config.js'

const logger = createLogger({ prefix: 'backendRequest' })

export interface BackendRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string // e.g. '/users/register' or 'users/register'
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
  timeoutMs?: number
  /**
   * Whether to automatically redirect to /signin on 401 Unauthorized errors.
   * Defaults to true for backward compatibility.
   *
   * Set to false if:
   * - You want to handle 401 errors differently (e.g., show a modal)
   * - The server action is called from a background operation
   * - You need to perform cleanup before redirecting
   *
   * When false, a 401 error will throw an Error with status 401 instead of redirecting.
   */
  redirectOn401?: boolean
  /**
   * Internal flag — set automatically by the retry logic on a 401.
   * Prevents infinite retry loops. Do not set manually.
   * @internal
   */
  _isRetry?: boolean
}

function normalizeUrl(apiUrl: string, endpoint: string) {
  // Remove trailing slashes safely without ReDoS vulnerability
  let base = apiUrl
  while (base.endsWith('/')) {
    base = base.slice(0, -1)
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

/**
 * Parse and handle response from fetch or node-fetch.
 * Extracts JSON, handles errors, and throws with proper context.
 * 401 errors are thrown (not redirected) so the caller can attempt a transparent retry.
 */
async function handleResponse<T>(
  res: Response | Awaited<ReturnType<typeof import('node-fetch').default>>,
  url: string
): Promise<T> {
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }

  if (!res.ok) {
    logger.error('[backendRequest] non-ok response', undefined, {
      event: 'server-action.backend-request.failed',
      url,
      statusCode: res.status,
      body: parsed,
    })

    const extractedError = (() => {
      if (!parsed || typeof parsed !== 'object') return undefined
      if ('error' in parsed) {
        const e = (parsed as { error?: unknown }).error
        return typeof e === 'string' ? e : undefined
      }
      return undefined
    })()

    const message = extractedError ?? res.statusText ?? 'Backend error'
    const err = new Error(message) as Error & { status?: number; body?: unknown }
    err.status = res.status
    err.body = parsed
    throw err
  }

  return parsed as T
}

/**
 * Attempt a single transparent retry after a 401 by refreshing the session.
 *
 * Calls `getServerSession()` which triggers the NextAuth `jwt` callback,
 * performing a silent token refresh if the access token has expired.
 * If the refresh succeeds, the original request is retried once with the
 * new access token. If the refresh fails, the user is redirected to sign in.
 */
async function attemptRetry<T>(options: BackendRequestOptions): Promise<T> {
  logger.info('[backendRequest] 401 received — attempting silent token refresh', {
    event: 'server-action.backend-request.retry',
  })
  const refreshedSession = await getServerSession(authOptions)

  if (refreshedSession?.accessToken && !refreshedSession?.error) {
    logger.info('[backendRequest] Token refreshed — retrying request', {
      event: 'server-action.backend-request.retry',
    })
    return backendRequest<T>({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${refreshedSession.accessToken}`,
      },
      _isRetry: true,
    })
  }

  logger.warn('[backendRequest] Token refresh failed — redirecting to sign-in', {
    event: 'server-action.backend-request.failed',
  })
  redirect('/signin?error=session_expired')
}

/**
 * Handles a caught 401 error.
 *
 * - If `redirectOn401 !== false` and this is the first 401 (`_isRetry` is not set),
 *   it attempts a transparent retry via `attemptRetry`.
 * - If `redirectOn401 !== false` and this is already a retry (`_isRetry` is true),
 *   it redirects to the sign-in page.
 * - If `redirectOn401 === false`, it does not redirect and rethrows the 401 error,
 *   allowing the caller to handle it (for example, with a custom flow).
 */
async function handle401<T>(
  error: Error & { status?: number },
  options: BackendRequestOptions
): Promise<T> {
  if (error.status === 401 && options.redirectOn401 !== false) {
    if (!options._isRetry) {
      return attemptRetry<T>(options)
    }
    redirect('/signin?error=session_expired')
  }
  throw error
}

export async function backendRequest<T>(options: BackendRequestOptions): Promise<T> {
  const apiUrl = env.BACKEND_AI_CALLBACK_URL
  if (!apiUrl)
    throw new Error(
      'Backend API URL not configured (NEXT_PUBLIC_BACKEND_URL / BACKEND_URL / BACKEND_AI_CALLBACK_URL)'
    )

  const url = normalizeUrl(apiUrl, options.endpoint)
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }

  const DEFAULT_TIMEOUT_MS = 15000

  function getTimeoutMs(timeoutMs?: number) {
    // Only allow known-safe values to prevent resource exhaustion
    const allowed = new Set([5000, 10000, 15000, 30000])
    const v = Number(timeoutMs ?? DEFAULT_TIMEOUT_MS)
    return allowed.has(v) ? v : DEFAULT_TIMEOUT_MS
  }

  // Validate and clamp timeout to acceptable range
  const effectiveTimeoutMs = getTimeoutMs(options.timeoutMs)

  // Check for local https with a self-signed cert (localhost / 127.0.0.1 / ::1)
  const isLocalHttps = (() => {
    try {
      const u = new URL(apiUrl)
      return (
        (['localhost', '127.0.0.1', '::1'].includes(u.hostname) ||
          u.hostname.endsWith('.localhost')) &&
        u.protocol === 'https:'
      )
    } catch {
      return false
    }
  })()

  if (isLocalHttps) {
    // use node-fetch + https.Agent to disable cert checks locally
    const https = await import('https')
    const nodeFetch = (await import('node-fetch')).default
    const agent = new https.Agent({ rejectUnauthorized: false })

    const startTime = Date.now()

    const controller = new AbortController()
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal
    const timeout = setTimeout(() => controller.abort(), effectiveTimeoutMs)

    try {
      const res = await nodeFetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        agent,
        signal: combinedSignal,
      })

      const result = await handleResponse<T>(res, url)

      logger.info('Backend request completed', {
        event: 'server-action.backend-request.completed',
        endpoint: options.endpoint,
        statusCode: res.status,
        durationMs: Math.round(Date.now() - startTime),
      })

      return result
    } catch (err) {
      logger.error('Backend request failed', err instanceof Error ? err : new Error(String(err)), {
        event: 'server-action.backend-request.failed',
        endpoint: options.endpoint,
        durationMs: Math.round(Date.now() - startTime),
      })
      return handle401<T>(err as Error & { status?: number }, options)
    } finally {
      clearTimeout(timeout)
    }
  } else {
    const startTime = Date.now()
    const controller = new AbortController()
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal
    const timeout = setTimeout(() => controller.abort(), effectiveTimeoutMs)

    try {
      const res = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: combinedSignal,
      })

      const result = await handleResponse<T>(res, url)

      logger.info('Backend request completed', {
        event: 'server-action.backend-request.completed',
        endpoint: options.endpoint,
        statusCode: res.status,
        durationMs: Math.round(Date.now() - startTime),
      })

      return result
    } catch (err) {
      logger.error('Backend request failed', err instanceof Error ? err : new Error(String(err)), {
        event: 'server-action.backend-request.failed',
        endpoint: options.endpoint,
        durationMs: Math.round(Date.now() - startTime),
      })
      return handle401<T>(err as Error & { status?: number }, options)
    } finally {
      clearTimeout(timeout)
    }
  }
}
