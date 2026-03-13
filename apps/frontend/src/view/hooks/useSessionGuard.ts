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
            { event: 'session-guard.logout.failed' }
          )
        } finally {
          // Use signOut with redirect:false then hard-navigate via window.location
          // so the browser performs a full page reload. Without this, Next.js App
          // Router intercepts the navigation as a client-side route change, leaving
          // the current page's React tree mounted while only updating the URL —
          // resulting in the dashboard UI being visible at /signin?error=session_expired.
          await signOut({ redirect: false })
          window.location.href = '/signin?error=session_expired'
        }
      })()
    }
  }, [session?.error])
}
