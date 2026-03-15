'use server'
// Shared utilities (error handling, logging, SSL handling)
import { redirect } from 'next/navigation.js'
import { getServerSession } from 'next-auth'

import { env } from '@/env/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { authOptions } from '@/lib/auth/auth-config.js'

const logger = createLogger({ prefix: 'backendRequest' })

/**
 * Configuration options for {@link backendRequest}.
 *
 * All server actions that communicate with the backend should pass these
 * options. Authentication headers, request body serialisation, timeout
 * handling, and 401 retry logic are all managed centrally by
 * `backendRequest` based on these values.
 */
export interface BackendRequestOptions {
  /** HTTP method for the request. */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /**
   * Backend endpoint path, with or without a leading slash.
   * @example '/users/register'
   * @example 'users/register'
   */
  endpoint: string
  /** Request body. Will be serialised to JSON. */
  body?: unknown
  /** Optional `AbortSignal` to cancel the request from the call site. */
  signal?: AbortSignal
  /** Additional HTTP headers merged on top of the default `Content-Type: application/json`. */
  headers?: Record<string, string>
  /**
   * Request timeout in milliseconds. Must be one of the allowed values:
   * `5000`, `10000`, `15000` (default), or `30000`.
   * Any other value silently falls back to the default of `15000` ms.
   */
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
   * HTTP status codes for which errors should not be logged.
   *
   * Use this for expected non-2xx responses — for example, a 404 when checking
   * whether a resource exists yet. Errors with a matching status are still thrown
   * so the caller can handle them, but no `error`-level log entries are emitted
   * by `backendRequest` or `handleResponse`.
   */
  suppressLogForStatus?: number[]
  /**
   * Internal flag — set automatically by the retry logic on a 401.
   * Prevents infinite retry loops. Do not set manually.
   * @internal
   */
  _isRetry?: boolean
}

/**
 * Constructs a fully-qualified URL from the base API URL and an endpoint path.
 *
 * Trailing slashes are removed from `apiUrl` iteratively (not via regex) to
 * avoid ReDoS vulnerabilities. A leading slash is added to `endpoint` if
 * absent, so both `'/users'` and `'users'` produce the same result.
 *
 * @param apiUrl - The base backend URL (e.g. `'https://api.example.com'`).
 * @param endpoint - The endpoint path (e.g. `'/users/register'` or `'users/register'`).
 * @returns The fully-qualified URL string.
 */
