'use server'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

const logger = createLogger({ prefix: '[updateCompanyDetails:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

export type UpdateCompanyDetailsRequest = {
  company?: {
    companyId: string
    legalName?: string
    displayName?: string
    status?: 'prospect' | 'active' | 'paused' | 'churned'
    industry?: string | null
    companySize?: number | null
    websiteUrl?: string | null
    billingCountry?: string | null
    timezone?: string
  }
  keyPerson?: {
    keyPersonId: string
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    jobTitle?: string | null
    isActive?: boolean
  }
}

export type UpdateCompanyDetailsResponse = {
  status: number
  success: boolean
  error?: string
}

/**
 * Server Action to update company and key person details
 * Calls backend PUT /company/details endpoint server-side (single network hop)
 *
 * @param data - Company and/or key person data to update
 * @returns Response with success flag and optional error message
 */
export async function updateCompanyDetailsAction(
  data: UpdateCompanyDetailsRequest
): Promise<UpdateCompanyDetailsResponse> {
  try {
    const token = await getAuthToken()
    if (!token) {
      logger.warn('No auth token available in updateCompanyDetailsAction', {
        event: 'server-action.company-details.update-failed',
      })
      return {
        status: 401,
        success: false,
        error: 'Authentication required',
      }
    }

    await backendRequest<void>({
      method: 'PUT',
      endpoint: '/company/details',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data,
      timeoutMs: 10000,
    })

    logger.info('Company details updated successfully', {
      event: 'server-action.company-details.updated',
    })
    return { success: true, status: 204 }
  } catch (error) {
    const err = error as BackendError
    logger.error('updateCompanyDetailsAction error', err, {
      event: 'server-action.company-details.update-failed',
    })

    return {
      status: err.status || 500,
      success: false,
      error: err.message || 'Failed to update company details',
    }
  }
}
