import { useEffect, useState } from 'react'

import type {
  CompanyDetails as CompanyDetailsType,
  KeyPersonDetails,
} from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import { getCompanyDetailsAction } from '@/infrastructure/serverActions/getCompanyDetails.server.js'

interface UseCompanyDetailsReturn {
  company: CompanyDetailsType | null
  keyPerson: KeyPersonDetails | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for fetching company details data.
 * Handles loading states, error handling, and data fetching.
 * Follows DDD architecture by keeping UI logic separate from presentation.
 */
export function useCompanyDetails(): UseCompanyDetailsReturn {
  const [company, setCompany] = useState<CompanyDetailsType | null>(null)
  const [keyPerson, setKeyPerson] = useState<KeyPersonDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanyDetails() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getCompanyDetailsAction()

        if (!response.success) {
          setError('Failed to fetch company details')
          return
        }

        setCompany(response.data.company)
        setKeyPerson(response.data.keyPerson)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCompanyDetails()
  }, [])

  return {
    company,
    keyPerson,
    isLoading,
    error,
  }
}
