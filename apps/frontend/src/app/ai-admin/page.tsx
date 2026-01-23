import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth.js'

import { AIAdminPageClient } from './AIAdminPageClient.js'

/**
 * AI Admin page with role-based access control.
 * Only users with 'admin' or 'ai-admin' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function AIAdminPage() {
  // Check if user has any of the required roles ('admin' or 'ai-admin')
  const hasAccess = await hasAnyRole(['admin', 'ai-admin'])

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    const searchParams = new URLSearchParams({
      callbackUrl: `/ai-admin`,
      error: 'unauthorized',
    })
    redirect(`/signin?${searchParams.toString()}`)
  }

  return <AIAdminPageClient />
}