function normalizeUrl(apiUrl: string, endpoint: string): string {
  // Remove trailing slashes safely without ReDoS vulnerability
  let base = apiUrl
  while (base.endsWith('/')) {
    base = base.slice(0, -1)
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

/**
 * Parses the response body from a `fetch` or `node-fetch` call and returns
 * the typed result, or throws a structured error for non-2xx responses.
 *
 * The body is read as text first and then parsed as JSON so that plain-text
 * error payloads are also captured. On non-ok responses the error object
 * receives `status` and `body` properties for downstream handling.
 *
 * 401 responses are **thrown** (not redirected) so that {@link handle401}
 * can decide whether to retry transparently or redirect the user.
 *
 * @template T - The expected shape of the successful response body.
 * @param res - The `Response` (or `node-fetch` equivalent) to parse.
 * @param url - The fully-qualified URL, included in the error for context.
 * @returns A promise resolving to the parsed response body typed as `T`.
 * @throws {Error} When the response status is not in the 2xx range. The
 *   thrown error has `status: number` and `body: unknown` properties.
 */
async function handleResponse<T>(
  res: Response | Awaited<ReturnType<typeof import('node-fetch').default>>,
  url: string,
  suppressLogForStatus?: number[]
): Promise<T> {
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }

  if (!res.ok) {
    if (!suppressLogForStatus?.includes(res.status)) {
      logger.error('[backendRequest] non-ok response', undefined, {
        event: 'server-action.backend-request.failed',
        url,
        statusCode: res.status,
        body: parsed,
      })
    }

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
 * Attempts a single transparent retry after a 401 by refreshing the session.
 *
 * Calls `getServerSession()`, which triggers the NextAuth `jwt` callback and
 * performs a silent token refresh if the access token has expired. If the
 * refresh succeeds the original request is retried exactly once (via
 * `_isRetry: true`) with the new access token. If the refresh fails — or the
 * refreshed session still has an error — the user is redirected to
 * `/signin?error=session_expired`.
 *
 * @template T - The expected shape of the successful response body.
 * @param options - The original {@link BackendRequestOptions} that triggered
 *   the 401. The `Authorization` header will be replaced with the refreshed
 *   token before retrying.
 * @returns A promise resolving to the typed response from the retried request.
 * @throws Redirects to `/signin?error=session_expired` (via Next.js
 *   `redirect()`) when the token refresh fails.
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
 * Handles a caught 401 Unauthorized error according to the caller's
 * `redirectOn401` preference.
 *
 * Decision tree:
 * - `redirectOn401 !== false` **and** first attempt → calls {@link attemptRetry}
 *   for a transparent silent-refresh retry.
 * - `redirectOn401 !== false` **and** already a retry (`_isRetry === true`) →
 *   redirects to `/signin?error=session_expired`.
 * - `redirectOn401 === false` → rethrows the error so the caller can handle
 *   it (e.g. show a modal or perform cleanup before redirecting).
 * - Any non-401 error is always rethrown regardless of `redirectOn401`.
 *
 * @template T - The expected shape of the successful response body.
 * @param error - The caught error. Only errors with `status === 401` trigger
 *   retry or redirect logic; all others are rethrown immediately.
 * @param options - The {@link BackendRequestOptions} from the original call,
 *   used to inspect `redirectOn401` and `_isRetry`.
 * @returns A promise resolving to `T` if the transparent retry succeeds.
 * @throws The original `error` when `redirectOn401 === false` or the error
 *   status is not 401. Redirects (via Next.js `redirect()`) on a failed retry.
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

/**
 * Central HTTP client for all Next.js server actions that communicate with
 * the backend API.
 *
 * Features:
 * - Normalises the base URL and endpoint into a fully-qualified request URL.
 * - Serialises the request body to JSON.
 * - Enforces an allow-list of safe timeout values (5 s, 10 s, 15 s, 30 s)
 *   to prevent resource exhaustion from caller-supplied values.
 * - Detects local HTTPS with a self-signed certificate and bypasses TLS
 *   verification using `node-fetch` + `https.Agent` for development only.
 * - On a 401 response, attempts a single silent token refresh via
 *   {@link attemptRetry}. If the refresh fails, redirects to
 *   `/signin?error=session_expired`.
 * - Emits structured log entries for completed requests, failures, and
 *   retries using event names from the `server-action.*` namespace.
 *
 * @template T - The expected shape of the successful JSON response body.
 * @param options - Request configuration. See {@link BackendRequestOptions}.
 * @returns A promise resolving to the parsed response typed as `T`.
 * @throws {Error} When `BACKEND_AI_CALLBACK_URL` is not configured.
 * @throws {Error} When the backend returns a non-2xx response (carries
 *   `status: number` and `body: unknown` properties on the thrown error).
 * @throws Redirects to `/signin?error=session_expired` via Next.js
 *   `redirect()` when a 401 cannot be resolved by a token refresh.
 *
 * @example
 * ```ts
 * const data = await backendRequest<UserDto>({
 *   method: 'GET',
 *   endpoint: '/users/me',
 *   headers: { Authorization: `Bearer ${token}` },
 * })
 * ```
 */
export async function backendRequest<T>(options: BackendRequestOptions): Promise<T> {
  const apiUrl = env.BACKEND_AI_CALLBACK_URL
  if (!apiUrl)
    throw new Error(
      'Backend API URL not configured (NEXT_PUBLIC_BACKEND_URL / BACKEND_URL / BACKEND_AI_CALLBACK_URL)'
    )

  const url = normalizeUrl(apiUrl, options.endpoint)
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }

  const DEFAULT_TIMEOUT_MS = 15000

  /**
   * Validates `timeoutMs` against an allow-list of safe values.
   *
   * Only `5000`, `10000`, `15000`, and `30000` are accepted. Any other value
   * (including `undefined`) silently falls back to `DEFAULT_TIMEOUT_MS`
   * (15 000 ms) to prevent resource exhaustion from arbitrary caller input.
   *
   * @param timeoutMs - The caller-supplied timeout in milliseconds, if any.
   * @returns A validated timeout value in milliseconds.
   */
  function getTimeoutMs(timeoutMs?: number): number {
    // Only allow known-safe values to prevent resource exhaustion
    const allowed = new Set([5000, 10000, 15000, 30000])
    const v = Number(timeoutMs ?? DEFAULT_TIMEOUT_MS)
    return allowed.has(v) ? v : DEFAULT_TIMEOUT_MS
  }

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

      const result = await handleResponse<T>(res, url, options.suppressLogForStatus)

      logger.info('Backend request completed', {
        event: 'server-action.backend-request.completed',
        endpoint: options.endpoint,
        statusCode: res.status,
        durationMs: Math.round(Date.now() - startTime),
      })

      return result
    } catch (err) {
      const error = err as Error & { status?: number }
      const will401Retry =
        error.status === 401 && options.redirectOn401 !== false && !options._isRetry
      const isSuppressed = options.suppressLogForStatus?.includes(error.status ?? -1) ?? false
      if (!will401Retry && !isSuppressed) {
        logger.error(
          'Backend request failed',
          err instanceof Error ? err : new Error(String(err)),
          {
            event: 'server-action.backend-request.failed',
            endpoint: options.endpoint,
            durationMs: Math.round(Date.now() - startTime),
          }
        )
      }
      return handle401<T>(error, options)
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

      const result = await handleResponse<T>(res, url, options.suppressLogForStatus)

      logger.info('Backend request completed', {
        event: 'server-action.backend-request.completed',
        endpoint: options.endpoint,
        statusCode: res.status,
        durationMs: Math.round(Date.now() - startTime),
      })

      return result
    } catch (err) {
      const error = err as Error & { status?: number }
      const will401Retry =
        error.status === 401 && options.redirectOn401 !== false && !options._isRetry
      const isSuppressed = options.suppressLogForStatus?.includes(error.status ?? -1) ?? false
      if (!will401Retry && !isSuppressed) {
        logger.error(
          'Backend request failed',
          err instanceof Error ? err : new Error(String(err)),
          {
            event: 'server-action.backend-request.failed',
            endpoint: options.endpoint,
            durationMs: Math.round(Date.now() - startTime),
          }
        )
      }
      return handle401<T>(error, options)
    } finally {
      clearTimeout(timeout)
    }
  }
}
