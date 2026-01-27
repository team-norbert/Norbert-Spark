import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { CompanyDetails } from '@/view/client-components/CompanyDetails.js'

describe('CompanyDetails Component', () => {
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

  beforeEach(() => {
    // Reset any mocked Date if needed
  })

  describe('Loading State', () => {
    it('should render loading message when isLoading is true', () => {
      render(<CompanyDetails company={null} keyPerson={null} isLoading={true} error={null} />)

      expect(screen.getByRole('heading', { name: /company details/i })).toBeInTheDocument()
      expect(screen.getByText('Loading company details...')).toBeInTheDocument()
    })

    it('should not render company or key person sections when loading', () => {
      render(<CompanyDetails company={null} keyPerson={null} isLoading={true} error={null} />)

      expect(screen.queryByText('Company Information')).not.toBeInTheDocument()
      expect(screen.queryByText('Key Person Contact')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should render error message when error is provided', () => {
      const errorMessage = 'Failed to load company details'
      render(
        <CompanyDetails company={null} keyPerson={null} isLoading={false} error={errorMessage} />
      )

      expect(screen.getByRole('heading', { name: /company details/i })).toBeInTheDocument()
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
    })

    it('should not render company or key person sections when error exists', () => {
      render(
        <CompanyDetails company={null} keyPerson={null} isLoading={false} error="Some error" />
      )

      expect(screen.queryByText('Company Information')).not.toBeInTheDocument()
      expect(screen.queryByText('Key Person Contact')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state message when no company data', () => {
      render(
        <CompanyDetails
          company={null}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('No company or key person data available.')).toBeInTheDocument()
    })

    it('should render empty state message when no key person data', () => {
      render(
        <CompanyDetails company={mockCompanyData} keyPerson={null} isLoading={false} error={null} />
      )

      expect(screen.getByText('No company or key person data available.')).toBeInTheDocument()
    })

    it('should render empty state message when both are null', () => {
      render(<CompanyDetails company={null} keyPerson={null} isLoading={false} error={null} />)

      expect(screen.getByText('No company or key person data available.')).toBeInTheDocument()
    })
  })

  describe('Company Information Section - Core Rendering', () => {
    it('should render company information section heading', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('heading', { name: /company information/i })).toBeInTheDocument()
    })

    it('should render legal name', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Legal Name')).toBeInTheDocument()
      expect(screen.getByText('Acme Corporation Ltd')).toBeInTheDocument()
    })

    it('should render display name', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Display Name')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('should render timezone', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Timezone')).toBeInTheDocument()
      expect(screen.getByText('America/New_York')).toBeInTheDocument()
    })
  })

  describe('Company Status Badge', () => {
    it('should render active status badge', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, status: 'active' }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const statusBadges = screen.getAllByText('Active')
      // First badge is for company, second is for key person
      const companyStatusBadge = statusBadges[0]
      expect(companyStatusBadge).toBeInTheDocument()
    })

    it('should render prospect status badge', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, status: 'prospect' }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const statusBadge = screen.getByText('Prospect')
      expect(statusBadge).toBeInTheDocument()
    })

    it('should render paused status badge', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, status: 'paused' }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const statusBadge = screen.getByText('Paused')
      expect(statusBadge).toBeInTheDocument()
    })

    it('should render churned status badge', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, status: 'churned' }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const statusBadge = screen.getByText('Churned')
      expect(statusBadge).toBeInTheDocument()
    })

    it('should capitalize status text', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, status: 'active' }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const activeElements = screen.getAllByText('Active')
      expect(activeElements.length).toBeGreaterThan(0)
      expect(screen.queryByText('active')).not.toBeInTheDocument()
    })
  })

  describe('Company Nullable Fields', () => {
    it('should render industry when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Industry')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })

    it('should not render industry when null', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, industry: null }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const industryLabels = screen.queryAllByText('Industry')
      expect(industryLabels).toHaveLength(0)
    })

    it('should render company size when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Company Size')).toBeInTheDocument()
      expect(screen.getByText('150 employees')).toBeInTheDocument()
    })

    it('should not render company size when null', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, companySize: null }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.queryByText('Company Size')).not.toBeInTheDocument()
      expect(screen.queryByText(/employees/i)).not.toBeInTheDocument()
    })

    it('should render company size when value is 0', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, companySize: 0 }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Company Size')).toBeInTheDocument()
      expect(screen.getByText('0 employees')).toBeInTheDocument()
    })

    it('should render website URL as clickable link when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Website')).toBeInTheDocument()
      const websiteLink = screen.getByRole('link', { name: 'https://www.acme.com' })
      expect(websiteLink).toBeInTheDocument()
      expect(websiteLink).toHaveAttribute('href', 'https://www.acme.com')
      expect(websiteLink).toHaveAttribute('target', '_blank')
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should not render website when null', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, websiteUrl: null }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.queryByText('Website')).not.toBeInTheDocument()
    })

    it('should render billing country when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Billing Country')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
    })

    it('should not render billing country when null', () => {
      render(
        <CompanyDetails
          company={{ ...mockCompanyData, billingCountry: null }}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.queryByText('Billing Country')).not.toBeInTheDocument()
    })
  })

  describe('Company Timestamps', () => {
    it('should render created at timestamp', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const createdAtLabels = screen.getAllByText('Created At')
      expect(createdAtLabels.length).toBeGreaterThan(0)

      // Check that the timestamp is formatted using toLocaleString with explicit UTC locale
      // TZ=UTC is set in test setup to ensure consistent formatting across CI runners
      const createdDate = new Date('2024-01-15T10:30:00Z').toLocaleString('en-US', {
        timeZone: 'UTC',
      })
      expect(screen.getAllByText(createdDate).length).toBeGreaterThan(0)
    })

    it('should render last updated timestamp', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const updatedAtLabels = screen.getAllByText('Last Updated')
      expect(updatedAtLabels.length).toBeGreaterThan(0)

      // Check that the timestamp is formatted using toLocaleString with explicit UTC locale
      // TZ=UTC is set in test setup to ensure consistent formatting across CI runners
      const updatedDate = new Date('2024-01-20T14:45:00Z').toLocaleString('en-US', {
        timeZone: 'UTC',
      })
      expect(screen.getAllByText(updatedDate).length).toBeGreaterThan(0)
    })
  })

  describe('Key Person Section - Core Rendering', () => {
    it('should render key person contact section heading', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('heading', { name: /key person contact/i })).toBeInTheDocument()
    })

    it('should render full name', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should render first and last name together', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, firstName: 'Jane', lastName: 'Smith' }}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('Key Person Nullable Fields', () => {
    it('should render email as mailto link when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Email')).toBeInTheDocument()
      const emailLink = screen.getByRole('link', { name: 'john.doe@acme.com' })
      expect(emailLink).toBeInTheDocument()
      expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@acme.com')
    })

    it('should not render email when null', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, email: null }}
          isLoading={false}
          error={null}
        />
      )

      const emailLabels = screen.queryAllByText('Email')
      expect(emailLabels).toHaveLength(0)
    })

    it('should render phone as tel link when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Phone')).toBeInTheDocument()
      const phoneLink = screen.getByRole('link', { name: '+1-555-123-4567' })
      expect(phoneLink).toBeInTheDocument()
      expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-123-4567')
    })

    it('should not render phone when null', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, phone: null }}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.queryByText('Phone')).not.toBeInTheDocument()
    })

    it('should render job title when provided', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Job Title')).toBeInTheDocument()
      expect(screen.getByText('CEO')).toBeInTheDocument()
    })

    it('should not render job title when null', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, jobTitle: null }}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.queryByText('Job Title')).not.toBeInTheDocument()
    })
  })

  describe('Key Person Status Badge', () => {
    it('should render active status badge', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, isActive: true }}
          isLoading={false}
          error={null}
        />
      )

      const statusBadges = screen.getAllByText('Active')
      // One for company status, one for key person status
      expect(statusBadges.length).toBeGreaterThan(0)
    })

    it('should render inactive status badge', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={{ ...mockKeyPersonData, isActive: false }}
          isLoading={false}
          error={null}
        />
      )

      const inactiveBadge = screen.getByText('Inactive')
      expect(inactiveBadge).toBeInTheDocument()
    })
  })

  describe('Key Person Timestamps', () => {
    it('should render created at timestamp for key person', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const createdAtLabels = screen.getAllByText('Created At')
      expect(createdAtLabels.length).toBe(2) // One for company, one for key person
    })

    it('should render last updated timestamp for key person', () => {
      render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const updatedAtLabels = screen.getAllByText('Last Updated')
      expect(updatedAtLabels.length).toBe(2) // One for company, one for key person
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should render Material UI Paper components for card sections', () => {
      const { container } = render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      // Material UI Paper components should be present
      const papers = container.querySelectorAll('.MuiPaper-root')
      expect(papers.length).toBeGreaterThan(0)
    })

    it('should render Material UI Container', () => {
      const { container } = render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const muiContainer = container.querySelector('.MuiContainer-root')
      expect(muiContainer).toBeInTheDocument()
    })

    it('should use Material UI Typography components', () => {
      const { container } = render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const typographyElements = container.querySelectorAll('.MuiTypography-root')
      expect(typographyElements.length).toBeGreaterThan(0)
    })

    it('should use Material UI Chip components for status badges', () => {
      const { container } = render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      const chips = container.querySelectorAll('.MuiChip-root')
      expect(chips.length).toBe(2) // One for company status, one for key person status
    })
  })

  describe('Architecture Compliance', () => {
    it('should be a pure presentational component with no business logic', () => {
      const { container } = render(
        <CompanyDetails
          company={mockCompanyData}
          keyPerson={mockKeyPersonData}
          isLoading={false}
          error={null}
        />
      )

      // Component should render based purely on props
      expect(container).toBeInTheDocument()
      expect(screen.getByText('Acme Corporation Ltd')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should handle all prop combinations without errors', () => {
      // Test with minimal data
      const minimalCompany = {
        companyId: '123',
        legalName: 'Test',
        displayName: 'Test',
        status: 'active' as const,
        industry: null,
        companySize: null,
        websiteUrl: null,
        billingCountry: null,
        timezone: 'UTC',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const minimalKeyPerson = {
        keyPersonId: '456',
        firstName: 'Test',
        lastName: 'User',
        email: null,
        phone: null,
        jobTitle: null,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const { container } = render(
        <CompanyDetails
          company={minimalCompany}
          keyPerson={minimalKeyPerson}
          isLoading={false}
          error={null}
        />
      )

      expect(container).toBeInTheDocument()
      // Both legalName and displayName are 'Test', so we expect at least 2
      const testElements = screen.getAllByText('Test')
      expect(testElements.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })
})
