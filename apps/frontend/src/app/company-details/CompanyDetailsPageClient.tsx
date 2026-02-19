'use client'

import { useRouter } from 'next/navigation.js'

import { CompanyDetails } from '@/view/client-components/CompanyDetails.js'
import { useCompanyDetails } from '@/view/hooks/useCompanyDetails.js'

/**
 * Company Details page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function CompanyDetailsPageClient() {
  const router = useRouter()
  const { company, error, isLoading, keyPerson } = useCompanyDetails()

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  return (
    <CompanyDetails
      company={company}
      keyPerson={keyPerson}
      isLoading={isLoading}
      error={error}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
    />
  )
}
