'use client'

import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      // Force sign-out — redirect to login page
      signOut({ callbackUrl: '/signin?error=session_expired' })
    }
  }, [session?.error])

  return <>{children}</>
}
