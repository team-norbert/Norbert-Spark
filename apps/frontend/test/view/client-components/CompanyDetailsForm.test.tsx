import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyDetailsForm } from '@/view/client-components/CompanyDetailsForm.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseFormData = {
  companyId: 'company-uuid-001',
  legalName: 'Acme Corp Ltd',
  displayName: 'Acme Corp',
  status: 'active' as const,
  industry: 'Technology',
  companySize: '250',
  websiteUrl: 'https://acme.example.com',
  billingCountry: 'US',
  timezone: 'America/New_York',
  keyPersonId: 'person-uuid-001',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@acme.example.com',
  phone: '+1 555 000 1234',
  jobTitle: 'CEO',
  isActive: true,
}

const noErrors = {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHandlers() {
  return {
    onFieldChange: vi.fn().mockReturnValue(vi.fn()),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onCancel: vi.fn(),
    onNavigateHome: vi.fn(),
    onSignOut: vi.fn(),
  }
}

function renderForm(overrides: Partial<Parameters<typeof CompanyDetailsForm>[0]> = {}) {
  const handlers = makeHandlers()
  render(
    <CompanyDetailsForm formData={baseFormData} errors={noErrors} {...handlers} {...overrides} />
  )
  return handlers
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompanyDetailsForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ── Section headings ──────────────────────────────────────────────────────

  describe('section headings', () => {
    it('renders the page title in the header', () => {
      renderForm()

      expect(screen.getByRole('heading', { name: /update company details/i })).toBeInTheDocument()
    })

    it('renders the Company Information section heading', () => {
      renderForm()

      expect(screen.getByTestId('company-information-heading')).toHaveTextContent(
        'Company Information'
      )
    })

    it('renders the Key Person Contact section heading', () => {
      renderForm()

      expect(screen.getByRole('heading', { name: /key person contact/i })).toBeInTheDocument()
    })
  })

  // ── Company field values ──────────────────────────────────────────────────

  describe('company field values', () => {
    it('renders the legalName value', () => {
      renderForm()

      expect(screen.getByTestId('legal-name-input').querySelector('input')).toHaveValue(
        'Acme Corp Ltd'
      )
    })

    it('renders the displayName value', () => {
      renderForm()

      expect(screen.getByTestId('display-name-input').querySelector('input')).toHaveValue(
        'Acme Corp'
      )
    })

    it('renders the selected status', () => {
      renderForm()

      expect(screen.getByTestId('status-select')).toHaveTextContent('Active')
    })

    it('renders the industry value', () => {
      renderForm()

      expect(screen.getByTestId('industry-input').querySelector('input')).toHaveValue('Technology')
    })

    it('renders the companySize value', () => {
      renderForm()

      expect(screen.getByTestId('company-size-input').querySelector('input')).toHaveValue(250)
    })

    it('renders the websiteUrl value', () => {
      renderForm()

      expect(screen.getByTestId('website-url-input').querySelector('input')).toHaveValue(
        'https://acme.example.com'
      )
    })

    it('renders the billingCountry value', () => {
      renderForm()

      expect(screen.getByTestId('billing-country-input').querySelector('input')).toHaveValue('US')
    })

    it('renders the timezone value', () => {
      renderForm()

      expect(screen.getByTestId('timezone-input').querySelector('input')).toHaveValue(
        'America/New_York'
      )
    })
  })

  // ── Key person field values ───────────────────────────────────────────────

  describe('key person field values', () => {
    it('renders the firstName value', () => {
      renderForm()

      expect(screen.getByTestId('first-name-input').querySelector('input')).toHaveValue('Jane')
    })

    it('renders the lastName value', () => {
      renderForm()

      expect(screen.getByTestId('last-name-input').querySelector('input')).toHaveValue('Doe')
    })

    it('renders the email value', () => {
      renderForm()

      expect(screen.getByTestId('email-input').querySelector('input')).toHaveValue(
        'jane@acme.example.com'
      )
    })

    it('renders the phone value', () => {
      renderForm()

      expect(screen.getByTestId('phone-input').querySelector('input')).toHaveValue(
        '+1 555 000 1234'
      )
    })

    it('renders the jobTitle value', () => {
      renderForm()

      expect(screen.getByTestId('job-title-input').querySelector('input')).toHaveValue('CEO')
    })

    it('renders the Active Status switch as checked when isActive is true', () => {
      renderForm()

      expect(screen.getByRole('switch', { name: /active status/i })).toBeChecked()
    })

    it('renders the Active Status switch as unchecked when isActive is false', () => {
      renderForm({ formData: { ...baseFormData, isActive: false } })

      expect(screen.getByRole('switch', { name: /active status/i })).not.toBeChecked()
    })
  })

  // ── Status select options ─────────────────────────────────────────────────

  describe('status select', () => {
    it('shows all four status options when opened', () => {
      renderForm()

      const selectTrigger = within(screen.getByTestId('status-select')).getByRole('combobox')
      fireEvent.mouseDown(selectTrigger)

      expect(screen.getByRole('option', { name: 'Prospect' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Paused' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Churned' })).toBeInTheDocument()
    })

    it('reflects a different status value', () => {
      renderForm({ formData: { ...baseFormData, status: 'prospect' } })

      expect(screen.getByTestId('status-select')).toHaveTextContent('Prospect')
    })
  })

  // ── Helper texts ──────────────────────────────────────────────────────────

  describe('helper texts shown when no errors', () => {
    it('shows legal name helper text', () => {
      renderForm()

      expect(screen.getByText(/legal name of the company/i)).toBeInTheDocument()
    })

    it('shows display name helper text', () => {
      renderForm()

      expect(screen.getByText(/display name of the company/i)).toBeInTheDocument()
    })

    it('shows website URL helper text', () => {
      renderForm()

      expect(screen.getByText(/must be valid URL/i)).toBeInTheDocument()
    })

    it('shows first name helper text', () => {
      renderForm()

      expect(screen.getByText(/first name \(1-100 characters\)/i)).toBeInTheDocument()
    })

    it('shows last name helper text', () => {
      renderForm()

      expect(screen.getByText(/last name \(1-100 characters\)/i)).toBeInTheDocument()
    })
  })

  // ── Field error display ───────────────────────────────────────────────────

  describe('field error display', () => {
    it('shows legalName error instead of helper text', () => {
      renderForm({ errors: { ...noErrors, legalName: 'Legal name is required' } })

      expect(screen.getByText('Legal name is required')).toBeInTheDocument()
      expect(screen.queryByText(/legal name of the company/i)).not.toBeInTheDocument()
    })

    it('shows displayName error', () => {
      renderForm({ errors: { ...noErrors, displayName: 'Display name too short' } })

      expect(screen.getByText('Display name too short')).toBeInTheDocument()
    })

    it('shows status error', () => {
      renderForm({ errors: { ...noErrors, status: 'Status is invalid' } })

      expect(screen.getByText('Status is invalid')).toBeInTheDocument()
    })

    it('shows websiteUrl error', () => {
      renderForm({ errors: { ...noErrors, websiteUrl: 'Must be a valid URL' } })

      expect(screen.getByText('Must be a valid URL')).toBeInTheDocument()
    })

    it('shows firstName error', () => {
      renderForm({ errors: { ...noErrors, firstName: 'First name is required' } })

      expect(screen.getByText('First name is required')).toBeInTheDocument()
    })

    it('shows lastName error', () => {
      renderForm({ errors: { ...noErrors, lastName: 'Last name is required' } })

      expect(screen.getByText('Last name is required')).toBeInTheDocument()
    })

    it('shows email error', () => {
      renderForm({ errors: { ...noErrors, email: 'Invalid email address' } })

      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  // ── Alert messages ────────────────────────────────────────────────────────

  describe('alert messages', () => {
    it('renders a generalError alert when provided', () => {
      renderForm({ generalError: 'Something went wrong' })

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    })

    it('does not render an error alert when generalError is absent', () => {
      renderForm()

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('renders a successMessage alert when provided', () => {
      renderForm({ successMessage: 'Changes saved successfully' })

      expect(screen.getByRole('alert')).toHaveTextContent('Changes saved successfully')
    })

    it('renders both generalError and successMessage alerts when both are provided', () => {
      renderForm({ generalError: 'Error!', successMessage: 'Saved!' })

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(2)
    })
  })

  // ── Buttons ───────────────────────────────────────────────────────────────

  describe('buttons', () => {
    it('renders the Cancel button', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders the Save Changes button', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('shows "Saving..." on the submit button when isSubmitting is true', () => {
      renderForm({ isSubmitting: true })

      expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeInTheDocument()
    })

    it('disables the Cancel button when isSubmitting is true', () => {
      renderForm({ isSubmitting: true })

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })

    it('disables the submit button when isSubmitting is true', () => {
      renderForm({ isSubmitting: true })

      expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeDisabled()
    })

    it('enables both buttons when isSubmitting is false', () => {
      renderForm({ isSubmitting: false })

      expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
    })
  })

  // ── Callbacks ─────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onCancel when the Cancel button is clicked', () => {
      const handlers = renderForm()

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(handlers.onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onSubmit when the form is submitted', () => {
      const handlers = renderForm()

      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

      expect(handlers.onSubmit).toHaveBeenCalledTimes(1)
    })

    it('calls onNavigateHome when the Home icon button is clicked', () => {
      const handlers = renderForm()

      fireEvent.click(screen.getByRole('button', { name: /home/i }))

      expect(handlers.onNavigateHome).toHaveBeenCalledTimes(1)
    })

    it('calls onSignOut when the Sign Out button is clicked', () => {
      const handlers = renderForm()

      fireEvent.click(screen.getByTestId('sign-out-button'))

      expect(handlers.onSignOut).toHaveBeenCalledTimes(1)
    })

    it('calls onFieldChange handler when legalName input changes', () => {
      const fieldHandler = vi.fn()
      const onFieldChange = vi.fn().mockReturnValue(fieldHandler)
      renderForm({ onFieldChange })

      const input = screen.getByTestId('legal-name-input').querySelector('input')!
      fireEvent.change(input, { target: { value: 'New Legal Name' } })

      expect(onFieldChange).toHaveBeenCalledWith('legalName')
      expect(fieldHandler).toHaveBeenCalled()
    })

    it('calls onFieldChange handler when firstName input changes', () => {
      const fieldHandler = vi.fn()
      const onFieldChange = vi.fn().mockReturnValue(fieldHandler)
      renderForm({ onFieldChange })

      const input = screen.getByTestId('first-name-input').querySelector('input')!
      fireEvent.change(input, { target: { value: 'John' } })

      expect(onFieldChange).toHaveBeenCalledWith('firstName')
      expect(fieldHandler).toHaveBeenCalled()
    })

    it('calls onFieldChange handler when Active Status switch is toggled', () => {
      const fieldHandler = vi.fn()
      const onFieldChange = vi.fn().mockReturnValue(fieldHandler)
      renderForm({ onFieldChange })

      fireEvent.click(screen.getByRole('switch', { name: /active status/i }))

      expect(onFieldChange).toHaveBeenCalledWith('isActive')
      expect(fieldHandler).toHaveBeenCalled()
    })
  })
})
