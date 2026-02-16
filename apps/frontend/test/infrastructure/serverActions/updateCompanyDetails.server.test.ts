import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UpdateCompanyDetailsRequest } from '@/infrastructure/serverActions/updateCompanyDetails.server.js'

describe('updateCompanyDetailsAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLogger: {
    warn: ReturnType<typeof vi.fn>
    info: ReturnType<typeof vi.fn>
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
      info: vi.fn(),
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
    it('should update company details when authentication is successful', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Updated Company Ltd',
          displayName: 'Updated Corp',
          status: 'active',
          industry: 'Technology',
          companySize: 200,
          websiteUrl: 'https://updated.com',
          billingCountry: 'US',
          timezone: 'America/New_York',
        },
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@updated.com',
          phone: '+1-555-987-6543',
          jobTitle: 'CTO',
          isActive: true,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result).toEqual({ success: true, status: 204 })
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: '/company/details',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: mockRequest,
        timeoutMs: 10000,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Company details updated successfully')
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should update only company details when keyPerson is omitted', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Company Only Update',
          displayName: 'Company Update',
          status: 'active',
          timezone: 'UTC',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
      expect(result.status).toBe(204)
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: '/company/details',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: mockRequest,
        timeoutMs: 10000,
      })
    })

    it('should update only key person details when company is omitted', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'John',
          lastName: 'Updated',
          email: 'john.updated@test.com',
          isActive: false,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
      expect(result.status).toBe(204)
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: '/company/details',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: mockRequest,
        timeoutMs: 10000,
      })
    })

    it('should handle nullable fields set to null', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Minimal Company',
          displayName: 'MinCo',
          status: 'prospect',
          industry: null,
          companySize: null,
          websiteUrl: null,
          billingCountry: null,
          timezone: 'UTC',
        },
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'Test',
          lastName: 'User',
          email: null,
          phone: null,
          jobTitle: null,
          isActive: true,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        endpoint: '/company/details',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: mockRequest,
        timeoutMs: 10000,
      })
    })

    it('should handle partial company updates with optional fields omitted', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'paused',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          endpoint: '/company/details',
          body: mockRequest,
        })
      )
    })

    it('should use 10 second timeout for requests', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Test Company',
          displayName: 'Test',
          status: 'active',
          timezone: 'UTC',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      await updateCompanyDetailsAction(mockRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })
  })

  describe('authentication failures', () => {
    it('should return error response when no auth token is available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Test Company',
          displayName: 'Test',
          status: 'active',
          timezone: 'UTC',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result).toEqual({
        status: 401,
        success: false,
        error: 'Authentication required',
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No auth token available in updateCompanyDetailsAction'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error response when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const mockRequest: UpdateCompanyDetailsRequest = {
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'Test',
          lastName: 'User',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(false)
      expect(result.status).toBe(401)
      expect(result.error).toBe('Authentication required')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error response when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'active',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle backend request errors', async () => {
      const mockError = new Error('Network error')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Test Company',
          displayName: 'Test',
          status: 'active',
          timezone: 'UTC',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.error).toBe('Network error')
      expect(mockLogger.error).toHaveBeenCalledWith('updateCompanyDetailsAction error', mockError)
    })

    it('should handle errors with status codes', async () => {
      const mockError = Object.assign(new Error('Bad request'), { status: 400 })

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'Test',
          lastName: 'User',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error).toBe('Bad request')
    })

    it('should use default status 500 when error has no status', async () => {
      const mockError = new Error('Unknown error')

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'churned',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.status).toBe(500)
      expect(result.success).toBe(false)
    })

    it('should use default error message when error has no message', async () => {
      const mockError = Object.assign(new Error(), { status: 500 })

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Test',
          displayName: 'Test',
          status: 'active',
          timezone: 'UTC',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.error).toBe('Failed to update company details')
    })

    it('should handle 401 unauthorized errors', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), { status: 401 })

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'active',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle 404 not found errors', async () => {
      const mockError = Object.assign(new Error('Company not found'), { status: 404 })

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: 'non-existent-id',
          status: 'active',
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.status).toBe(404)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Company not found')
    })

    it('should handle 422 validation errors', async () => {
      const mockError = Object.assign(new Error('Invalid company size'), { status: 422 })

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          companySize: -5,
        },
      }

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.status).toBe(422)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid company size')
    })
  })

  describe('request format validation', () => {
    it('should send correct headers including Authorization and Content-Type', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'active',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      await updateCompanyDetailsAction(mockRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should use PUT method', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          isActive: false,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      await updateCompanyDetailsAction(mockRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should send request body with company and keyPerson data', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Full Update Company',
          displayName: 'Full Update',
          status: 'active',
          industry: 'Finance',
          companySize: 500,
          websiteUrl: 'https://full.com',
          billingCountry: 'GB',
          timezone: 'Europe/London',
        },
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@full.com',
          phone: '+44-20-1234-5678',
          jobTitle: 'CFO',
          isActive: true,
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      await updateCompanyDetailsAction(mockRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: mockRequest,
        })
      )
    })

    it('should call correct endpoint', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'active',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      await updateCompanyDetailsAction(mockRequest)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/company/details',
        })
      )
    })
  })

  describe('company status enum values', () => {
    it('should handle prospect status', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'prospect',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
    })

    it('should handle active status', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'active',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
    })

    it('should handle paused status', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'paused',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
    })

    it('should handle churned status', async () => {
      const mockRequest: UpdateCompanyDetailsRequest = {
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          status: 'churned',
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(undefined)

      const { updateCompanyDetailsAction } =
        await import('@/infrastructure/serverActions/updateCompanyDetails.server.js')

      const result = await updateCompanyDetailsAction(mockRequest)

      expect(result.success).toBe(true)
    })
  })
})
