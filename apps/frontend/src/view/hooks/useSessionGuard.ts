import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { logoutUserAction } from '@/infrastructure/serverActions/logoutUser.server.js'

const logger = createLogger({ prefix: '[useSessionGuard]' })

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
      void (async () => {
        try {
          await logoutUserAction()
        } catch (error) {
          logger.error(
            'Failed to logout user on backend',
            error instanceof Error ? error : new Error(String(error)),
            { event: 'session-guard.redirect' }
          )
        } finally {
          await signOut({ callbackUrl: '/signin?error=session_expired' })
        }
      })()
    }
  }, [session?.error])
}
