import { renderHook } from '@testing-library/react'
import { type Session } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { useSessionGuard } from '@/view/hooks/useSessionGuard.js'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
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
    it('should call signOut when session.error is RefreshTokenExpired', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      renderHook(() => useSessionGuard())

      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: '/signin?error=session_expired',
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

    it('should react to session error changes', () => {
      const { rerender } = renderHook(() => useSessionGuard())

      expect(mockSignOut).not.toHaveBeenCalled()

      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      rerender()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: '/signin?error=session_expired',
      })
    })

    it('should not call signOut again when re-rendered with the same error', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      const { rerender } = renderHook(() => useSessionGuard())

      expect(mockSignOut).toHaveBeenCalledTimes(1)

      rerender()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})
