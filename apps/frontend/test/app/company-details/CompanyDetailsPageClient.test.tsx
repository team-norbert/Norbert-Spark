import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyDetailsPageClient } from '@/app/company-details/CompanyDetailsPageClient.js'
import { CompanyDetails } from '@/view/client-components/CompanyDetails.js'
import { useCompanyDetails } from '@/view/hooks/useCompanyDetails.js'

// Mock the useCompanyDetails hook
vi.mock('@/view/hooks/useCompanyDetails.js', () => ({
  useCompanyDetails: vi.fn(),
}))

// Mock next/navigation to avoid "app router not mounted" error
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

// Mock the CompanyDetails component
vi.mock('@/view/client-components/CompanyDetails.js', () => ({
  CompanyDetails: vi.fn((props) => (
    <div data-testid="company-details" data-props={JSON.stringify(props)} />
  )),
}))

describe('CompanyDetailsPageClient', () => {
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

  const mockHookReturn = {
    company: mockCompanyData,
    keyPerson: mockKeyPersonData,
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCompanyDetails).mockReturnValue(mockHookReturn)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<CompanyDetailsPageClient />)
      expect(container).toBeInTheDocument()
    })

    it('should render CompanyDetails component', () => {
      render(<CompanyDetailsPageClient />)
      expect(CompanyDetails).toHaveBeenCalledTimes(1)
    })

    it('should call useCompanyDetails hook', () => {
      render(<CompanyDetailsPageClient />)
      expect(useCompanyDetails).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props Passing to CompanyDetails', () => {
    it('should pass all values from useCompanyDetails hook to CompanyDetails component', () => {
      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      expect(call?.[0]).toEqual({
        company: mockHookReturn.company,
        keyPerson: mockHookReturn.keyPerson,
        isLoading: mockHookReturn.isLoading,
        error: mockHookReturn.error,
        onNavigateHome: expect.any(Function),
        onSignOut: expect.any(Function),
      })
    })

    it('should pass company data correctly', () => {
      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.company).toBe(mockHookReturn.company)
      expect(props?.company?.companyId).toBe('019b659a-2ad2-7fd8-9f32-35624caef900')
      expect(props?.company?.legalName).toBe('Acme Corporation Ltd')
      expect(props?.company?.displayName).toBe('Acme Corp')
      expect(props?.company?.status).toBe('active')
    })

    it('should pass keyPerson data correctly', () => {
      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.keyPerson).toBe(mockHookReturn.keyPerson)
      expect(props?.keyPerson?.keyPersonId).toBe('019b659a-3ad2-7fd8-9f32-35624caef901')
      expect(props?.keyPerson?.firstName).toBe('John')
      expect(props?.keyPerson?.lastName).toBe('Doe')
      expect(props?.keyPerson?.email).toBe('john.doe@acme.com')
    })

    it('should pass isLoading state correctly', () => {
      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.isLoading).toBe(false)
    })

    it('should pass error state correctly', () => {
      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.error).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should pass isLoading=true when data is loading', () => {
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: null,
        isLoading: true,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.isLoading).toBe(true)
      expect(props?.company).toBeNull()
      expect(props?.keyPerson).toBeNull()
    })
  })

  describe('Error State', () => {
    it('should pass error message when error occurs', () => {
      const errorMessage = 'Failed to fetch company details'
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: null,
        isLoading: false,
        error: errorMessage,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.error).toBe(errorMessage)
      expect(props?.isLoading).toBe(false)
      expect(props?.company).toBeNull()
      expect(props?.keyPerson).toBeNull()
    })

    it('should handle different error messages', () => {
      const errorMessages = ['Network error', 'Unauthorized access', 'Server error', 'Timeout']

      errorMessages.forEach((errorMessage) => {
        vi.clearAllMocks()
        vi.mocked(useCompanyDetails).mockReturnValue({
          company: null,
          keyPerson: null,
          isLoading: false,
          error: errorMessage,
        })

        render(<CompanyDetailsPageClient />)

        const call = vi.mocked(CompanyDetails).mock.calls[0]
        const props = call?.[0]

        expect(props?.error).toBe(errorMessage)
      })
    })
  })

  describe('Null Data Handling', () => {
    it('should pass null company when no company data is available', () => {
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: mockKeyPersonData,
        isLoading: false,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.company).toBeNull()
      expect(props?.keyPerson).toBe(mockKeyPersonData)
    })

    it('should pass null keyPerson when no key person data is available', () => {
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: mockCompanyData,
        keyPerson: null,
        isLoading: false,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.company).toBe(mockCompanyData)
      expect(props?.keyPerson).toBeNull()
    })

    it('should pass null for both company and keyPerson when no data is available', () => {
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: null,
        isLoading: false,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.company).toBeNull()
      expect(props?.keyPerson).toBeNull()
    })
  })

  describe('Different Company Status Values', () => {
    const statuses: Array<'prospect' | 'active' | 'paused' | 'churned'> = [
      'prospect',
      'active',
      'paused',
      'churned',
    ]

    statuses.forEach((status) => {
      it(`should handle company status: ${status}`, () => {
        vi.mocked(useCompanyDetails).mockReturnValue({
          company: { ...mockCompanyData, status },
          keyPerson: mockKeyPersonData,
          isLoading: false,
          error: null,
        })

        render(<CompanyDetailsPageClient />)

        const call = vi.mocked(CompanyDetails).mock.calls[0]
        const props = call?.[0]

        expect(props?.company?.status).toBe(status)
      })
    })
  })

  describe('Nullable Company Fields', () => {
    it('should handle company with nullable fields set to null', () => {
      const companyWithNulls = {
        ...mockCompanyData,
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: null,
      }

      vi.mocked(useCompanyDetails).mockReturnValue({
        company: companyWithNulls,
        keyPerson: mockKeyPersonData,
        isLoading: false,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.company?.industry).toBeNull()
      expect(props?.company?.companySize).toBeNull()
      expect(props?.company?.websiteUrl).toBeNull()
      expect(props?.company?.billingCountry).toBeNull()
    })
  })

  describe('Nullable KeyPerson Fields', () => {
    it('should handle keyPerson with nullable fields set to null', () => {
      const keyPersonWithNulls = {
        ...mockKeyPersonData,
        email: null,
        phone: null,
        jobTitle: null,
        isActive: false,
      }

      vi.mocked(useCompanyDetails).mockReturnValue({
        company: mockCompanyData,
        keyPerson: keyPersonWithNulls,
        isLoading: false,
        error: null,
      })

      render(<CompanyDetailsPageClient />)

      const call = vi.mocked(CompanyDetails).mock.calls[0]
      const props = call?.[0]

      expect(props?.keyPerson?.email).toBeNull()
      expect(props?.keyPerson?.phone).toBeNull()
      expect(props?.keyPerson?.jobTitle).toBeNull()
      expect(props?.keyPerson?.isActive).toBe(false)
    })
  })

  describe('Component Re-renders', () => {
    it('should re-render when hook return values change', () => {
      const { rerender } = render(<CompanyDetailsPageClient />)

      // Initial render
      expect(CompanyDetails).toHaveBeenCalledTimes(1)

      // Update mock return value
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: { ...mockCompanyData, displayName: 'Updated Name' },
        keyPerson: mockKeyPersonData,
        isLoading: false,
        error: null,
      })

      // Trigger re-render
      rerender(<CompanyDetailsPageClient />)

      expect(CompanyDetails).toHaveBeenCalledTimes(2)

      const secondCall = vi.mocked(CompanyDetails).mock.calls[1]
      expect(secondCall?.[0]?.company?.displayName).toBe('Updated Name')
    })

    it('should re-render when loading state changes', () => {
      const { rerender } = render(<CompanyDetailsPageClient />)

      expect(vi.mocked(CompanyDetails).mock.calls[0]?.[0]?.isLoading).toBe(false)

      // Change to loading state
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: null,
        isLoading: true,
        error: null,
      })

      rerender(<CompanyDetailsPageClient />)

      expect(vi.mocked(CompanyDetails).mock.calls[1]?.[0]?.isLoading).toBe(true)
    })

    it('should re-render when error state changes', () => {
      const { rerender } = render(<CompanyDetailsPageClient />)

      expect(vi.mocked(CompanyDetails).mock.calls[0]?.[0]?.error).toBeNull()

      // Add error
      vi.mocked(useCompanyDetails).mockReturnValue({
        company: null,
        keyPerson: null,
        isLoading: false,
        error: 'New error occurred',
      })

      rerender(<CompanyDetailsPageClient />)

      expect(vi.mocked(CompanyDetails).mock.calls[1]?.[0]?.error).toBe('New error occurred')
    })
  })

  describe('Architecture Compliance', () => {
    it('should follow DDD architecture by being minimal and declarative', () => {
      render(<CompanyDetailsPageClient />)

      // Component should only call the hook once
      expect(useCompanyDetails).toHaveBeenCalledTimes(1)

      // Component should render the presentational component once
      expect(CompanyDetails).toHaveBeenCalledTimes(1)

      // Component should pass all hook values directly to presentational component
      const hookResult = vi.mocked(useCompanyDetails).mock.results[0]?.value
      const componentProps = vi.mocked(CompanyDetails).mock.calls[0]?.[0]

      expect(componentProps?.company).toBe(hookResult?.company)
      expect(componentProps?.keyPerson).toBe(hookResult?.keyPerson)
      expect(componentProps?.isLoading).toBe(hookResult?.isLoading)
      expect(componentProps?.error).toBe(hookResult?.error)
    })

    it('should not contain business logic', () => {
      // This test ensures the component is a simple orchestrator
      const { container } = render(<CompanyDetailsPageClient />)

      // Component should have minimal structure (just the mock div from CompanyDetails)
      expect(container.querySelector('[data-testid="company-details"]')).toBeInTheDocument()
      expect(useCompanyDetails).toHaveBeenCalledTimes(1)
      expect(CompanyDetails).toHaveBeenCalledTimes(1)
    })
  })
})
