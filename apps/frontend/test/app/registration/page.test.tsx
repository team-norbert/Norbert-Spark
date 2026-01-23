import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RegistrationPage from '@/app/registration/page.js'
import { RegistrationForm } from '@/view/client-components/RegistrationForm.js'
import { useRegistrationForm } from '@/view/hooks/useRegistrationForm.js'

// Mock the useRegistrationForm hook
vi.mock('@/view/hooks/useRegistrationForm.js', () => ({
  useRegistrationForm: vi.fn(),
}))

// Mock the RegistrationForm component
vi.mock('@/view/client-components/RegistrationForm.js', () => ({
  RegistrationForm: vi.fn((props) => (
    <div data-testid="registration-form" data-props={JSON.stringify(props)} />
  )),
}))

describe('RegistrationPage', () => {
  const mockHookReturn = {
    errors: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
    formData: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
    generalError: '',
    handleChange: vi.fn(),
    handleGoogleSignUp: vi.fn(),
    handleSignIn: vi.fn(),
    handleSubmit: vi.fn(),
    isSubmitting: false,
    showConfirmPassword: false,
    showPassword: false,
    toggleConfirmPasswordVisibility: vi.fn(),
    togglePasswordVisibility: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRegistrationForm).mockReturnValue(mockHookReturn)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<RegistrationPage />)
      expect(container).toBeInTheDocument()
    })

    it('should render RegistrationForm component', () => {
      render(<RegistrationPage />)
      expect(RegistrationForm).toHaveBeenCalledTimes(1)
    })

    it('should call useRegistrationForm hook', () => {
      render(<RegistrationPage />)
      expect(useRegistrationForm).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props Passing to RegistrationForm', () => {
    it('should pass all state values from useRegistrationForm hook to RegistrationForm', () => {
      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toEqual({
        formData: mockHookReturn.formData,
        errors: mockHookReturn.errors,
        generalError: mockHookReturn.generalError,
        onFieldChange: mockHookReturn.handleChange,
        onSubmit: mockHookReturn.handleSubmit,
        onGoogleSignUp: mockHookReturn.handleGoogleSignUp,
        onSignIn: mockHookReturn.handleSignIn,
        showPassword: mockHookReturn.showPassword,
        showConfirmPassword: mockHookReturn.showConfirmPassword,
        togglePasswordVisibility: mockHookReturn.togglePasswordVisibility,
        toggleConfirmPasswordVisibility: mockHookReturn.toggleConfirmPasswordVisibility,
        isSubmitting: mockHookReturn.isSubmitting,
      })
    })

    it('should pass all handler functions from useRegistrationForm hook to RegistrationForm', () => {
      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      const props = call?.[0] as Record<string, unknown> | undefined

      expect(props).toBeDefined()

      // Ensure all handler props are passed through and are functions
      expect(props?.onFieldChange).toBe(mockHookReturn.handleChange)
      expect(typeof props?.onFieldChange).toBe('function')
      expect(props?.onSubmit).toBe(mockHookReturn.handleSubmit)
      expect(typeof props?.onSubmit).toBe('function')
      expect(props?.onGoogleSignUp).toBe(mockHookReturn.handleGoogleSignUp)
      expect(typeof props?.onGoogleSignUp).toBe('function')
      expect(props?.onSignIn).toBe(mockHookReturn.handleSignIn)
      expect(typeof props?.onSignIn).toBe('function')
      expect(props?.togglePasswordVisibility).toBe(mockHookReturn.togglePasswordVisibility)
      expect(typeof props?.togglePasswordVisibility).toBe('function')
      expect(props?.toggleConfirmPasswordVisibility).toBe(
        mockHookReturn.toggleConfirmPasswordVisibility,
      )
      expect(typeof props?.toggleConfirmPasswordVisibility).toBe('function')
    })
  })

  describe('DDD Architecture Compliance', () => {
    it('should act as a minimal orchestrator between hook and component', () => {
      render(<RegistrationPage />)

      // Component should only call the hook once
      expect(useRegistrationForm).toHaveBeenCalledTimes(1)

      // Component should render RegistrationForm once
      expect(RegistrationForm).toHaveBeenCalledTimes(1)

      // Component should pass all hook values directly to RegistrationForm
      const registrationFormCall = vi.mocked(RegistrationForm).mock.calls[0]
      const passedProps = registrationFormCall?.[0]

      expect(passedProps).toBeDefined()
      expect(Object.keys(passedProps || {})).toHaveLength(12) // All 12 props should be passed
    })

    it('should not contain any business logic', () => {
      render(<RegistrationPage />)

      // All logic should come from the hook
      expect(useRegistrationForm).toHaveBeenCalled()

      // Component should simply render RegistrationForm
      expect(RegistrationForm).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form State Propagation', () => {
    it('should propagate formData state', () => {
      const formData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        formData,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ formData })
    })

    it('should propagate errors state', () => {
      const errors = {
        email: 'Invalid email',
        name: 'Name is required',
        password: 'Password too short',
        confirmPassword: 'Passwords do not match',
      }

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        errors,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ errors })
    })

    it('should propagate generalError state', () => {
      const generalError = 'Registration failed. Please try again.'

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        generalError,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ generalError })
    })

    it('should propagate isSubmitting state', () => {
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        isSubmitting: true,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ isSubmitting: true })
    })

    it('should propagate showPassword state', () => {
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        showPassword: true,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ showPassword: true })
    })

    it('should propagate showConfirmPassword state', () => {
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        showConfirmPassword: true,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ showConfirmPassword: true })
    })
  })

  describe('Handler Propagation', () => {
    it('should propagate all handler functions correctly', () => {
      const customHandlers = {
        handleChange: vi.fn(),
        handleGoogleSignUp: vi.fn(),
        handleSignIn: vi.fn(),
        handleSubmit: vi.fn(),
        toggleConfirmPasswordVisibility: vi.fn(),
        togglePasswordVisibility: vi.fn(),
      }

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        ...customHandlers,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({
        onFieldChange: customHandlers.handleChange,
        onSubmit: customHandlers.handleSubmit,
        onGoogleSignUp: customHandlers.handleGoogleSignUp,
        onSignIn: customHandlers.handleSignIn,
        togglePasswordVisibility: customHandlers.togglePasswordVisibility,
        toggleConfirmPasswordVisibility: customHandlers.toggleConfirmPasswordVisibility,
      })
    })
  })

  describe('Re-rendering Behavior', () => {
    it('should re-render when hook state changes', () => {
      const { rerender } = render(<RegistrationPage />)

      // Change the mock return value
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        isSubmitting: true,
      })

      rerender(<RegistrationPage />)

      // RegistrationForm should have been called twice (initial render + rerender)
      expect(RegistrationForm).toHaveBeenCalledTimes(2)
    })

    it('should pass updated state to RegistrationForm on re-render', () => {
      const { rerender } = render(<RegistrationPage />)

      // First render
      let call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({ isSubmitting: false })

      // Change state
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        isSubmitting: true,
        formData: {
          email: 'new@example.com',
          name: 'New User',
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        },
      })

      rerender(<RegistrationPage />)

      // Second render with updated state
      call = vi.mocked(RegistrationForm).mock.calls[1]
      expect(call?.[0]).toMatchObject({
        isSubmitting: true,
        formData: {
          email: 'new@example.com',
          name: 'New User',
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        },
      })
    })
  })

  describe('Complex State Scenarios', () => {
    it('should handle multiple validation errors', () => {
      const errors = {
        email: 'Email is required',
        name: 'Name must be at least 2 characters',
        password: 'Password must be at least 8 characters',
        confirmPassword: 'Passwords do not match',
      }

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        errors,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0].errors).toEqual(errors)
    })

    it('should handle form submission state', () => {
      const formData = {
        email: 'user@example.com',
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        formData,
        isSubmitting: true,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({
        formData,
        isSubmitting: true,
      })
    })

    it('should handle password visibility toggles independently', () => {
      vi.mocked(useRegistrationForm).mockReturnValue({
        ...mockHookReturn,
        showPassword: true,
        showConfirmPassword: false,
      })

      render(<RegistrationPage />)

      const call = vi.mocked(RegistrationForm).mock.calls[0]
      expect(call?.[0]).toMatchObject({
        showPassword: true,
        showConfirmPassword: false,
      })
    })
  })
})
