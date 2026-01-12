import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth.js'

import { ExtractDataPageClient } from './ExtractDataPageClient.js'

/**
 * Extract Data page with role-based access control.
 * Only users with 'user', 'admin' or 'moderator' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function ExtractDataPage() {
  // Check if user has any of the required roles ('user', 'admin' or 'moderator')
  const hasAccess = await hasAnyRole(['user', 'admin', 'moderator'])

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    redirect('/signin?callbackUrl=/extract-data&error=unauthorized')
  }

  // Render the client component for authenticated users with proper roles
  return <ExtractDataPageClient />
}
