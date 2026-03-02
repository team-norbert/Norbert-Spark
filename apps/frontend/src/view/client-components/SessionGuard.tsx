'use client'

import { useSessionGuard } from '@/view/hooks/useSessionGuard.js'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  useSessionGuard()

  return <>{children}</>
}
