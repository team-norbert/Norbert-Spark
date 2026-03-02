import { render, screen } from '@testing-library/react'
import { type Session } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { SessionGuard } from '@/view/client-components/SessionGuard.js'

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

describe('SessionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  describe('Children Rendering', () => {
    it('should render children when session has no error', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div data-testid="child-content">Protected Content</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render children when session is null (unauthenticated)', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

      render(
        <SessionGuard>
          <div data-testid="child-content">Public Content</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('should render children when session is loading', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'loading' })

      render(
        <SessionGuard>
          <div data-testid="child-content">Loading Content</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('first')).toBeInTheDocument()
      expect(screen.getByTestId('second')).toBeInTheDocument()
    })

    it('should render text content as children', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

      render(<SessionGuard>Plain text content</SessionGuard>)

      expect(screen.getByText('Plain text content')).toBeInTheDocument()
    })

    it('should render children even when session has RefreshTokenExpired error', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div data-testid="child-content">Still Visible</div>
        </SessionGuard>
      )

      // Children are still rendered — signOut handles the redirect asynchronously
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })
  })

  describe('Sign-Out on RefreshTokenExpired', () => {
    it('should call signOut when session.error is RefreshTokenExpired', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

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

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut when session is null', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut when session.error is undefined', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: undefined }),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut for a different error string', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'OAuthSyncCacheMiss' }),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should not call signOut for an empty error string', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: '' }),
        status: 'authenticated',
      })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()
    })
  })

  describe('useSession Integration', () => {
    it('should call useSession on mount', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockUseSession).toHaveBeenCalled()
    })

    it('should react to session error changes', () => {
      const { rerender } = render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).not.toHaveBeenCalled()

      // Simulate session updating with an error
      mockUseSession.mockReturnValue({
        data: createMockSession({ error: 'RefreshTokenExpired' }),
        status: 'authenticated',
      })

      rerender(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

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

      const { rerender } = render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(mockSignOut).toHaveBeenCalledTimes(1)

      rerender(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      // useEffect with the same dependency value should not re-fire
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})
