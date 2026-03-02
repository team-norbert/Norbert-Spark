'use client'

import type { Session } from 'next-auth'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
  /** Polling interval in seconds to re-fetch the session (triggers jwt callback for silent refresh) */
  refetchInterval?: number
  /** Whether to re-fetch the session when the window regains focus */
  refetchOnWindowFocus?: boolean
}

/**
 * Client-side SessionProvider wrapper for next-auth
 * Wraps the app to provide session context to all client components
 *
 * @example
 * ```tsx
 * <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
 *   <YourApp />
 * </SessionProvider>
 * ```
 */
export function SessionProvider({
  children,
  refetchInterval,
  refetchOnWindowFocus,
  session,
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
