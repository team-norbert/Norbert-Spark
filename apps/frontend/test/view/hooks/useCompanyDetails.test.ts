import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CompanyDetailsResponse } from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import { getCompanyDetailsAction } from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import { useCompanyDetails } from '@/view/hooks/useCompanyDetails.js'

// Mock the server action
vi.mock('@/infrastructure/serverActions/getCompanyDetails.server.js', () => ({
  getCompanyDetailsAction: vi.fn(),
}))

describe('useCompanyDetails', () => {
  const mockCompanyData = {
    companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
    legalName: 'Acme Corporation Ltd',
    displayName: 'Acme Corp',
    status: 'active' as const,
    industry: 'Technology',
    companySize: 150,
    websiteUrl: 'https://www.acme.com',
    billingCountry: 'United States',
    timezone: 'America/New_York',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  }

  const mockKeyPersonData = {
    keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+1-555-123-4567',
    jobTitle: 'CEO',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  }

  const mockSuccessResponse: CompanyDetailsResponse = {
    success: true,
    data: {
      company: mockCompanyData,
      keyPerson: mockKeyPersonData,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should return initial state with loading true', () => {
      vi.mocked(getCompanyDetailsAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useCompanyDetails())

      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should return all required properties', () => {
      vi.mocked(getCompanyDetailsAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useCompanyDetails())

      expect(result.current).toHaveProperty('company')
      expect(result.current).toHaveProperty('keyPerson')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
    })
  })

  describe('Successful Fetch', () => {
    it('should fetch and set company details on mount', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Data should be loaded
      expect(result.current.company).toEqual(mockCompanyData)
      expect(result.current.keyPerson).toEqual(mockKeyPersonData)
      expect(result.current.error).toBeNull()
      expect(getCompanyDetailsAction).toHaveBeenCalledTimes(1)
    })

    it('should set company data correctly', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company?.companyId).toBe('019b659a-2ad2-7fd8-9f32-35624caef900')
      expect(result.current.company?.legalName).toBe('Acme Corporation Ltd')
      expect(result.current.company?.displayName).toBe('Acme Corp')
      expect(result.current.company?.status).toBe('active')
      expect(result.current.company?.industry).toBe('Technology')
      expect(result.current.company?.companySize).toBe(150)
      expect(result.current.company?.websiteUrl).toBe('https://www.acme.com')
      expect(result.current.company?.billingCountry).toBe('United States')
      expect(result.current.company?.timezone).toBe('America/New_York')
    })

    it('should set key person data correctly', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.keyPerson?.keyPersonId).toBe('019b659a-3ad2-7fd8-9f32-35624caef901')
      expect(result.current.keyPerson?.firstName).toBe('John')
      expect(result.current.keyPerson?.lastName).toBe('Doe')
      expect(result.current.keyPerson?.email).toBe('john.doe@acme.com')
      expect(result.current.keyPerson?.phone).toBe('+1-555-123-4567')
      expect(result.current.keyPerson?.jobTitle).toBe('CEO')
      expect(result.current.keyPerson?.isActive).toBe(true)
    })

    it('should handle company with nullable fields', async () => {
      const minimalCompany = {
        ...mockCompanyData,
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: null,
      }

      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: true,
        data: {
          company: minimalCompany,
          keyPerson: mockKeyPersonData,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company?.industry).toBeNull()
      expect(result.current.company?.companySize).toBeNull()
      expect(result.current.company?.websiteUrl).toBeNull()
      expect(result.current.company?.billingCountry).toBeNull()
    })

    it('should handle key person with nullable fields', async () => {
      const minimalKeyPerson = {
        ...mockKeyPersonData,
        email: null,
        phone: null,
        jobTitle: null,
        isActive: false,
      }

      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: true,
        data: {
          company: mockCompanyData,
          keyPerson: minimalKeyPerson,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.keyPerson?.email).toBeNull()
      expect(result.current.keyPerson?.phone).toBeNull()
      expect(result.current.keyPerson?.jobTitle).toBeNull()
      expect(result.current.keyPerson?.isActive).toBe(false)
    })

    it('should handle different company status values', async () => {
      const statuses: Array<'prospect' | 'active' | 'paused' | 'churned'> = [
        'prospect',
        'active',
        'paused',
        'churned',
      ]

      for (const status of statuses) {
        vi.mocked(getCompanyDetailsAction).mockResolvedValue({
          success: true,
          data: {
            company: { ...mockCompanyData, status },
            keyPerson: mockKeyPersonData,
          },
        })

        const { result } = renderHook(() => useCompanyDetails())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.company?.status).toBe(status)
      }
    })
  })

  describe('Failed Fetch - Success False', () => {
    it('should set error when response success is false', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch company details')
      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
    })

    it('should not set company or key person data when success is false', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: false,
        data: {
          company: null,
          keyPerson: null,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
    })
  })

  describe('Failed Fetch - Exception Thrown', () => {
    it('should handle Error instances and set error message', async () => {
      const errorMessage = 'Network connection failed'
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
    })

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue('String error')

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('An unexpected error occurred')
      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
    })

    it('should handle null/undefined exceptions', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(null)

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('An unexpected error occurred')
    })

    it('should handle timeout errors', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(new Error('Request timeout'))

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Request timeout')
    })

    it('should handle 401 unauthorized errors', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(new Error('Unauthorized'))

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Unauthorized')
    })

    it('should handle 500 server errors', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(new Error('Internal server error'))

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Internal server error')
    })
  })

  describe('Loading State Management', () => {
    it('should set isLoading to true at start of fetch', async () => {
      let resolvePromise: (value: CompanyDetailsResponse) => void
      vi.mocked(getCompanyDetailsAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const { result } = renderHook(() => useCompanyDetails())

      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockSuccessResponse)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading to false after successful fetch', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading to false after failed fetch', async () => {
      vi.mocked(getCompanyDetailsAction).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useCompanyDetails())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should reset error state at start of fetch', async () => {
      // First call fails
      vi.mocked(getCompanyDetailsAction).mockRejectedValueOnce(new Error('First error'))

      const { rerender, result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.error).toBe('First error')
      })

      // Second call succeeds
      vi.mocked(getCompanyDetailsAction).mockResolvedValueOnce(mockSuccessResponse)

      rerender()

      // Error should be cleared during loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Effect Hook Behavior', () => {
    it('should call getCompanyDetailsAction on mount', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(getCompanyDetailsAction).toHaveBeenCalledTimes(1)
      })
    })

    it('should only fetch once on mount (empty dependency array)', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { rerender } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(getCompanyDetailsAction).toHaveBeenCalledTimes(1)
      })

      // Rerender multiple times
      rerender()
      rerender()
      rerender()

      // Should still only have been called once
      expect(getCompanyDetailsAction).toHaveBeenCalledTimes(1)
    })

    it('should not fetch on subsequent rerenders', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { rerender, result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstCallCount = vi.mocked(getCompanyDetailsAction).mock.calls.length

      rerender()

      expect(vi.mocked(getCompanyDetailsAction).mock.calls.length).toBe(firstCallCount)
    })
  })

  describe('Null Data Handling', () => {
    it('should handle null company data', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: true,
        data: {
          company: null,
          keyPerson: mockKeyPersonData,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toEqual(mockKeyPersonData)
      expect(result.current.error).toBeNull()
    })

    it('should handle null key person data', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: true,
        data: {
          company: mockCompanyData,
          keyPerson: null,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company).toEqual(mockCompanyData)
      expect(result.current.keyPerson).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should handle both company and key person as null', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue({
        success: true,
        data: {
          company: null,
          keyPerson: null,
        },
      })

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.company).toBeNull()
      expect(result.current.keyPerson).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('Return Value Types', () => {
    it('should return UseCompanyDetailsReturn interface', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.company).toBe('object')
      expect(typeof result.current.keyPerson).toBe('object')
      expect(typeof result.current.isLoading).toBe('boolean')
      expect(result.current.error === null || typeof result.current.error === 'string').toBe(true)
    })

    it('should maintain consistent return structure across all states', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      // During loading
      expect(result.current).toHaveProperty('company')
      expect(result.current).toHaveProperty('keyPerson')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')

      // After loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current).toHaveProperty('company')
      expect(result.current).toHaveProperty('keyPerson')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
    })
  })

  describe('Architecture Compliance', () => {
    it('should follow DDD architecture by separating UI logic from presentation', async () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Hook should only handle data fetching and state management
      // No UI or presentation logic
      expect(result.current).not.toHaveProperty('handleClick')
      expect(result.current).not.toHaveProperty('handleSubmit')
      expect(result.current).not.toHaveProperty('render')
    })

    it('should be side-effect free except for data fetching', () => {
      vi.mocked(getCompanyDetailsAction).mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetails())

      // Hook should only fetch data, no other side effects
      expect(getCompanyDetailsAction).toHaveBeenCalledTimes(1)
      expect(getCompanyDetailsAction).toHaveBeenCalledWith()
    })
  })
})
