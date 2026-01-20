import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth.js'

import { AIAdminPageClient } from './AIAdminPageClient.js'

/**
 * AI Admin page with role-based access control.
 * Only users with 'admin' or 'moderator' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function AIAdminPage() {
  // Check if user has required role (admin or moderator)
  const hasAccess = await hasAnyRole(['admin', 'moderator'])

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    redirect('/signin?callbackUrl=/ai-admin&error=unauthorized')
  }

  // Render the client component for authenticated users with proper roles
  return <AIAdminPageClient />
}
