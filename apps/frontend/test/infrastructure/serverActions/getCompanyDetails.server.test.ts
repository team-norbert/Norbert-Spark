import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CompanyDetailsResponse } from '@/infrastructure/serverActions/getCompanyDetails.server.js'

describe('getCompanyDetailsAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLogger: {
    warn: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
  }

  const TEST_TOKEN = 'test-jwt-token'

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    // Mock backend request
    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
    }))

    // Mock logger
    mockLogger = {
      warn: vi.fn(),
      error: vi.fn(),
    }
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: () => mockLogger,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should return company and key person details when authentication is successful', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
            legalName: 'Acme Corporation Ltd',
            displayName: 'Acme Corp',
            status: 'active',
            industry: 'Technology',
            companySize: 150,
            websiteUrl: 'https://www.acme.com',
            billingCountry: 'United States',
            timezone: 'America/New_York',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z',
          },
          keyPerson: {
            keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acme.com',
            phone: '+1-555-123-4567',
            jobTitle: 'CEO',
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z',
          },
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.company).toBeDefined()
      expect(result.data.keyPerson).toBeDefined()
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/company/details',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should handle company details with nullable fields', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
            legalName: 'Minimal Company Ltd',
            displayName: 'MinCo',
            status: 'prospect',
            industry: null,
            companySize: null,
            websiteUrl: null,
            billingCountry: null,
            timezone: 'UTC',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          keyPerson: {
            keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
            firstName: 'Jane',
            lastName: 'Smith',
            email: null,
            phone: null,
            jobTitle: null,
            isActive: false,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual(mockResponse)
      expect(result.data.company?.industry).toBeNull()
      expect(result.data.company?.companySize).toBeNull()
      expect(result.data.company?.websiteUrl).toBeNull()
      expect(result.data.company?.billingCountry).toBeNull()
      expect(result.data.keyPerson?.email).toBeNull()
      expect(result.data.keyPerson?.phone).toBeNull()
      expect(result.data.keyPerson?.jobTitle).toBeNull()
      expect(result.data.keyPerson?.isActive).toBe(false)
    })

    it('should handle different company status values', async () => {
      const statuses: Array<'prospect' | 'active' | 'paused' | 'churned'> = [
        'prospect',
        'active',
        'paused',
        'churned',
      ]

      for (const status of statuses) {
        vi.resetModules()

        mockGetAuthToken = vi.fn()
        vi.doMock('@/lib/auth.js', () => ({
          getAuthToken: mockGetAuthToken,
        }))

        mockBackendRequest = vi.fn()
        vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
          backendRequest: mockBackendRequest,
        }))

        mockLogger = {
          warn: vi.fn(),
          error: vi.fn(),
        }
        vi.doMock('@/infrastructure/logging/logger.js', () => ({
          createLogger: () => mockLogger,
        }))

        const mockResponse: CompanyDetailsResponse = {
          success: true,
          data: {
            company: {
              companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
              legalName: 'Test Company',
              displayName: 'TestCo',
              status,
              industry: null,
              companySize: null,
              websiteUrl: null,
              billingCountry: null,
              timezone: 'UTC',
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-15T10:30:00Z',
            },
            keyPerson: {
              keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
              firstName: 'Test',
              lastName: 'User',
              email: null,
              phone: null,
              jobTitle: null,
              isActive: true,
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-15T10:30:00Z',
            },
          },
        }

        mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
        mockBackendRequest.mockResolvedValue(mockResponse)

        const { getCompanyDetailsAction } =
          await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

        const result = await getCompanyDetailsAction()

        expect(result.data.company?.status).toBe(status)
      }
    })

    it('should handle all required company fields', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
            legalName: 'Complete Corp',
            displayName: 'Complete',
            status: 'active',
            industry: 'Manufacturing',
            companySize: 500,
            websiteUrl: 'https://complete.example.com',
            billingCountry: 'Canada',
            timezone: 'America/Toronto',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z',
          },
          keyPerson: {
            keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@complete.example.com',
            phone: '+1-555-987-6543',
            jobTitle: 'CFO',
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z',
          },
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.data.company).toHaveProperty('companyId')
      expect(result.data.company).toHaveProperty('legalName')
      expect(result.data.company).toHaveProperty('displayName')
      expect(result.data.company).toHaveProperty('status')
      expect(result.data.company).toHaveProperty('industry')
      expect(result.data.company).toHaveProperty('companySize')
      expect(result.data.company).toHaveProperty('websiteUrl')
      expect(result.data.company).toHaveProperty('billingCountry')
      expect(result.data.company).toHaveProperty('timezone')
      expect(result.data.company).toHaveProperty('createdAt')
      expect(result.data.company).toHaveProperty('updatedAt')

      expect(result.data.keyPerson).toHaveProperty('keyPersonId')
      expect(result.data.keyPerson).toHaveProperty('firstName')
      expect(result.data.keyPerson).toHaveProperty('lastName')
      expect(result.data.keyPerson).toHaveProperty('email')
      expect(result.data.keyPerson).toHaveProperty('phone')
      expect(result.data.keyPerson).toHaveProperty('jobTitle')
      expect(result.data.keyPerson).toHaveProperty('isActive')
      expect(result.data.keyPerson).toHaveProperty('createdAt')
      expect(result.data.keyPerson).toHaveProperty('updatedAt')
    })

    it('should use correct timeout value (10 seconds)', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
            legalName: 'Test',
            displayName: 'Test',
            status: 'active',
            industry: null,
            companySize: null,
            websiteUrl: null,
            billingCountry: null,
            timezone: 'UTC',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          keyPerson: {
            keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
            firstName: 'Test',
            lastName: 'User',
            email: null,
            phone: null,
            jobTitle: null,
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      await getCompanyDetailsAction()

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })
  })

  describe('authentication errors', () => {
    it('should return empty response when no authentication token is available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No auth token available in getCompanyDetailsAction',
        { event: 'server-action.company-details.failed' }
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when authentication token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No auth token available in getCompanyDetailsAction',
        { event: 'server-action.company-details.failed' }
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when authentication token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No auth token available in getCompanyDetailsAction',
        { event: 'server-action.company-details.failed' }
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request errors', () => {
    it('should return empty response and log error when backendRequest throws', async () => {
      const testError = new Error('Network error')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(testError)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result).toEqual({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })
      expect(mockLogger.error).toHaveBeenCalledWith('getCompanyDetailsAction error', testError, {
        event: 'server-action.company-details.failed',
      })
    })

    it('should handle 404 not found errors gracefully', async () => {
      const error = new Error('Not found') as Error & { status?: number }
      error.status = 404

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle 401 unauthorized errors gracefully', async () => {
      const error = new Error('Unauthorized') as Error & { status?: number }
      error.status = 401

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
    })

    it('should handle 403 forbidden errors gracefully', async () => {
      const error = new Error('Forbidden') as Error & { status?: number }
      error.status = 403

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
    })

    it('should handle 500 server errors gracefully', async () => {
      const error = new Error('Internal server error') as Error & { status?: number }
      error.status = 500

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle timeout errors gracefully', async () => {
      const error = new Error('Request timeout')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
    })

    it('should handle errors with body property', async () => {
      const error = new Error('API Error') as Error & {
        status?: number
        body?: unknown
      }
      error.status = 400
      error.body = { message: 'Bad request', details: 'Invalid parameters' }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('getCompanyDetailsAction error', error, {
        event: 'server-action.company-details.failed',
      })
    })

    it('should handle errors with cause property', async () => {
      const causeError = new Error('Original cause')
      const error = new Error('Wrapper error') as Error & { cause?: unknown }
      error.cause = causeError

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(error)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('getCompanyDetailsAction error', error, {
        event: 'server-action.company-details.failed',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle response with null company but present keyPerson', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: null,
          keyPerson: {
            keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: null,
            jobTitle: null,
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(true)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeDefined()
    })

    it('should handle response with present company but null keyPerson', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
            legalName: 'Test Corp',
            displayName: 'Test',
            status: 'active',
            industry: null,
            companySize: null,
            websiteUrl: null,
            billingCountry: null,
            timezone: 'UTC',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          keyPerson: null,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(true)
      expect(result.data.company).toBeDefined()
      expect(result.data.keyPerson).toBeNull()
    })

    it('should handle response with both company and keyPerson as null', async () => {
      const mockResponse: CompanyDetailsResponse = {
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/getCompanyDetails.server.js')

      const result = await getCompanyDetailsAction()

      expect(result.success).toBe(false)
      expect(result.data.company).toBeNull()
      expect(result.data.keyPerson).toBeNull()
    })
  })
})
