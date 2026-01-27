'use client'

import { CompanyDetails } from '@/view/client-components/CompanyDetails.js'
import { useCompanyDetails } from '@/view/hooks/useCompanyDetails.js'

/**
 * Company Details page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function CompanyDetailsPageClient() {
  const { company, error, isLoading, keyPerson } = useCompanyDetails()

  return (
    <CompanyDetails company={company} keyPerson={keyPerson} isLoading={isLoading} error={error} />
  )
}
