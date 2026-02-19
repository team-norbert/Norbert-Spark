import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth/auth.js'

import { CreateChatTypePageClient } from './CreateChatTypePageClient.js'

/**
 * Create Chat Type page with role-based access control.
 * Only users with 'admin' or 'ai-admin' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function CreateChatTypePage() {
  const hasAccess = await hasAnyRole(['admin', 'ai-admin'])

  if (!hasAccess) {
    const searchParams = new URLSearchParams({
      callbackUrl: '/chat-types/create',
      error: 'unauthorized',
    })
    redirect(`/signin?${searchParams.toString()}`)
  }

  return <CreateChatTypePageClient />
}
