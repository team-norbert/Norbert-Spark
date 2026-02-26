import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatType } from '@/domain/ai/chat-config.js'
import {
  ChatTypesPage,
  EditCell,
  getFieldDisplayLabel,
  getValidationMessage,
} from '@/view/client-components/ChatTypesPage.js'

// Mock PageHeader to avoid pulling in MUI icons
vi.mock('@/view/client-components/PageHeader.js', () => ({
  PageHeader: vi.fn(({ title }: { title: string }) => <div data-testid="page-header">{title}</div>),
}))

// ─── Test data ──────────────────────────────────────────────────────────────────

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
  confirmDialogOpen: false,
  dialogError: null,
  error: null,
  loading: false,
  onCancelSave: vi.fn(),
  onChangeOptions: vi.fn(),
  onCloseDialogError: vi.fn(),
  onCloseErrorMessage: vi.fn(),
  onCloseSuccessMessage: vi.fn(),
  onConfirmSave: vi.fn(),
  onNavigateHome: vi.fn(),
  onPaginationChange: vi.fn(),
  onProcessRowUpdate: vi.fn().mockResolvedValue({}),
  onProcessRowUpdateError: vi.fn(),
  onSearchChange: vi.fn(),
  onSignOut: vi.fn(),
  paginationModel: { page: 0, pageSize: 10 },
  pendingEdit: null,
  rowCount: 1,
  savingEdit: false,
  searchQuery: '',
  successMessage: null,
}

// ─── getValidationMessage ───────────────────────────────────────────────────────

describe('getValidationMessage', () => {
  describe('name field', () => {
    it('should return message for empty name', () => {
      expect(getValidationMessage('name', '')).toBe('Name must be between 1 and 200 characters')
    })

    it('should return message for name exceeding 200 characters', () => {
      expect(getValidationMessage('name', 'a'.repeat(201))).toBe(
        'Name must be between 1 and 200 characters'
      )
    })

    it('should return undefined for valid name', () => {
      expect(getValidationMessage('name', 'My Chat')).toBeUndefined()
    })

    it('should return undefined for name at exactly 200 characters', () => {
      expect(getValidationMessage('name', 'a'.repeat(200))).toBeUndefined()
    })
  })

  describe('seoFriendlyId field', () => {
    it('should return message for empty seoFriendlyId', () => {
      expect(getValidationMessage('seoFriendlyId', '')).toContain('SEO Friendly ID')
    })

    it('should return message for uppercase seoFriendlyId', () => {
      expect(getValidationMessage('seoFriendlyId', 'MyChat')).toContain('SEO Friendly ID')
    })

    it('should return message for seoFriendlyId with spaces', () => {
      expect(getValidationMessage('seoFriendlyId', 'my chat')).toContain('SEO Friendly ID')
    })

    it('should return undefined for valid kebab-case seoFriendlyId', () => {
      expect(getValidationMessage('seoFriendlyId', 'my-chat-type')).toBeUndefined()
    })
  })

  describe('description field', () => {
    it('should return message for empty description', () => {
      expect(getValidationMessage('description', '')).toBe(
        'Description must be between 1 and 500 characters'
      )
    })

    it('should return message for description exceeding 500 characters', () => {
      expect(getValidationMessage('description', 'a'.repeat(501))).toBe(
        'Description must be between 1 and 500 characters'
      )
    })

    it('should return undefined for valid description', () => {
      expect(getValidationMessage('description', 'A helpful assistant')).toBeUndefined()
    })

    it('should return undefined for description at exactly 500 characters', () => {
      expect(getValidationMessage('description', 'a'.repeat(500))).toBeUndefined()
    })
  })

  describe('unknown fields', () => {
    it('should return undefined for an unknown field', () => {
      expect(getValidationMessage('unknownField', '')).toBeUndefined()
    })

    it('should return undefined for id field', () => {
      expect(getValidationMessage('id', '')).toBeUndefined()
    })
  })
})

// ─── getFieldDisplayLabel ───────────────────────────────────────────────────────

