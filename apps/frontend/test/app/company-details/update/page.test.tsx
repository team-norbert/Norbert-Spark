import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UpdateCompanyDetailsPage from '@/app/company-details/update/page.js'
import { CompanyDetailsForm } from '@/view/client-components/CompanyDetailsForm.js'
import { useCompanyDetailsForm } from '@/view/hooks/useCompanyDetailsForm.js'

// Mock the useCompanyDetailsForm hook
vi.mock('@/view/hooks/useCompanyDetailsForm.js', () => ({
  useCompanyDetailsForm: vi.fn(),
}))

// Mock the CompanyDetailsForm component
vi.mock('@/view/client-components/CompanyDetailsForm.js', () => ({
  CompanyDetailsForm: vi.fn((props) => (
    <div data-testid="company-details-form" data-props={JSON.stringify(props)} />
  )),
}))

describe('UpdateCompanyDetailsPage', () => {
  const mockFormData = {
    companyId: '123e4567-e89b-12d3-a456-426614174000',
    legalName: 'Test Company Ltd',
    displayName: 'Test Corp',
    status: 'active' as const,
    industry: 'Technology',
    companySize: '100',
    websiteUrl: 'https://test.com',
    billingCountry: 'US',
    timezone: 'America/New_York',
    keyPersonId: '987e6543-e21b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    phone: '+1-555-123-4567',
    jobTitle: 'CEO',
    isActive: true,
  }

  const mockErrors = {
    legalName: '',
    displayName: '',
    status: '',
    industry: '',
    companySize: '',
    websiteUrl: '',
    billingCountry: '',
    timezone: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
  }

  const mockHookReturn = {
    errors: mockErrors,
    formData: mockFormData,
    generalError: '',
    handleCancel: vi.fn(),
    handleChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    isSubmitting: false,
    successMessage: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCompanyDetailsForm).mockReturnValue(mockHookReturn)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<UpdateCompanyDetailsPage />)
      expect(container).toBeInTheDocument()
    })

    it('should call useCompanyDetailsForm hook', () => {
      render(<UpdateCompanyDetailsPage />)
      expect(useCompanyDetailsForm).toHaveBeenCalledTimes(1)
    })

    it('should render CompanyDetailsForm when not loading', () => {
      render(<UpdateCompanyDetailsPage />)
      expect(CompanyDetailsForm).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      })

      render(<UpdateCompanyDetailsPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText('Loading company details...')).toBeInTheDocument()
    })

    it('should not render CompanyDetailsForm when loading', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      })

      render(<UpdateCompanyDetailsPage />)

      expect(CompanyDetailsForm).not.toHaveBeenCalled()
    })

    it('should display loading text', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      })

      render(<UpdateCompanyDetailsPage />)

      expect(screen.getByText('Loading company details...')).toBeInTheDocument()
    })

    it('should center loading spinner', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      })

      const { container } = render(<UpdateCompanyDetailsPage />)

      const loadingBox = container.querySelector('[class*="MuiBox-root"]')
      expect(loadingBox).toBeInTheDocument()
    })
  })

  describe('Props Passing to CompanyDetailsForm', () => {
    it('should pass all state values from useCompanyDetailsForm hook to CompanyDetailsForm', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      expect(call?.[0]).toEqual({
        formData: mockHookReturn.formData,
        errors: mockHookReturn.errors,
        generalError: mockHookReturn.generalError,
        successMessage: mockHookReturn.successMessage,
        onFieldChange: mockHookReturn.handleChange,
        onSubmit: mockHookReturn.handleSubmit,
        onCancel: mockHookReturn.handleCancel,
        isSubmitting: mockHookReturn.isSubmitting,
      })
    })

    it('should pass formData prop correctly', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.formData).toBe(mockHookReturn.formData)
      expect(props?.formData).toEqual(mockFormData)
    })

    it('should pass errors prop correctly', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.errors).toBe(mockHookReturn.errors)
    })

    it('should pass all handler functions from useCompanyDetailsForm hook to CompanyDetailsForm', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.onFieldChange).toBe(mockHookReturn.handleChange)
      expect(typeof props?.onFieldChange).toBe('function')
      expect(props?.onSubmit).toBe(mockHookReturn.handleSubmit)
      expect(typeof props?.onSubmit).toBe('function')
      expect(props?.onCancel).toBe(mockHookReturn.handleCancel)
      expect(typeof props?.onCancel).toBe('function')
    })

    it('should pass generalError prop correctly', () => {
      const errorMessage = 'Failed to load company details'
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        generalError: errorMessage,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.generalError).toBe(errorMessage)
    })

    it('should pass successMessage prop correctly', () => {
      const successMsg = 'Company details updated successfully!'
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        successMessage: successMsg,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.successMessage).toBe(successMsg)
    })

    it('should pass isSubmitting prop correctly', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isSubmitting: true,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.isSubmitting).toBe(true)
    })
  })

  describe('DDD Architecture Compliance', () => {
    it('should act as a minimal orchestrator between hook and component', () => {
      render(<UpdateCompanyDetailsPage />)

      // Component should only call the hook once
      expect(useCompanyDetailsForm).toHaveBeenCalledTimes(1)

      // Component should render CompanyDetailsForm once
      expect(CompanyDetailsForm).toHaveBeenCalledTimes(1)

      // Component should pass all hook values directly to CompanyDetailsForm
      const formCall = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const passedProps = formCall?.[0]

      expect(passedProps).toBeDefined()
      expect(Object.keys(passedProps || {})).toHaveLength(8) // All 8 props should be passed
    })

    it('should not contain any business logic', () => {
      render(<UpdateCompanyDetailsPage />)

      // All logic should come from the hook
      expect(useCompanyDetailsForm).toHaveBeenCalled()

      // Component should simply render CompanyDetailsForm
      expect(CompanyDetailsForm).toHaveBeenCalledTimes(1)
    })

    it('should follow orchestration pattern - no state management', () => {
      render(<UpdateCompanyDetailsPage />)

      // Page should only orchestrate, not manage state
      // All state comes from the hook
      expect(useCompanyDetailsForm).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form State Propagation', () => {
    it('should propagate formData state with company fields', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined
      const formData = props?.formData as typeof mockFormData | undefined

      expect(formData?.companyId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(formData?.legalName).toBe('Test Company Ltd')
      expect(formData?.displayName).toBe('Test Corp')
      expect(formData?.status).toBe('active')
      expect(formData?.industry).toBe('Technology')
      expect(formData?.companySize).toBe('100')
      expect(formData?.websiteUrl).toBe('https://test.com')
      expect(formData?.billingCountry).toBe('US')
      expect(formData?.timezone).toBe('America/New_York')
    })

    it('should propagate formData state with key person fields', () => {
      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined
      const formData = props?.formData as typeof mockFormData | undefined

      expect(formData?.keyPersonId).toBe('987e6543-e21b-12d3-a456-426614174000')
      expect(formData?.firstName).toBe('John')
      expect(formData?.lastName).toBe('Doe')
      expect(formData?.email).toBe('john@test.com')
      expect(formData?.phone).toBe('+1-555-123-4567')
      expect(formData?.jobTitle).toBe('CEO')
      expect(formData?.isActive).toBe(true)
    })

    it('should propagate errors state', () => {
      const errorState = {
        ...mockErrors,
        legalName: 'Legal name is required',
        email: 'Invalid email format',
      }

      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        errors: errorState,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.errors).toEqual(errorState)
    })
  })

  describe('Loading to Form Transition', () => {
    it('should transition from loading state to form display', () => {
      const { rerender } = render(<UpdateCompanyDetailsPage />)

      // Initially loading
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      })
      rerender(<UpdateCompanyDetailsPage />)

      expect(screen.getByText('Loading company details...')).toBeInTheDocument()

      // Then loaded
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isLoading: false,
      })
      rerender(<UpdateCompanyDetailsPage />)

      expect(screen.queryByText('Loading company details...')).not.toBeInTheDocument()
      expect(CompanyDetailsForm).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty formData gracefully', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        formData: {
          ...mockFormData,
          legalName: '',
          displayName: '',
          industry: '',
          companySize: '',
          websiteUrl: '',
          billingCountry: '',
        },
      })

      render(<UpdateCompanyDetailsPage />)

      expect(CompanyDetailsForm).toHaveBeenCalled()
      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined
      const formData = props?.formData as typeof mockFormData | undefined

      expect(formData?.legalName).toBe('')
      expect(formData?.displayName).toBe('')
    })

    it('should handle all error fields populated', () => {
      const allErrors = {
        legalName: 'Legal name error',
        displayName: 'Display name error',
        status: 'Status error',
        industry: 'Industry error',
        companySize: 'Company size error',
        websiteUrl: 'Website URL error',
        billingCountry: 'Billing country error',
        timezone: 'Timezone error',
        firstName: 'First name error',
        lastName: 'Last name error',
        email: 'Email error',
        phone: 'Phone error',
        jobTitle: 'Job title error',
      }

      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        errors: allErrors,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.errors).toEqual(allErrors)
    })

    it('should handle isSubmitting state', () => {
      vi.mocked(useCompanyDetailsForm).mockReturnValue({
        ...mockHookReturn,
        isSubmitting: true,
      })

      render(<UpdateCompanyDetailsPage />)

      const call = vi.mocked(CompanyDetailsForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props?.isSubmitting).toBe(true)
    })
  })
})
