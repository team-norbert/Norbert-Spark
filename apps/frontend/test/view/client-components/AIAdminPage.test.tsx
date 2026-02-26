import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { AIAdminPage } from '@/view/client-components/AIAdminPage.js'
import { PageHeader } from '@/view/client-components/PageHeader.js'

// Mock PageHeader to avoid pulling in MUI icons in unrelated tests
vi.mock('@/view/client-components/PageHeader.js', () => ({
  PageHeader: vi.fn(({ title }: { title: string }) => <div data-testid="page-header">{title}</div>),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeChatType = (overrides: Partial<ChatType> = {}): ChatType => ({
  id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
  name: 'General Assistant',
  seoFriendlyId: 'general-assistant',
  seoFriendlyBase64Id: 'Z2VuZXJhbC1hc3Npc3RhbnQ',
  description: 'A helpful general-purpose AI assistant',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
  rag: false,
  ...overrides,
})

const defaultProps = {
  chatTypes: [makeChatType()] as readonly ChatType[],
  error: null,
  loading: false,
  searchQuery: '',
  paginationModel: { page: 0, pageSize: 10 },
  rowCount: 1,
  onSearchChange: vi.fn(),
  onPaginationChange: vi.fn(),
  onCloseErrorMessage: vi.fn(),
  onNavigateHome: vi.fn(),
  onSignOut: vi.fn(),
  onChangeOptions: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AIAdminPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ── Header ────────────────────────────────────────────────────────────────

  describe('header', () => {
    it('renders the page title via PageHeader', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByTestId('page-header')).toHaveTextContent('AI Chat Configuration')
    })

    it('passes onNavigateHome to PageHeader', () => {
      const MockedPageHeader = vi.mocked(PageHeader)
      const onNavigateHome = vi.fn()
      render(<AIAdminPage {...defaultProps} onNavigateHome={onNavigateHome} />)

      const lastProps = MockedPageHeader.mock.lastCall?.[0]
      expect(lastProps).toMatchObject({ onNavigateHome })
    })

    it('passes onSignOut to PageHeader', () => {
      const MockedPageHeader = vi.mocked(PageHeader)
      const onSignOut = vi.fn()
      render(<AIAdminPage {...defaultProps} onSignOut={onSignOut} />)

      const lastProps = MockedPageHeader.mock.lastCall?.[0]
      expect(lastProps).toMatchObject({ onSignOut })
    })
  })

  // ── Subtitle ──────────────────────────────────────────────────────────────

  describe('subtitle', () => {
    it('renders the subtitle text', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(
        screen.getByText(/view and manage ai chat types and their configurations/i)
      ).toBeInTheDocument()
    })

    it('renders the read-only note at the bottom', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(
        screen.getByText(/this page displays read-only ai chat configuration data/i)
      ).toBeInTheDocument()
    })
  })

  // ── Error alert ───────────────────────────────────────────────────────────

  describe('error alert', () => {
    it('does not render an error alert when error is null', () => {
      render(<AIAdminPage {...defaultProps} error={null} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('renders an error alert when error is set', () => {
      render(<AIAdminPage {...defaultProps} error="Something went wrong" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    })

    it('calls onCloseErrorMessage when the alert close button is clicked', () => {
      const onCloseErrorMessage = vi.fn()
      render(
        <AIAdminPage
          {...defaultProps}
          error="Some error"
          onCloseErrorMessage={onCloseErrorMessage}
        />
      )

      const alert = screen.getByRole('alert')
      const closeButton = within(alert).getByRole('button')
      fireEvent.click(closeButton)

      expect(onCloseErrorMessage).toHaveBeenCalledTimes(1)
    })
  })

  // ── Search field ──────────────────────────────────────────────────────────

  describe('search field', () => {
    it('renders the search field', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByLabelText('Search chat types')).toBeInTheDocument()
    })

    it('displays the current searchQuery value', () => {
      render(<AIAdminPage {...defaultProps} searchQuery="assistant" />)

      expect(screen.getByLabelText('Search chat types')).toHaveValue('assistant')
    })

    it('calls onSearchChange with the new value when the user types', () => {
      const onSearchChange = vi.fn()
      render(<AIAdminPage {...defaultProps} onSearchChange={onSearchChange} />)

      fireEvent.change(screen.getByLabelText('Search chat types'), {
        target: { value: 'code' },
      })

      expect(onSearchChange).toHaveBeenCalledWith('code')
    })

    it('calls onSearchChange with empty string when cleared', () => {
      const onSearchChange = vi.fn()
      render(<AIAdminPage {...defaultProps} searchQuery="code" onSearchChange={onSearchChange} />)

      fireEvent.change(screen.getByLabelText('Search chat types'), {
        target: { value: '' },
      })

      expect(onSearchChange).toHaveBeenCalledWith('')
    })
  })

  // ── DataGrid ──────────────────────────────────────────────────────────────

  describe('DataGrid', () => {
    it('renders the DataGrid', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('renders all expected column headers', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('SEO Friendly ID')).toBeInTheDocument()
      expect(screen.getByText('Base64 ID')).toBeInTheDocument()
      expect(screen.getByText('Created At')).toBeInTheDocument()
      expect(screen.getByText('Updated At')).toBeInTheDocument()
      expect(screen.getByText('Click to change options')).toBeInTheDocument()
    })

    it('displays chat type data in grid cells', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByText('General Assistant')).toBeInTheDocument()
      expect(screen.getByText('general-assistant')).toBeInTheDocument()
      expect(screen.getByText('A helpful general-purpose AI assistant')).toBeInTheDocument()
    })

    it('displays multiple rows', () => {
      const chatTypes = [
        makeChatType(),
        makeChatType({
          id: '01942f8e-0000-0000-0000-000000000002',
          name: 'Code Helper',
          seoFriendlyId: 'code-helper',
          description: 'Programming assistant',
        }),
      ]
      render(<AIAdminPage {...defaultProps} chatTypes={chatTypes} rowCount={2} />)

      expect(screen.getByText('General Assistant')).toBeInTheDocument()
      expect(screen.getByText('Code Helper')).toBeInTheDocument()
    })

    it('formats date columns using toLocaleDateString', () => {
      render(<AIAdminPage {...defaultProps} />)

      const expectedCreatedAt = new Date('2024-01-15T10:30:00Z').toLocaleDateString()
      const expectedUpdatedAt = new Date('2024-01-20T14:45:00Z').toLocaleDateString()

      expect(screen.getByText(expectedCreatedAt)).toBeInTheDocument()
      expect(screen.getByText(expectedUpdatedAt)).toBeInTheDocument()
    })

    it('shows "No rows" when chatTypes is empty', () => {
      render(<AIAdminPage {...defaultProps} chatTypes={[]} rowCount={0} />)

      expect(screen.getByText('No rows')).toBeInTheDocument()
    })

    it('shows a loading progressbar when loading is true', () => {
      render(<AIAdminPage {...defaultProps} loading />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('does not show a loading progressbar when loading is false', () => {
      render(<AIAdminPage {...defaultProps} loading={false} />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  // ── Actions column ────────────────────────────────────────────────────────

  describe('actions column', () => {
    it('renders a Change Options button for each row', () => {
      render(<AIAdminPage {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Change Options' })).toBeInTheDocument()
    })

    it('applies the data-testid derived from the row id', () => {
      const chatType = makeChatType()
      render(<AIAdminPage {...defaultProps} chatTypes={[chatType]} />)

      expect(screen.getByTestId(`change-options-${chatType.id}`)).toBeInTheDocument()
    })

    it('renders one button per row each with a unique data-testid', () => {
      const first = makeChatType()
      const second = makeChatType({
        id: '01942f8e-0000-0000-0000-000000000001',
        name: 'Second Type',
      })
      render(<AIAdminPage {...defaultProps} chatTypes={[first, second]} rowCount={2} />)

      expect(screen.getByTestId(`change-options-${first.id}`)).toBeInTheDocument()
      expect(screen.getByTestId(`change-options-${second.id}`)).toBeInTheDocument()
    })

    it('calls onChangeOptions with the row id when the button is clicked', () => {
      const onChangeOptions = vi.fn()
      const chatType = makeChatType()
      render(
        <AIAdminPage {...defaultProps} chatTypes={[chatType]} onChangeOptions={onChangeOptions} />
      )

      fireEvent.click(screen.getByTestId(`change-options-${chatType.id}`))

      expect(onChangeOptions).toHaveBeenCalledTimes(1)
      expect(onChangeOptions).toHaveBeenCalledWith(chatType.id)
    })

    it('calls onChangeOptions with the correct id for a different chat type', () => {
      const onChangeOptions = vi.fn()
      const chatType = makeChatType({ id: 'abcdef12-0000-0000-0000-000000000099' })
      render(
        <AIAdminPage {...defaultProps} chatTypes={[chatType]} onChangeOptions={onChangeOptions} />
      )

      fireEvent.click(screen.getByTestId(`change-options-${chatType.id}`))

      expect(onChangeOptions).toHaveBeenCalledWith('abcdef12-0000-0000-0000-000000000099')
    })

    it('does not render any Change Options buttons when chatTypes is empty', () => {
      render(<AIAdminPage {...defaultProps} chatTypes={[]} rowCount={0} />)

      expect(screen.queryAllByRole('button', { name: 'Change Options' })).toHaveLength(0)
    })
  })

  // ── Pagination ────────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('renders the DataGrid with the provided paginationModel', () => {
      render(
        <AIAdminPage {...defaultProps} paginationModel={{ page: 0, pageSize: 25 }} rowCount={30} />
      )

      // The grid itself is present; paginationModel is passed through to DataGrid
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })
})
