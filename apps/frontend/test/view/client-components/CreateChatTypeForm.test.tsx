import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateChatTypeForm } from '@/view/client-components/CreateChatTypeForm.js'

describe('CreateChatTypeForm', () => {
  const mockOnFieldChange = vi.fn()
  const mockOnRagChange = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnNavigateHome = vi.fn()
  const mockOnSignOut = vi.fn()

  // onFieldChange returns an event handler — stub it per field
  const mockFieldHandler = vi.fn()

  const defaultProps = {
    formData: { name: '', description: '', rag: false },
    errors: { name: '', description: '' },
    generalError: undefined,
    successMessage: undefined,
    isSubmitting: false,
    onFieldChange: mockOnFieldChange.mockReturnValue(mockFieldHandler),
    onRagChange: mockOnRagChange,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    onNavigateHome: mockOnNavigateHome,
    onSignOut: mockOnSignOut,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnFieldChange.mockReturnValue(mockFieldHandler)
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe('Rendering', () => {
    it('should render the page header with "Create Chat Type" title', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByText('Create Chat Type')).toBeInTheDocument()
    })

    it('should render the info accordion', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByText(/read me: what is a chat type\?/i)).toBeInTheDocument()
    })

    it('should render the name text field', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByTestId('name-input')).toBeInTheDocument()
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
    })

    it('should render the description text field', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByTestId('description-input')).toBeInTheDocument()
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument()
    })

    it('should render the RAG checkbox', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByTestId('rag-checkbox')).toBeInTheDocument()
    })

    it('should render the RAG checkbox label text', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByText(/RAG \(Retrieval-Augmented Generation\)/i)).toBeInTheDocument()
    })

    it('should render the Create submit button', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByTestId('create-button')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
    })

    it('should render the Cancel button', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
    })

    it('should not render error alert when generalError is absent', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should not render success alert when successMessage is absent', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should render name field helper text', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(
        screen.getByText('Display name for the chat type (max 200 characters)')
      ).toBeInTheDocument()
    })

    it('should render description field helper text', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(
        screen.getByText('Detailed description of the chat type (max 500 characters)')
      ).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Form Data Display
  // ---------------------------------------------------------------------------
  describe('Form Data Display', () => {
    it('should display the name value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, name: 'Support Chat' },
      }
      render(<CreateChatTypeForm {...props} />)

      const input = screen.getByTestId('name-input').querySelector('input') as HTMLInputElement
      expect(input.value).toBe('Support Chat')
    })

    it('should display the description value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, description: 'Helps customers' },
      }
      render(<CreateChatTypeForm {...props} />)

      const textarea = screen
        .getByTestId('description-input')
        .querySelector('textarea') as unknown as HTMLInputElement
      expect(textarea.value).toBe('Helps customers')
    })

    it('should render the RAG checkbox as unchecked when rag is false', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })

    it('should render the RAG checkbox as checked when rag is true', () => {
      const props = { ...defaultProps, formData: { ...defaultProps.formData, rag: true } }
      render(<CreateChatTypeForm {...props} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Error Display
  // ---------------------------------------------------------------------------
  describe('Error Display', () => {
    it('should display the name field error when present', () => {
      const props = { ...defaultProps, errors: { name: 'Name is required', description: '' } }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    it('should display the description field error when present', () => {
      const props = {
        ...defaultProps,
        errors: { name: '', description: 'Description is required' },
      }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })

    it('should display both field errors simultaneously', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required', description: 'Description is required' },
      }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })

    it('should show name error helper text instead of the default hint', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name must be 200 characters or fewer', description: '' },
      }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByText('Name must be 200 characters or fewer')).toBeInTheDocument()
      expect(
        screen.queryByText('Display name for the chat type (max 200 characters)')
      ).not.toBeInTheDocument()
    })

    it('should display the general error alert', () => {
      const props = { ...defaultProps, generalError: 'Something went wrong. Please try again.' }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })

    it('should not display the success alert when only generalError is set', () => {
      const props = { ...defaultProps, generalError: 'Server error', successMessage: undefined }
      render(<CreateChatTypeForm {...props} />)

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Success Display
  // ---------------------------------------------------------------------------
  describe('Success Display', () => {
    it('should display the success alert when successMessage is provided', () => {
      const props = {
        ...defaultProps,
        successMessage: 'Chat type "Support Chat" created successfully!',
      }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Chat type "Support Chat" created successfully!')).toBeInTheDocument()
    })

    it('should not display the error alert when only successMessage is set', () => {
      const props = {
        ...defaultProps,
        generalError: undefined,
        successMessage: 'Created!',
      }
      render(<CreateChatTypeForm {...props} />)

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(1)
    })

    it('should display both alerts when both generalError and successMessage are set', () => {
      const props = {
        ...defaultProps,
        generalError: 'An error occurred',
        successMessage: 'But also a success',
      }
      render(<CreateChatTypeForm {...props} />)

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Disabled / submitting state
  // ---------------------------------------------------------------------------
  describe('Submitting State', () => {
    it('should disable all inputs when isSubmitting is true', () => {
      const props = { ...defaultProps, isSubmitting: true }
      render(<CreateChatTypeForm {...props} />)

      const nameInput = screen.getByTestId('name-input').querySelector('input') as HTMLInputElement
      const descTextarea = screen
        .getByTestId('description-input')
        .querySelector('textarea') as unknown as HTMLInputElement
      const ragCheckbox = screen.getByRole('checkbox') as HTMLInputElement

      expect(nameInput.disabled).toBe(true)
      expect(descTextarea.disabled).toBe(true)
      expect(ragCheckbox.disabled).toBe(true)
    })

    it('should disable the Create button when isSubmitting is true', () => {
      const props = { ...defaultProps, isSubmitting: true }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByTestId('create-button')).toBeDisabled()
    })

    it('should disable the Cancel button when isSubmitting is true', () => {
      const props = { ...defaultProps, isSubmitting: true }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByTestId('cancel-button')).toBeDisabled()
    })

    it('should show "Creating…" text on the submit button when isSubmitting is true', () => {
      const props = { ...defaultProps, isSubmitting: true }
      render(<CreateChatTypeForm {...props} />)

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
    })

    it('should show "Create" text on the submit button when isSubmitting is false', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
    })

    it('should not disable inputs when isSubmitting is false', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const nameInput = screen.getByTestId('name-input').querySelector('input') as HTMLInputElement
      expect(nameInput.disabled).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  describe('Event Handlers', () => {
    it('should call onFieldChange with "name" when the name input changes', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const input = screen.getByTestId('name-input').querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New Name' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('name')
      expect(mockFieldHandler).toHaveBeenCalled()
    })

    it('should call onFieldChange with "description" when the description input changes', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const textarea = screen
        .getByTestId('description-input')
        .querySelector('textarea') as unknown as HTMLInputElement
      fireEvent.change(textarea, { target: { value: 'A new description' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('description')
      expect(mockFieldHandler).toHaveBeenCalled()
    })

    it('should call onRagChange when the RAG checkbox is toggled', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const checkbox = screen.getByTestId('rag-checkbox')
      fireEvent.click(checkbox)

      expect(mockOnRagChange).toHaveBeenCalledTimes(1)
    })

    it('should call onSubmit when the form is submitted', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const form = screen.getByTestId('create-button').closest('form')!
      fireEvent.submit(form)

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when the Cancel button is clicked', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      fireEvent.click(screen.getByTestId('cancel-button'))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should not call onRagChange when the checkbox is disabled', () => {
      const props = { ...defaultProps, isSubmitting: true }
      render(<CreateChatTypeForm {...props} />)

      const checkbox = screen.getByTestId('rag-checkbox')
      fireEvent.click(checkbox)

      expect(mockOnRagChange).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Accordion content
  // ---------------------------------------------------------------------------
  describe('Accordion Info Content', () => {
    it('should expand the accordion and display help content', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const accordionHeader = screen.getByText(/read me: what is a chat type\?/i)
      fireEvent.click(accordionHeader)

      expect(screen.getByText(/this form will create a new chat type/i)).toBeInTheDocument()
    })

    it('should display the RAG prompt description in the accordion body', () => {
      render(<CreateChatTypeForm {...defaultProps} />)

      const accordionHeader = screen.getByText(/read me: what is a chat type\?/i)
      fireEvent.click(accordionHeader)

      expect(screen.getByText(/enter prompt here/i)).toBeInTheDocument()
    })
  })
})
