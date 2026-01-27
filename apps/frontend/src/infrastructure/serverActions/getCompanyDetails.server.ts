'use server'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth.js'

const logger = createLogger({ prefix: '[getCompanyDetails:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

export type CompanyDetails = {
  companyId: string
  legalName: string
  displayName: string
  status: 'prospect' | 'active' | 'paused' | 'churned'
  industry: string | null
  companySize: number | null
  websiteUrl: string | null
  billingCountry: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export type KeyPersonDetails = {
  keyPersonId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CompanyDetailsResponse = {
  success: boolean
  data: {
    company: CompanyDetails | null
    keyPerson: KeyPersonDetails | null
  }
}

/**
 * Server Action to fetch company and key person details
 * Calls backend /company/details endpoint server-side (single network hop)
 *
 * @returns Response with success flag and company/key person data
 */
export async function getCompanyDetailsAction(): Promise<CompanyDetailsResponse> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in getCompanyDetailsAction')
      return {
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      }
    }

    const response = await backendRequest<CompanyDetailsResponse>({
      method: 'GET',
      endpoint: '/company/details',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: 10000,
    })

    return response
  } catch (error) {
    const err = error as BackendError
    logger.error('getCompanyDetailsAction error', err)

    // Return empty response on error to prevent UI breaking
    return {
      success: false,
      data: {
        company: null,
        keyPerson: null,
      },
    }
  }
}
