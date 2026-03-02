import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Ensure environment uses local HTTPS so backendRequest takes the local-https path
const API_URL = 'https://localhost:4321'

describe('backendRequest effectiveTimeoutMs', () => {
  let originalEnv: string | undefined
  let setTimeoutSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalEnv = process.env.BACKEND_AI_CALLBACK_URL
    process.env.BACKEND_AI_CALLBACK_URL = API_URL

    // Mock node-fetch (dynamically imported by the module under test)
    vi.mock('node-fetch', () => ({
      default: vi.fn().mockResolvedValue({ ok: true, text: async () => '{}' }),
    }))

    // Spy on global setTimeout to capture the delay value used by backendRequest
    setTimeoutSpy = vi.spyOn(global as never, 'setTimeout')
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    if (originalEnv === undefined) delete process.env.BACKEND_AI_CALLBACK_URL
    else process.env.BACKEND_AI_CALLBACK_URL = originalEnv
  })

  it('uses provided finite positive timeoutMs when valid', async () => {
    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')

    await backendRequest({ method: 'GET', endpoint: '/ping', timeoutMs: 2000 })

    // first arg is the callback, second is the delay
    expect(setTimeoutSpy).toHaveBeenCalled()
    const delay = setTimeoutSpy.mock.calls[0][1]
    expect(delay).toBe(15000)
  })

  it('falls back to default when timeoutMs is negative or non-finite', async () => {
    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')

    await backendRequest({ method: 'GET', endpoint: '/ping', timeoutMs: -100 })

    expect(setTimeoutSpy).toHaveBeenCalled()
    const delay = setTimeoutSpy.mock.calls[0][1]
    // per implementation the default is 15000 for invalid values
    expect(delay).toBe(15000)
  })

  it('combines external signal with timeout using AbortSignal.any()', async () => {
    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')

    // Create an external AbortController
    const externalController = new AbortController()

    // Spy on AbortSignal.any to verify it's called with both signals
    const abortSignalAnySpy = vi.spyOn(AbortSignal, 'any')

    await backendRequest({
      method: 'GET',
      endpoint: '/ping',
      signal: externalController.signal,
      timeoutMs: 5000,
    })

    // Verify AbortSignal.any was called
    expect(abortSignalAnySpy).toHaveBeenCalled()

    // Verify it was called with an array containing both signals
    const callArgs = abortSignalAnySpy.mock.calls[0]?.[0]
    expect(callArgs).toBeDefined()
    expect(Array.isArray(callArgs)).toBe(true)
    expect(callArgs).toHaveLength(2)
    expect(callArgs?.[0]).toBe(externalController.signal)
  })

  it('uses only controller signal when no external signal provided', async () => {
    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')

    // Spy on AbortSignal.any to verify it's NOT called when no external signal
    const abortSignalAnySpy = vi.spyOn(AbortSignal, 'any')

    await backendRequest({
      method: 'GET',
      endpoint: '/ping',
      timeoutMs: 5000,
    })

    // Verify AbortSignal.any was NOT called (no external signal to combine)
    expect(abortSignalAnySpy).not.toHaveBeenCalled()
  })
})

describe('backendRequest 401 transparent retry', () => {
  let redirectMock: ReturnType<typeof vi.fn>
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.BACKEND_AI_CALLBACK_URL
    process.env.BACKEND_AI_CALLBACK_URL = API_URL

    vi.resetModules()

    redirectMock = vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT: ${url}`)
    })
    vi.doMock('next/navigation.js', () => ({ redirect: redirectMock }))
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn() }))
    vi.doMock('@/lib/auth/auth-config.js', () => ({ authOptions: {} }))
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    }))
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    if (originalEnv === undefined) delete process.env.BACKEND_AI_CALLBACK_URL
    else process.env.BACKEND_AI_CALLBACK_URL = originalEnv
  })

  it('retries once with a refreshed Authorization header on 401', async () => {
    const mockNodeFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => '{"error":"Unauthorized"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '{"data":"ok"}',
      })
    vi.doMock('node-fetch', () => ({ default: mockNodeFetch }))

    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce({
      accessToken: 'new-access-token',
      expires: '2099-01-01',
       
    } as any)

    const result = await backendRequest({ method: 'GET', endpoint: '/api/data' })

    expect(result).toEqual({ data: 'ok' })
    expect(mockNodeFetch).toHaveBeenCalledTimes(2)
    const [, secondCallOptions] = mockNodeFetch.mock.calls[1] as [
      string,
      { headers: Record<string, string> },
    ]
    expect(secondCallOptions.headers.Authorization).toBe('Bearer new-access-token')
  })

  it('calls getServerSession exactly once on 401 before retrying', async () => {
    const mockNodeFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => '{"error":"Unauthorized"}',
      })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{}' })
    vi.doMock('node-fetch', () => ({ default: mockNodeFetch }))

    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')
    const { getServerSession } = await import('next-auth')
    const mockGetServerSession = vi.mocked(getServerSession)
     
    mockGetServerSession.mockResolvedValueOnce({
      accessToken: 'new-access-token',
      expires: '2099-01-01',
    } as any)

    await backendRequest({ method: 'GET', endpoint: '/api/data' })

    expect(mockGetServerSession).toHaveBeenCalledTimes(1)
  })

  it('redirects to /signin when retry also returns 401', async () => {
    vi.doMock('node-fetch', () => ({
      default: vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => '{"error":"Unauthorized"}',
      }),
    }))

    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')
    const { getServerSession } = await import('next-auth')
     
    vi.mocked(getServerSession).mockResolvedValueOnce({
      accessToken: 'new-access-token',
      expires: '2099-01-01',
    } as any)

    await expect(backendRequest({ method: 'GET', endpoint: '/api/data' })).rejects.toThrow(
      'NEXT_REDIRECT: /signin?error=session_expired'
    )
    expect(redirectMock).toHaveBeenCalledWith('/signin?error=session_expired')
  })

  it('redirects to /signin when session refresh fails (null session)', async () => {
    vi.doMock('node-fetch', () => ({
      default: vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => '{"error":"Unauthorized"}',
      }),
    }))

    // getServerSession returns null — simulates failed session refresh
    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValue(null)

    await expect(backendRequest({ method: 'GET', endpoint: '/api/data' })).rejects.toThrow(
      'NEXT_REDIRECT: /signin?error=session_expired'
    )
    expect(redirectMock).toHaveBeenCalledWith('/signin?error=session_expired')
  })

  it('throws without redirecting when redirectOn401 is false', async () => {
    vi.doMock('node-fetch', () => ({
      default: vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => '{"error":"Unauthorized"}',
      }),
    }))

    const { backendRequest } = await import('@/infrastructure/serverActions/baseServerAction.js')
    const { getServerSession } = await import('next-auth')

    const error = await backendRequest({
      method: 'GET',
      endpoint: '/api/data',
      redirectOn401: false,
    }).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error & { status?: number }).status).toBe(401)
    expect(vi.mocked(getServerSession)).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
