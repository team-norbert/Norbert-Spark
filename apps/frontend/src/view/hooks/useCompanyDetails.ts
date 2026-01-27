'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  CompanyDetails as CompanyDetailsType,
  KeyPersonDetails,
} from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import { getCompanyDetailsAction } from '@/infrastructure/serverActions/getCompanyDetails.server.js'

const ONE_MINUTE_MS = 60_000

interface UseCompanyDetailsReturn {
  company: CompanyDetailsType | null
  keyPerson: KeyPersonDetails | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for fetching company details data using React Query.
 *
 * Uses React Query to fetch company and key person details from the server
 * with automatic caching, retries, and loading/error state management.
 * Follows DDD architecture by keeping UI logic separate from presentation.
 *
 * @returns Object containing company data, key person data, loading state, and error message
 */
export function useCompanyDetails(): UseCompanyDetailsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['company-details'],
    queryFn: async () => {
      const response = await getCompanyDetailsAction()

      if (!response.success) {
        throw new Error('Failed to fetch company details')
      }

      return response.data
    },
    staleTime: ONE_MINUTE_MS, // 1 minute
  })

  return {
    company: data?.company ?? null,
    keyPerson: data?.keyPerson ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'An unexpected error occurred') : null,
  }
}
