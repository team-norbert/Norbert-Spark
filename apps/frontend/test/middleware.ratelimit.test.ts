// Mock next-auth/jwt as in existing tests
import { getToken } from 'next-auth/jwt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as middlewareModule from '@/middleware.js'
import { __getRateLimiterSize, __resetRateLimiter, middleware } from '@/middleware.js'

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }))

// We'll mock Upstash modules. `limitMock` controls the runtime return value.
const limitMock = vi.fn()
vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: class {
      constructor(_opts: unknown) {}
      static slidingWindow() {
        return () => {}
      }
      limit = (...args: unknown[]) => limitMock(...args)
    },
  }
})

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(_opts: unknown) {}
  },
}))

describe('Middleware Rate Limiting', () => {
  const baseUrl = 'http://localhost:3000'
  const origEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...origEnv,
      NEXTAUTH_SECRET: 'test-secret',
      // no external rate-limit service required for in-memory limiter
      UPSTASH_REDIS_REST_URL: 'url',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }
    __resetRateLimiter()
  })

  afterEach(() => {
    process.env = origEnv
  })

  const createRequest = (pathname: string, method = 'GET') =>
    new Request(`${baseUrl}${pathname}`, { method })

  it.skip('allows requests under the rate limit and sets rate-limit headers', async () => {
    // Use in-memory limiter: first request should be allowed and include headers
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/api/test')
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    // default max is 10, first request consumes 1 -> remaining should be 9
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it.skip('blocks requests when over the limit with 429 and headers', async () => {
    // Consume the in-memory limiter up to its max, then assert the next request is blocked
    vi.mocked(getToken).mockResolvedValue(null)

    // consume default RATE_LIMIT_MAX (10) requests
    for (let i = 0; i < 10; i++) {
      const r = await middleware(createRequest('/api/test'))
      expect(r.status).toBe(200)
    }

    // now the next request should be blocked
    const blocked = await middleware(createRequest('/api/test'))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(blocked.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it.skip('attaches rate-limit headers to redirect responses', async () => {
    // unauthenticated -> protected route triggers redirect and headers should be attached
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/admin', 'POST')
    const res = await middleware(req)

    expect(res.status).toBe(302)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    // default max is 10; the single request consumes 1 -> remaining should be 9
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  describe('key expiry and memory cleanup', () => {
    // Explicit window and max so the test does not rely on env defaults.
    // Using a 10 s window keeps the time-advancement values small and readable.
    const TEST_WINDOW = 10
    const TEST_MAX = 5
    let mod: typeof import('@/middleware.js')

    beforeEach(async () => {
      // Install fake timers before the module loads so that the cleanup
      // setTimeout scheduled at module evaluation time is under our control.
      vi.useFakeTimers()
      vi.setSystemTime(Date.now())
      // Clear the module registry so the next import picks up our env overrides.
      vi.resetModules()
      process.env.DEFAULT_RATE_LIMIT_WINDOW = String(TEST_WINDOW)
      process.env.DEFAULT_RATE_LIMIT_MAX = String(TEST_MAX)
      // Re-register the env mock after vi.resetModules() clears the mock registry.
      // Using a getter so every property access re-reads process.env, matching the
      // pattern used in middleware.scheduleCleanup.test.ts.
      // Only the rate-limit env vars are needed: this test exercises checkAndUpdateRate,
      // which reads RATE_LIMIT_WINDOW and RATE_LIMIT_MAX at module evaluation time.
      // TRUSTED_PROXIES and NEXTAUTH_SECRET are only used by the middleware() handler,
      // which is not called here.
      vi.doMock('@/env/index.js', () => ({
        get env() {
          return {
            DEFAULT_RATE_LIMIT_WINDOW: process.env.DEFAULT_RATE_LIMIT_WINDOW,
            DEFAULT_RATE_LIMIT_MAX: process.env.DEFAULT_RATE_LIMIT_MAX,
          }
        },
        clientEnv: {},
        serverEnv: {},
      }))
      mod = await import('@/middleware.js')
      // Stop the background cleanup timer so advancing time in the test does
      // not accidentally trigger the periodic pruning job.
      mod.__stopRateMapCleanup()
      mod.__resetRateLimiter()
    })

    afterEach(() => {
      vi.useRealTimers()
      // Belt-and-suspenders cleanup: the outer afterEach already restores
      // process.env = origEnv, but deleting here keeps the inner scope tidy
      // in case the outer hook ordering ever changes.
      delete process.env.DEFAULT_RATE_LIMIT_WINDOW
      delete process.env.DEFAULT_RATE_LIMIT_MAX
    })

    it('removes expired keys from rateMap and resets remaining to RATE_LIMIT_MAX - 1 after window expires', () => {
      const testKey = 'test:key:cleanup'

      // Make a request to add an entry to rateMap.
      const result1 = mod.checkAndUpdateRate(testKey)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(TEST_MAX - 1)
      expect(mod.__getRateLimiterSize()).toBe(1)

      // Advance Date.now() past the configured window via fake timers.
      // This makes nowSeconds() return a value TEST_WINDOW + 1 seconds later,
      // so the previous timestamp falls outside the sliding window and is pruned.
      vi.advanceTimersByTime((TEST_WINDOW + 1) * 1000)

      // The stale timestamp is filtered out; remaining resets to TEST_MAX - 1,
      // confirming the pruning branch executed (observable side-effect of cleanup).
      const result2 = mod.checkAndUpdateRate(testKey)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(TEST_MAX - 1)
      // Key was deleted when its timestamp array became empty, then re-added.
      expect(mod.__getRateLimiterSize()).toBe(1)

      // Advance time again and add a second key.
      vi.advanceTimersByTime((TEST_WINDOW + 1) * 1000)

      const result3 = mod.checkAndUpdateRate('test:key:different')
      expect(result3.success).toBe(true)
      expect(mod.__getRateLimiterSize()).toBe(2)

      // Advance time once more so testKey's entry expires again.
      vi.advanceTimersByTime((TEST_WINDOW + 1) * 1000)

      // testKey is pruned and recreated; remaining resets, confirming window reset.
      const result4 = mod.checkAndUpdateRate(testKey)
      expect(result4.success).toBe(true)
      expect(result4.remaining).toBe(TEST_MAX - 1)
      expect(mod.__getRateLimiterSize()).toBe(2)
    })
  })
})