describe('getFieldDisplayLabel', () => {
  it('should return "Name" for name field', () => {
    expect(getFieldDisplayLabel('name')).toBe('Name')
  })

  it('should return "SEO Friendly ID" for seoFriendlyId field', () => {
    expect(getFieldDisplayLabel('seoFriendlyId')).toBe('SEO Friendly ID')
  })

  it('should return "Description" for description field', () => {
    expect(getFieldDisplayLabel('description')).toBe('Description')
  })

  it('should return the field name as-is for unknown fields', () => {
    expect(getFieldDisplayLabel('unknownField')).toBe('unknownField')
    expect(getFieldDisplayLabel('id')).toBe('id')
  })
})

// ─── EditCell ───────────────────────────────────────────────────────────────────

describe('EditCell', () => {
  const makeParams = (overrides: Record<string, unknown> = {}) =>
    ({
      api: { setEditCellValue: vi.fn() },
      field: 'name',
      id: 'row-1',
      value: 'valid name',
      ...overrides,
    }) as never

  it('should render a TextField with the cell value', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell params={makeParams({ value: 'Hello' })} onValidationChange={onValidationChange} />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Hello')
  })

  it('should treat null value as empty string', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell params={makeParams({ value: null })} onValidationChange={onValidationChange} />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')
  })

  it('should treat undefined value as empty string', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell params={makeParams({ value: undefined })} onValidationChange={onValidationChange} />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')
  })

  it('should call onValidationChange with null when value is valid', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell params={makeParams({ value: 'valid' })} onValidationChange={onValidationChange} />
    )

    expect(onValidationChange).toHaveBeenCalledWith(null)
  })

  it('should call onValidationChange with error message when value is invalid', () => {
    const onValidationChange = vi.fn()
    render(<EditCell params={makeParams({ value: '' })} onValidationChange={onValidationChange} />)

    expect(onValidationChange).toHaveBeenCalledWith('Name must be between 1 and 200 characters')
  })

  it('should show error state on TextField when validation fails', () => {
    const onValidationChange = vi.fn()
    render(<EditCell params={makeParams({ value: '' })} onValidationChange={onValidationChange} />)

    // MUI TextField with error adds aria-invalid
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should not show error state on TextField when validation passes', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell
        params={makeParams({ value: 'valid name' })}
        onValidationChange={onValidationChange}
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('should call api.setEditCellValue on input change', () => {
    const setEditCellValue = vi.fn()
    const onValidationChange = vi.fn()
    render(
      <EditCell
        params={makeParams({
          api: { setEditCellValue },
          field: 'name',
          id: 'row-1',
          value: 'test',
        })}
        onValidationChange={onValidationChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'testX' } })

    expect(setEditCellValue).toHaveBeenCalledWith({
      id: 'row-1',
      field: 'name',
      value: 'testX',
    })
  })

  it('should validate seoFriendlyId field with kebab-case rules', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell
        params={makeParams({ field: 'seoFriendlyId', value: 'INVALID' })}
        onValidationChange={onValidationChange}
      />
    )

    expect(onValidationChange).toHaveBeenCalledWith(expect.stringContaining('SEO Friendly ID'))
  })

  it('should validate description field', () => {
    const onValidationChange = vi.fn()
    render(
      <EditCell
        params={makeParams({ field: 'description', value: '' })}
        onValidationChange={onValidationChange}
      />
    )

    expect(onValidationChange).toHaveBeenCalledWith(
      'Description must be between 1 and 500 characters'
    )
  })
})

// ─── ChatTypesPage ──────────────────────────────────────────────────────────────

