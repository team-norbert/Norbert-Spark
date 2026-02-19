'use client'

import { useRouter } from 'next/navigation.js'

import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

interface AIOptionsFormClientProps {
  chatTypeId: string
}

/**
 * Client component wrapper for the AI Options Form page.
 * Connects the presentational component with navigation callbacks
 * derived from the Next.js router.
 */
export function AIOptionsFormClient({ chatTypeId }: AIOptionsFormClientProps) {
  const router = useRouter()

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  return (
    <AIOptionsForm
      chatTypeId={chatTypeId}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
    />
  )
}
