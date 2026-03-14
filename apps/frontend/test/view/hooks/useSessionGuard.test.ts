import { renderHook, waitFor } from '@testing-library/react'
import { type Session } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { logoutUserAction } from '@/infrastructure/serverActions/logoutUser.server.js'
import { useSessionGuard } from '@/view/hooks/useSessionGuard.js'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

// jsdom does not allow direct reassignment of window.location.href;
// replace it with a configurable spy so the hook's `window.location.href = ...`
// assignment doesn't throw in the test environment.
Object.defineProperty(window, 'location', {
  value: { ...window.location, href: '' },
  writable: true,
  configurable: true,
})

vi.mock('@/infrastructure/serverActions/logoutUser.server.js', () => ({
  logoutUserAction: vi
    .fn()
    .mockResolvedValue({ success: true, message: 'Logged out', status: 200 }),
}))

vi.mock('@/infrastructure/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

const mockUseSession = useSession as Mock
const mockSignOut = signOut as Mock

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      roles: ['user'],
    },
    accessToken: 'mock-access-token',
    expires: '2026-12-31T00:00:00.000Z',
    ...overrides,
  }
}

describe('useSessionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  describe('Sign-Out on RefreshTokenExpired', () => {
    it('should call signOut when session.error is RefreshTokenExpired', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
        expect(window.location.href).toBe('/signin?error=session_expired')
      })
    })

    it('should call logoutUserAction when session.error is RefreshTokenExpired', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      await waitFor(() => {
        expect(logoutUserAction).toHaveBeenCalledTimes(1)
      })
    })

    it('should still call signOut even when logoutUserAction fails', async () => {
      ;(logoutUserAction as Mock).mockRejectedValueOnce(new Error('Backend logout failed'))

      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
        expect(window.location.href).toBe('/signin?error=session_expired')
      })
    })

    it('should not call signOut when session has no error', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut when session is null', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut when session.error is undefined', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: undefined }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut for a different error string', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'OAuthSyncCacheMiss' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut for an empty error string', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: '' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()
    })
  })

  describe('useSession Integration', () => {
    it('should call useSession on mount', () => {
      renderHook(() => useSessionGuard())

      expect(mockUseSession).toHaveBeenCalled()
    })

    it('should react to session error changes', async () => {
      const { rerender } = renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()

      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      rerender()

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
        expect(window.location.href).toBe('/signin?error=session_expired')
      })
    })

    it('should not call signOut again when re-rendered with the same error', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      const { rerender } = renderHook(() => useSessionGuard())

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })

      rerender()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})
