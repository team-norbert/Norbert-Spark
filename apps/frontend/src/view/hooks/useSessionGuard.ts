import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Custom hook for session guard logic.
 * Monitors the session for token expiry errors and triggers sign-out when detected.
 *
 * @example
 * ```tsx
 * export function SessionGuard({ children }: { children: React.ReactNode }) {
 *   useSessionGuard()
 *   return <>{children}</>
 * }
 * ```
 */
export function useSessionGuard(): void {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      signOut({ callbackUrl: '/signin?error=session_expired' })
    }
  }, [session?.error])
}
