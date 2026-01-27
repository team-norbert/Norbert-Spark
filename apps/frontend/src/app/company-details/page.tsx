import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth.js'

import { CompanyDetailsPageClient } from './CompanyDetailsPageClient.js'

/**
 * Company Details page with role-based access control.
 * Only users with 'user', 'admin' or 'moderator' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function CompanyDetailsPage() {
  // Check if user has any of the required roles ('user', 'admin' or 'moderator')
  const hasAccess = await hasAnyRole(['user', 'admin', 'moderator'])

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    const searchParams = new URLSearchParams({
      callbackUrl: `/company-details`,
      error: 'unauthorized',
    })
    redirect(`/signin?${searchParams.toString()}`)
  }

  // Render the client component for authenticated users with proper roles
  return <CompanyDetailsPageClient />
}
