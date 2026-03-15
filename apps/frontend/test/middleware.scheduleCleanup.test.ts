import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// This test verifies that the scheduled cleanup job prunes expired entries
// from the in-memory `rateMap` used by the in-process rate limiter.
describe('scheduleRateMapCleanup', () => {
  const origEnv = process.env


  beforeEach(() => {
    // Use fake timers so the `setTimeout` scheduled at module load is controllable
    vi.useFakeTimers()
    // Ensure module cache is cleared so module-level scheduling uses our env and fake timers
    vi.resetModules()
    // Keys match the @t3-oss/env-nextjs schema names in src/env/server.ts.
    // RATE_LIMIT_WINDOW is derived from env.DEFAULT_RATE_LIMIT_WINDOW; setting it to '2'
    // gives a 2s window → 4s cleanup interval. DEFAULT_RATE_LIMIT_MAX is also set to '2'
    // to keep the test configuration consistent with the default env shape.
    process.env = { ...origEnv, DEFAULT_RATE_LIMIT_WINDOW: '2', DEFAULT_RATE_LIMIT_MAX: '2' }
    // Re-register the env mock after vi.resetModules() clears the mock registry.
    vi.doMock('@/env/index.js', () => ({
      get env() {
        return {
          DEFAULT_RATE_LIMIT_WINDOW: process.env.DEFAULT_RATE_LIMIT_WINDOW,
          DEFAULT_RATE_LIMIT_MAX: process.env.DEFAULT_RATE_LIMIT_MAX,
          TRUSTED_PROXIES: process.env.TRUSTED_PROXIES,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        }
      },
      clientEnv: {},
      serverEnv: {},
    }))
    // Align fake timers with real time to keep Date.now behavior predictable
    vi.setSystemTime(Date.now())
  })

  afterEach(() => {
    // Restore environment and timers
    process.env = origEnv
    vi.useRealTimers()
  })

  it('cleans up expired keys after the configured cleanup interval', async () => {
    // Import the middleware module after setting env and fake timers so its
    // `scheduleRateMapCleanup()` call is under our control.
    const middlewareModule = await import('@/middleware.js')
    const { __getRateLimiterSize, __resetRateLimiter, checkAndUpdateRate } = middlewareModule

    // Start from a clean state
    __resetRateLimiter()
    expect(__getRateLimiterSize()).toBe(0)

    // Add two keys at time t0
    checkAndUpdateRate('cleanup:key:one')
    checkAndUpdateRate('cleanup:key:two')
    expect(__getRateLimiterSize()).toBe(2)

    // Advance time by 1 second (still within the 2s window)
    vi.advanceTimersByTime(1000)
    // No cleanup should have run yet (cleanup interval = window * 2 = 4s)
    expect(__getRateLimiterSize()).toBe(2)

    // Advance time to trigger the scheduled cleanup (4s from start)
    vi.advanceTimersByTime(3000)

    // Allow any pending microtasks to complete after timers run
    await Promise.resolve()

    // Both original timestamps should be expired and removed by the cleanup job
    expect(__getRateLimiterSize()).toBe(0)

    // Stop the module's cleanup timer to avoid interfering with other tests
    if (typeof middlewareModule.__stopRateMapCleanup === 'function') {
      middlewareModule.__stopRateMapCleanup()
    }
  })
})
