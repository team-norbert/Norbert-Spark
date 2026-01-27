import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Dashboard } from '@/view/client-components/Dashboard.js'

describe('Dashboard Component', () => {
  const mockOnNavigate = vi.fn()
  const mockOnSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Rendering', () => {
    it('should render the dashboard title', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const title = screen.getByRole('heading', { name: /dashboard/i, level: 1 })
      expect(title).toBeInTheDocument()
    })

    it('should render the MUI Container component', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const muiContainer = container.querySelector('.MuiContainer-root')
      expect(muiContainer).toBeInTheDocument()
    })

    it('should render the grid layout Box', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const gridBox = container.querySelector('.MuiBox-root')
      expect(gridBox).toBeInTheDocument()
    })

    it('should render Sign Out button', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()
    })
  })

  describe('Navigation Cards', () => {
    describe('Chat Card', () => {
      it('should render Chat card with icon, title, and description', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Chat')).toBeInTheDocument()
        expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
        expect(screen.getByTestId('ChatIcon')).toBeInTheDocument()
      })

      it('should call onNavigate with /ai when Chat card is clicked', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        const chatCard = screen.getByText('Chat').closest('.MuiCardActionArea-root')
        fireEvent.click(chatCard!)

        expect(mockOnNavigate).toHaveBeenCalledWith('/ai')
        expect(mockOnNavigate).toHaveBeenCalledTimes(1)
      })
    })

    describe('Profile Card', () => {
      it('should render Profile card with icon, title, and description', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('View and edit your profile')).toBeInTheDocument()
        expect(screen.getByTestId('PersonIcon')).toBeInTheDocument()
      })

      it('should call onNavigate with /profile when Profile card is clicked', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        const profileCard = screen.getByText('Profile').closest('.MuiCardActionArea-root')
        fireEvent.click(profileCard!)

        expect(mockOnNavigate).toHaveBeenCalledWith('/profile')
        expect(mockOnNavigate).toHaveBeenCalledTimes(1)
      })
    })

    describe('Extract Data Card', () => {
      it('should render Extract Data card with icon, title, and description', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Extract Data')).toBeInTheDocument()
        expect(screen.getByText('Upload and extract data from files')).toBeInTheDocument()
        expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument()
      })

      it('should call onNavigate with /extract-data when Extract Data card is clicked', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        const extractDataCard = screen.getByText('Extract Data').closest('.MuiCardActionArea-root')
        fireEvent.click(extractDataCard!)

        expect(mockOnNavigate).toHaveBeenCalledWith('/extract-data')
        expect(mockOnNavigate).toHaveBeenCalledTimes(1)
      })

      it('should render Extract Data card for both admin and non-admin users', () => {
        // Test for non-admin
        const { rerender } = render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Extract Data')).toBeInTheDocument()

        // Test for admin
        rerender(
          <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Extract Data')).toBeInTheDocument()
      })
    })

    describe('Company Details Card', () => {
      it('should render Company Details card with icon, title, and description', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Company Details')).toBeInTheDocument()
        expect(screen.getByText('View company and key person info')).toBeInTheDocument()
        expect(screen.getByTestId('BusinessIcon')).toBeInTheDocument()
      })

      it('should call onNavigate with /company-details when Company Details card is clicked', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        const companyDetailsCard = screen
          .getByText('Company Details')
          .closest('.MuiCardActionArea-root')
        fireEvent.click(companyDetailsCard!)

        expect(mockOnNavigate).toHaveBeenCalledWith('/company-details')
        expect(mockOnNavigate).toHaveBeenCalledTimes(1)
      })

      it('should render Company Details card for both admin and non-admin users', () => {
        // Test for non-admin
        const { rerender } = render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Company Details')).toBeInTheDocument()

        // Test for admin
        rerender(
          <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('Company Details')).toBeInTheDocument()
      })
    })

    describe('Admin Card', () => {
      it('should NOT render Admin card when canAccessAdmin is false', () => {
        render(
          <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.queryByText('User Admin')).not.toBeInTheDocument()
        expect(screen.queryByText('Manage users and settings')).not.toBeInTheDocument()
        expect(screen.queryByTestId('AdminPanelSettingsIcon')).not.toBeInTheDocument()
      })

      it('should render Admin card when canAccessAdmin is true', () => {
        render(
          <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        expect(screen.getByText('User Admin')).toBeInTheDocument()
        expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
        expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument()
      })

      it('should call onNavigate with /admin when Admin card is clicked', () => {
        render(
          <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
        )

        const adminCard = screen.getByText('User Admin').closest('.MuiCardActionArea-root')
        fireEvent.click(adminCard!)

        expect(mockOnNavigate).toHaveBeenCalledWith('/admin')
        expect(mockOnNavigate).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Card Count Based on Role', () => {
    it('should render exactly 4 cards when canAccessAdmin is false', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const cards = container.querySelectorAll('.MuiCard-root')
      expect(cards).toHaveLength(4) // Chat, Profile, Extract Data, Company Details
    })

    it('should render exactly 6 cards when canAccessAdmin is true', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const cards = container.querySelectorAll('.MuiCard-root')
      expect(cards).toHaveLength(6) // Chat, Profile, Extract Data, Company Details, Admin, AI Config
    })
  })

  describe('Material UI Icons', () => {
    it('should render ChatIcon for Chat card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByTestId('ChatIcon')).toBeInTheDocument()
    })

    it('should render PersonIcon for Profile card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByTestId('PersonIcon')).toBeInTheDocument()
    })

    it('should render DescriptionIcon for Extract Data card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument()
    })

    it('should render BusinessIcon for Company Details card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByTestId('BusinessIcon')).toBeInTheDocument()
    })

    it('should render AdminPanelSettingsIcon when admin access is granted', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument()
    })
  })

  describe('Navigation Callback Behavior', () => {
    it('should not call onNavigate on initial render', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(mockOnNavigate).not.toHaveBeenCalled()
    })

    it('should handle multiple card clicks correctly', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('.MuiCardActionArea-root')
      const profileCard = screen.getByText('Profile').closest('.MuiCardActionArea-root')
      const companyDetailsCard = screen
        .getByText('Company Details')
        .closest('.MuiCardActionArea-root')
      const adminCard = screen.getByText('User Admin').closest('.MuiCardActionArea-root')

      fireEvent.click(chatCard!)
      fireEvent.click(profileCard!)
      fireEvent.click(companyDetailsCard!)
      fireEvent.click(adminCard!)

      expect(mockOnNavigate).toHaveBeenCalledTimes(4)
      expect(mockOnNavigate).toHaveBeenNthCalledWith(1, '/ai')
      expect(mockOnNavigate).toHaveBeenNthCalledWith(2, '/profile')
      expect(mockOnNavigate).toHaveBeenNthCalledWith(3, '/company-details')
      expect(mockOnNavigate).toHaveBeenNthCalledWith(4, '/admin')
    })

    it('should handle same card clicked multiple times', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('.MuiCardActionArea-root')

      fireEvent.click(chatCard!)
      fireEvent.click(chatCard!)
      fireEvent.click(chatCard!)

      expect(mockOnNavigate).toHaveBeenCalledTimes(3)
      expect(mockOnNavigate).toHaveBeenCalledWith('/ai')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Dashboard')

      const h2Cards = screen.getAllByRole('heading', { level: 2 })
      expect(h2Cards.length).toBeGreaterThanOrEqual(4)
    })

    it('should render cards as interactive elements', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatActionArea = screen.getByText('Chat').closest('.MuiCardActionArea-root')
      const profileActionArea = screen.getByText('Profile').closest('.MuiCardActionArea-root')

      expect(chatActionArea).toBeInTheDocument()
      expect(profileActionArea).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should apply grid layout with responsive columns', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const gridBox = container.querySelector('.MuiBox-root')
      expect(gridBox).toBeInTheDocument()
    })

    it('should render within a Container with maxWidth="lg"', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const muiContainer = container.querySelector('.MuiContainer-maxWidthLg')
      expect(muiContainer).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('should accept canAccessAdmin boolean prop', () => {
      const { rerender } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.queryByText('User Admin')).not.toBeInTheDocument()

      rerender(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('User Admin')).toBeInTheDocument()
    })

    it('should accept onNavigate callback prop', () => {
      const customNavigate = vi.fn()
      render(
        <Dashboard canAccessAdmin={false} onNavigate={customNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('.MuiCardActionArea-root')
      fireEvent.click(chatCard!)

      expect(customNavigate).toHaveBeenCalledWith('/ai')
    })

    it('should accept onSignOut callback prop', () => {
      const customSignOut = vi.fn()
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={customSignOut} />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(customSignOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sign Out Button', () => {
    it('should render Sign Out button with LogoutIcon', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()
      expect(screen.getByTestId('LogoutIcon')).toBeInTheDocument()
    })

    it('should call onSignOut when Sign Out button is clicked', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(mockOnSignOut).toHaveBeenCalledTimes(1)
    })

    it('should not call onSignOut on initial render', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(mockOnSignOut).not.toHaveBeenCalled()
    })

    it('should call onSignOut multiple times when clicked multiple times', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })

      fireEvent.click(signOutButton)
      fireEvent.click(signOutButton)
      fireEvent.click(signOutButton)

      expect(mockOnSignOut).toHaveBeenCalledTimes(3)
    })
  })
})