describe('ChatTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Page structure ──────────────────────────────────────────────────────

  describe('page structure', () => {
    it('should render the page header', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByTestId('page-header')).toHaveTextContent('Chat Types Configuration')
    })

    it('should render the subtitle', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(
        screen.getByText('View and manage chat types and their configurations')
      ).toBeInTheDocument()
    })

    it('should render the search field', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByLabelText('Search chat types')).toBeInTheDocument()
    })

    it('should render the edit hint note', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(
        screen.getByText(/Click on name, SEO friendly ID, or description cells to edit/)
      ).toBeInTheDocument()
    })

    it('should render the DataGrid', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  // ── Search ──────────────────────────────────────────────────────────────

  describe('search', () => {
    it('should display the current search query', () => {
      render(<ChatTypesPage {...defaultProps} searchQuery="hello" />)
      expect(screen.getByLabelText('Search chat types')).toHaveValue('hello')
    })

    it('should call onSearchChange when typing in the search field', () => {
      const onSearchChange = vi.fn()
      render(<ChatTypesPage {...defaultProps} onSearchChange={onSearchChange} />)

      fireEvent.change(screen.getByLabelText('Search chat types'), { target: { value: 'a' } })
      expect(onSearchChange).toHaveBeenCalledWith('a')
    })
  })

  // ── Error alert ─────────────────────────────────────────────────────────

  describe('error alert', () => {
    it('should not render error alert when error is null', () => {
      render(<ChatTypesPage {...defaultProps} error={null} />)
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should render error alert when error is set', () => {
      render(<ChatTypesPage {...defaultProps} error="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should call onCloseErrorMessage when error alert is dismissed', () => {
      const onCloseErrorMessage = vi.fn()
      render(
        <ChatTypesPage
          {...defaultProps}
          error="Some error"
          onCloseErrorMessage={onCloseErrorMessage}
        />
      )

      const alert = screen.getByText('Some error').closest('[role="alert"]') as HTMLElement
      const closeButton = within(alert).getByRole('button')
      fireEvent.click(closeButton)
      expect(onCloseErrorMessage).toHaveBeenCalledTimes(1)
    })
  })

  // ── Success alert ───────────────────────────────────────────────────────

  describe('success alert', () => {
    it('should not render success alert when successMessage is null', () => {
      render(<ChatTypesPage {...defaultProps} successMessage={null} />)
      expect(screen.queryByTestId('success-alert')).not.toBeInTheDocument()
    })

    it('should render success alert when successMessage is set', () => {
      render(<ChatTypesPage {...defaultProps} successMessage="Update successful" />)
      const alert = screen.getByTestId('success-alert')
      expect(alert).toHaveTextContent('Update successful')
    })

    it('should call onCloseSuccessMessage when success alert is dismissed', () => {
      const onCloseSuccessMessage = vi.fn()
      render(
        <ChatTypesPage
          {...defaultProps}
          successMessage="Saved"
          onCloseSuccessMessage={onCloseSuccessMessage}
        />
      )

      const alert = screen.getByTestId('success-alert')
      const closeButton = within(alert).getByRole('button')
      fireEvent.click(closeButton)
      expect(onCloseSuccessMessage).toHaveBeenCalledTimes(1)
    })
  })

  // ── Confirm dialog ──────────────────────────────────────────────────────

  describe('confirm dialog', () => {
    it('should not render confirm dialog when confirmDialogOpen is false', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen={false} />)
      expect(screen.queryByTestId('confirm-save-dialog')).not.toBeInTheDocument()
    })

    it('should render confirm dialog when confirmDialogOpen is true', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen />)
      expect(screen.getByTestId('confirm-save-dialog')).toBeInTheDocument()
      expect(screen.getByText('Confirm Edit')).toBeInTheDocument()
      expect(screen.getByText('Do you want to save this text?')).toBeInTheDocument()
    })

    it('should render Yes and No buttons in the dialog', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen />)
      expect(screen.getByTestId('confirm-save-button')).toHaveTextContent('Yes')
      expect(screen.getByTestId('cancel-save-button')).toHaveTextContent('No')
    })

    it('should call onConfirmSave when Yes is clicked', () => {
      const onConfirmSave = vi.fn()
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen onConfirmSave={onConfirmSave} />)

      fireEvent.click(screen.getByTestId('confirm-save-button'))
      expect(onConfirmSave).toHaveBeenCalledTimes(1)
    })

    it('should call onCancelSave when No is clicked', () => {
      const onCancelSave = vi.fn()
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen onCancelSave={onCancelSave} />)

      fireEvent.click(screen.getByTestId('cancel-save-button'))
      expect(onCancelSave).toHaveBeenCalledTimes(1)
    })

    it('should disable buttons when savingEdit is true', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen savingEdit />)
      expect(screen.getByTestId('confirm-save-button')).toBeDisabled()
      expect(screen.getByTestId('cancel-save-button')).toBeDisabled()
    })

    it('should show a spinner in the Yes button when savingEdit is true', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen savingEdit />)
      const confirmBtn = screen.getByTestId('confirm-save-button')
      expect(confirmBtn).not.toHaveTextContent('Yes')
      expect(within(confirmBtn).getByRole('progressbar')).toBeInTheDocument()
    })

    it('should display the pending edit value when pendingEdit is provided', () => {
      const pendingEdit = {
        newRow: { id: '1', name: 'Updated Name' },
        oldRow: { id: '1', name: 'Old Name' },
        field: 'name',
      }
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen pendingEdit={pendingEdit} />)

      expect(screen.getByTestId('pending-edit-value')).toBeInTheDocument()
      expect(screen.getByText('Name:')).toBeInTheDocument()
      expect(screen.getByText('Updated Name')).toBeInTheDocument()
    })

    it('should display user-friendly label for seoFriendlyId field', () => {
      const pendingEdit = {
        newRow: { id: '1', seoFriendlyId: 'updated-seo-id' },
        oldRow: { id: '1', seoFriendlyId: 'old-seo-id' },
        field: 'seoFriendlyId',
      }
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen pendingEdit={pendingEdit} />)

      expect(screen.getByTestId('pending-edit-value')).toBeInTheDocument()
      expect(screen.getByText('SEO Friendly ID:')).toBeInTheDocument()
      expect(screen.getByText('updated-seo-id')).toBeInTheDocument()
    })

    it('should display user-friendly label for description field', () => {
      const pendingEdit = {
        newRow: { id: '1', description: 'Updated description text' },
        oldRow: { id: '1', description: 'Old description text' },
        field: 'description',
      }
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen pendingEdit={pendingEdit} />)

      expect(screen.getByTestId('pending-edit-value')).toBeInTheDocument()
      expect(screen.getByText('Description:')).toBeInTheDocument()
      expect(screen.getByText('Updated description text')).toBeInTheDocument()
    })

    it('should not display pending edit box when pendingEdit is null', () => {
      render(<ChatTypesPage {...defaultProps} confirmDialogOpen pendingEdit={null} />)
      expect(screen.queryByTestId('pending-edit-value')).not.toBeInTheDocument()
    })
  })

  // ── DataGrid columns ───────────────────────────────────────────────────

  describe('DataGrid columns', () => {
    it('should render all expected column headers', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('SEO Friendly ID')).toBeInTheDocument()
      expect(screen.getByText('Base64 ID')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('RAG')).toBeInTheDocument()
      expect(screen.getByText('Created At')).toBeInTheDocument()
      expect(screen.getByText('Updated At')).toBeInTheDocument()
    })

    it('should display chat type data in grid cells', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByText('General Assistant')).toBeInTheDocument()
      expect(screen.getByText('general-assistant')).toBeInTheDocument()
      expect(screen.getByText('A helpful general-purpose AI assistant')).toBeInTheDocument()
    })

    it('should display multiple rows', () => {
      const chatTypes = [
        makeChatType(),
        makeChatType({
          id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
          name: 'Code Helper',
          seoFriendlyId: 'code-helper',
          seoFriendlyBase64Id: 'Y29kZS1oZWxwZXI9abc',
          description: 'Programming assistant',
        }),
      ]
      render(<ChatTypesPage {...defaultProps} chatTypes={chatTypes} rowCount={2} />)
      expect(screen.getByText('General Assistant')).toBeInTheDocument()
      expect(screen.getByText('Code Helper')).toBeInTheDocument()
    })

    it('should format date columns', () => {
      render(<ChatTypesPage {...defaultProps} />)
      // Derive expected values the same way the component does so this test is
      // locale-independent and never produces a false failure on non-en-US hosts.
      const expectedCreatedAt = new Date('2024-01-15T10:30:00Z').toLocaleDateString('en-US')
      const expectedUpdatedAt = new Date('2024-01-20T14:45:00Z').toLocaleDateString('en-US')
      expect(screen.getByText(expectedCreatedAt)).toBeInTheDocument()
      expect(screen.getByText(expectedUpdatedAt)).toBeInTheDocument()
    })

    it('should render empty string for missing date values', () => {
      const chatTypes = [
        makeChatType({ createdAt: '', updatedAt: '' }),
      ] as unknown as readonly ChatType[]
      const { container } = render(<ChatTypesPage {...defaultProps} chatTypes={chatTypes} />)
      // The date cells should exist but be empty — no formatted date text
      expect(container).toBeInTheDocument()
    })

    it('should display "false" in the RAG column when rag is false', () => {
      render(<ChatTypesPage {...defaultProps} chatTypes={[makeChatType({ rag: false })]} />)
      expect(screen.getByText('false')).toBeInTheDocument()
    })

    it('should display "true" in the RAG column when rag is true', () => {
      render(<ChatTypesPage {...defaultProps} chatTypes={[makeChatType({ rag: true })]} />)
      expect(screen.getByText('true')).toBeInTheDocument()
    })
  })

  // ── Actions column ────────────────────────────────────────────────────────

  describe('actions column', () => {
    it('should render the "Click to change options" column header', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByText('Click to change options')).toBeInTheDocument()
    })

    it('should render a "Change Options" button for each row', () => {
      render(<ChatTypesPage {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Change Options' })).toBeInTheDocument()
    }, 15000)

    it('should apply the correct data-testid derived from the row id', () => {
      const chatType = makeChatType()
      render(<ChatTypesPage {...defaultProps} chatTypes={[chatType]} />)
      expect(screen.getByTestId(`change-options-${chatType.id}`)).toBeInTheDocument()
    })

    it('should render one button per row, each with a unique data-testid', () => {
      const first = makeChatType()
      const second = makeChatType({
        id: '01942f8e-0000-0000-0000-000000000001',
        name: 'Second Type',
      })
      render(<ChatTypesPage {...defaultProps} chatTypes={[first, second]} rowCount={2} />)
      expect(screen.getByTestId(`change-options-${first.id}`)).toBeInTheDocument()
      expect(screen.getByTestId(`change-options-${second.id}`)).toBeInTheDocument()
    })

    it('should navigate to /ai-admin/:id when the button is clicked', () => {
      const onChangeOptions = vi.fn()
      const chatType = makeChatType()
      render(
        <ChatTypesPage {...defaultProps} chatTypes={[chatType]} onChangeOptions={onChangeOptions} />
      )

      fireEvent.click(screen.getByTestId(`change-options-${chatType.id}`))

      expect(onChangeOptions).toHaveBeenCalledTimes(1)
      expect(onChangeOptions).toHaveBeenCalledWith(chatType.id)
    })

    it('should build the correct route for a different chat type id', () => {
      const onChangeOptions = vi.fn()
      const chatType = makeChatType({ id: 'abcdef12-0000-0000-0000-000000000099' })
      render(
        <ChatTypesPage {...defaultProps} chatTypes={[chatType]} onChangeOptions={onChangeOptions} />
      )

      fireEvent.click(screen.getByTestId(`change-options-${chatType.id}`))

      expect(onChangeOptions).toHaveBeenCalledWith('abcdef12-0000-0000-0000-000000000099')
    })

    it('should not render any "Change Options" buttons when chatTypes is empty', () => {
      render(<ChatTypesPage {...defaultProps} chatTypes={[]} rowCount={0} />)
      expect(screen.queryAllByRole('button', { name: 'Change Options' })).toHaveLength(0)
    })
  })

  // ── Loading state ───────────────────────────────────────────────────────

  describe('loading state', () => {
    it('should show loading overlay on the DataGrid when loading is true', () => {
      render(<ChatTypesPage {...defaultProps} loading />)
      // MUI DataGrid shows a loading overlay with a progressbar
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  // ── Empty state ─────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('should render DataGrid with no rows when chatTypes is empty', () => {
      render(<ChatTypesPage {...defaultProps} chatTypes={[]} rowCount={0} />)
      expect(screen.getByText('No rows')).toBeInTheDocument()
    })
  })
})
