import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CompanyDetailsResponse } from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import type { UpdateCompanyDetailsResponse } from '@/infrastructure/serverActions/updateCompanyDetails.server.js'
import { useCompanyDetailsForm } from '@/view/hooks/useCompanyDetailsForm.js'

// Mock next/navigation
const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}

vi.mock('next/navigation.js', () => ({
  useRouter: () => mockRouter,
}))

// Mock server actions
const mockGetCompanyDetailsAction = vi.fn()
const mockUpdateCompanyDetailsAction = vi.fn()

vi.mock('@/infrastructure/serverActions/getCompanyDetails.server.js', () => ({
  getCompanyDetailsAction: (...args: unknown[]) => mockGetCompanyDetailsAction(...args),
}))

vi.mock('@/infrastructure/serverActions/updateCompanyDetails.server.js', () => ({
  updateCompanyDetailsAction: (...args: unknown[]) => mockUpdateCompanyDetailsAction(...args),
}))

// Mock window.scrollTo
const mockScrollTo = vi.fn()
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: mockScrollTo,
})

describe('useCompanyDetailsForm', () => {
  const mockCompanyData = {
    companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
    legalName: 'Acme Corporation Ltd',
    displayName: 'Acme Corp',
    status: 'active' as const,
    industry: 'Technology',
    companySize: 150,
    websiteUrl: 'https://www.acme.com',
    billingCountry: 'US',
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
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Initial State and Data Loading', () => {
    it('should return initial state with loading true', () => {
      mockGetCompanyDetailsAction.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCompanyDetailsForm())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.generalError).toBe('')
      expect(result.current.successMessage).toBe('')
    })

    it('should fetch company details on mount', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockGetCompanyDetailsAction).toHaveBeenCalledTimes(1)
    })

    it('should populate form data with fetched company details', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.formData.companyId).toBe('019b659a-2ad2-7fd8-9f32-35624caef900')
      expect(result.current.formData.legalName).toBe('Acme Corporation Ltd')
      expect(result.current.formData.displayName).toBe('Acme Corp')
      expect(result.current.formData.status).toBe('active')
      expect(result.current.formData.industry).toBe('Technology')
      expect(result.current.formData.companySize).toBe('150')
      expect(result.current.formData.websiteUrl).toBe('https://www.acme.com')
      expect(result.current.formData.billingCountry).toBe('US')
      expect(result.current.formData.timezone).toBe('America/New_York')
    })

    it('should populate key person data from fetched details', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.formData.keyPersonId).toBe('019b659a-3ad2-7fd8-9f32-35624caef901')
      expect(result.current.formData.firstName).toBe('John')
      expect(result.current.formData.lastName).toBe('Doe')
      expect(result.current.formData.email).toBe('john.doe@acme.com')
      expect(result.current.formData.phone).toBe('+1-555-123-4567')
      expect(result.current.formData.jobTitle).toBe('CEO')
      expect(result.current.formData.isActive).toBe(true)
    })

    it('should handle nullable fields as empty strings', async () => {
      const responseWithNulls: CompanyDetailsResponse = {
        success: true,
        data: {
          company: {
            ...mockCompanyData,
            industry: null,
            companySize: null,
            websiteUrl: null,
            billingCountry: null,
          },
          keyPerson: {
            ...mockKeyPersonData,
            email: null,
            phone: null,
            jobTitle: null,
          },
        },
      }

      mockGetCompanyDetailsAction.mockResolvedValue(responseWithNulls)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.formData.industry).toBe('')
      expect(result.current.formData.companySize).toBe('')
      expect(result.current.formData.websiteUrl).toBe('')
      expect(result.current.formData.billingCountry).toBe('')
      expect(result.current.formData.email).toBe('')
      expect(result.current.formData.phone).toBe('')
      expect(result.current.formData.jobTitle).toBe('')
    })

    it('should set error when fetch fails with success false', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue({
        success: false,
        data: { company: null, keyPerson: null },
      })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.generalError).toBe('Failed to load company details')
    })

    it('should set error when fetch throws exception', async () => {
      mockGetCompanyDetailsAction.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.generalError).toBe('An error occurred while loading company details')
    })
  })

  describe('handleChange', () => {
    it('should update form field value', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'Updated Company' } })
      })

      expect(result.current.formData.legalName).toBe('Updated Company')
    })

    it('should clear field error when value changes', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Set an error first
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      // Now change a field
      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'New Value' } })
      })

      expect(result.current.errors.legalName).toBe('')
    })

    it('should clear general error when any field changes', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger submit to cause validation error
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      // Change a field
      act(() => {
        result.current.handleChange('displayName')({ target: { value: 'Test' } })
      })

      expect(result.current.generalError).toBe('')
    })

    it('should clear success message when field changes', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Submit successfully
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(() => {
        expect(result.current.successMessage).toBe('Company details updated successfully!')
      })

      // Change a field
      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'New Name' } })
      })

      expect(result.current.successMessage).toBe('')
    })

    it('should clear redirect timeout when field changes', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      vi.useFakeTimers()

      const { result } = renderHook(() => useCompanyDetailsForm())

      await vi.waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 2000 }
      )

      // Submit successfully
      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )

      // Change a field before timeout completes
      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'New Name' } })
      })

      // Advance time past the original timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      // Router push should not be called since timeout was cleared
      expect(mockPush).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('handleCancel', () => {
    it('should navigate to /company-details', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleCancel()
      })

      expect(mockPush).toHaveBeenCalledWith('/company-details')
    })

    it('should clear redirect timeout when cancel is clicked', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      vi.useFakeTimers()

      const { result } = renderHook(() => useCompanyDetailsForm())

      await vi.waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 2000 }
      )

      // Submit successfully
      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )

      // Reset mockPush to track new calls
      mockPush.mockClear()

      // Click cancel before timeout completes
      act(() => {
        result.current.handleCancel()
      })

      // Should have been called once by handleCancel
      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/company-details')

      // Advance time past the original timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      // Router push should still only have been called once (not twice)
      expect(mockPush).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('Form Validation', () => {
    it('should validate legal name minimum length', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'A' } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.legalName).toBe('Legal name must be at least 2 characters')
    })

    it('should validate legal name maximum length', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'A'.repeat(201) } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.legalName).toBe('Legal name must not exceed 200 characters')
    })

    it('should validate website URL format', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('websiteUrl')({ target: { value: 'invalid-url' } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.websiteUrl).toBe('Must be a valid URL')
    })

    it('should validate billing country format', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('billingCountry')({ target: { value: 'USA' } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.billingCountry).toBe(
        'Must be a 2-letter country code (e.g., US)'
      )
    })

    it('should validate email format', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('email')({ target: { value: 'invalid-email' } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Must be a valid email address')
    })

    it('should validate phone maximum length', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('phone')({ target: { value: '1'.repeat(31) } })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.phone).toBe('Phone must not exceed 30 characters')
    })

    it('should pass validation with valid data', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
    })
  })

  describe('handleSubmit - Success', () => {
    it('should call updateCompanyDetailsAction with correct data', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(mockUpdateCompanyDetailsAction).toHaveBeenCalledWith({
        company: {
          companyId: '019b659a-2ad2-7fd8-9f32-35624caef900',
          legalName: 'Acme Corporation Ltd',
          displayName: 'Acme Corp',
          status: 'active',
          industry: 'Technology',
          companySize: 150,
          websiteUrl: 'https://www.acme.com',
          billingCountry: 'US',
          timezone: 'America/New_York',
        },
        keyPerson: {
          keyPersonId: '019b659a-3ad2-7fd8-9f32-35624caef901',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@acme.com',
          phone: '+1-555-123-4567',
          jobTitle: 'CEO',
          isActive: true,
        },
      })
    })

    it('should set success message on successful update', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(() => {
        expect(result.current.successMessage).toBe('Company details updated successfully!')
      })
    })

    it('should scroll to top on successful update', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('should redirect after 2 seconds on successful update', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      vi.useFakeTimers()

      const { result } = renderHook(() => useCompanyDetailsForm())

      await vi.waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 2000 }
      )

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )

      expect(mockPush).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(mockPush).toHaveBeenCalledWith('/company-details')

      vi.useRealTimers()
    })

    it('should clear redirect timeout on unmount', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      vi.useFakeTimers()

      const { result, unmount } = renderHook(() => useCompanyDetailsForm())

      await vi.waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 2000 }
      )

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )

      // Unmount before timeout completes
      unmount()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      // Router push should not be called after unmount
      expect(mockPush).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should clear previous redirect timeout when submitting again', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      vi.useFakeTimers()

      const { result } = renderHook(() => useCompanyDetailsForm())

      await vi.waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 2000 }
      )

      // First submit
      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalledTimes(1)
        },
        { timeout: 2000 }
      )

      // Advance time by 1 second (not enough for redirect)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })

      expect(mockPush).not.toHaveBeenCalled()

      // Second submit before first timeout completes
      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await vi.waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalledTimes(2)
        },
        { timeout: 2000 }
      )

      // Advance time by another 2 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      // Router push should only be called once from the second submit
      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/company-details')

      vi.useRealTimers()
    })

    it('should convert empty strings to null for nullable fields', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('industry')({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleChange('websiteUrl')({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleChange('email')({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )

      // Get the most recent call args
      const callArgs = mockUpdateCompanyDetailsAction.mock.calls.at(-1)?.[0]
      expect(callArgs.company.industry).toBeNull()
      expect(callArgs.company.websiteUrl).toBeNull()
      expect(callArgs.keyPerson.email).toBeNull()
    })

    it('should parse companySize to number', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('companySize')({ target: { value: '500' } })
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(mockUpdateCompanyDetailsAction).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )

      const callArgs = mockUpdateCompanyDetailsAction.mock.calls[0]?.[0]
      expect(callArgs.company.companySize).toBe(500)
      expect(typeof callArgs.company.companySize).toBe('number')
    })
  })

  describe('handleSubmit - Validation Errors', () => {
    it('should not call update action if validation fails', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('legalName')({ target: { value: 'A' } })
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.generalError).toBeTruthy()
        },
        { timeout: 1000 }
      )

      expect(mockUpdateCompanyDetailsAction).not.toHaveBeenCalled()
    })

    it('should set general error message on validation failure', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.handleChange('email')({ target: { value: 'invalid' } })
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.generalError).toBe(
            'Please fix the validation errors before submitting'
          )
        },
        { timeout: 1000 }
      )
    })
  })

  describe('handleSubmit - API Errors', () => {
    it('should handle update failure with error message', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      const errorResponse: UpdateCompanyDetailsResponse = {
        success: false,
        status: 400,
        error: 'Invalid data provided',
      }
      mockUpdateCompanyDetailsAction.mockResolvedValue(errorResponse)

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.generalError).toBe('Invalid data provided')
        },
        { timeout: 1000 }
      )
    })

    it('should handle update failure without error message', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({
        success: false,
        status: 500,
      })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.generalError).toBe('Failed to update company details')
        },
        { timeout: 1000 }
      )
    })

    it('should handle unexpected errors during update', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.generalError).toBe(
            'An unexpected error occurred. Please try again.'
          )
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Submitting State', () => {
    it('should set isSubmitting to true during submission', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, status: 204 }), 100)
          })
      )

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.isSubmitting).toBe(true)
        },
        { timeout: 1000 }
      )
    })

    it('should reset isSubmitting to false after successful submission', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({ success: true, status: 204 })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.isSubmitting).toBe(false)
        },
        { timeout: 1000 }
      )
    })

    it('should reset isSubmitting to false after failed submission', async () => {
      mockGetCompanyDetailsAction.mockResolvedValue(mockSuccessResponse)
      mockUpdateCompanyDetailsAction.mockResolvedValue({
        success: false,
        status: 400,
        error: 'Error',
      })

      const { result } = renderHook(() => useCompanyDetailsForm())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        void result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      await waitFor(
        () => {
          expect(result.current.isSubmitting).toBe(false)
        },
        { timeout: 1000 }
      )
    })
  })
})
