import { render } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatTypesPageClient } from '@/app/chat-types/ChatTypesPageClient.js'
import { ChatTypesPage } from '@/view/client-components/ChatTypesPage.js'
import { useChatTypesPage } from '@/view/hooks/useChatTypesPage.js'

// Mock next/navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

// Mock the useChatTypesPage hook
vi.mock('@/view/hooks/useChatTypesPage.js', () => ({
  useChatTypesPage: vi.fn(),
}))

// Mock the ChatTypesPage component
vi.mock('@/view/client-components/ChatTypesPage.js', () => ({
  ChatTypesPage: vi.fn((props) => (
    <div data-testid="chat-types-page" data-props={JSON.stringify(props)} />
  )),
}))

describe('ChatTypesPageClient', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }

  const mockChatTypes = [
    {
      id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
      name: 'General Assistant',
      seoFriendlyId: 'general-assistant',
      seoFriendlyBase64Id: 'Z2VuZXJhbC1hc3Npc3RhbnQ=',
      description: 'A helpful general-purpose AI assistant',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
    },
    {
      id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
      name: 'Code Helper',
      seoFriendlyId: 'code-helper',
      seoFriendlyBase64Id: 'Y29kZS1oZWxwZXI=',
      description: 'Specialized in programming assistance',
      createdAt: '2024-01-16T11:30:00Z',
      updatedAt: '2024-01-21T15:45:00Z',
    },
  ]

  const mockHookReturn = {
    chatTypes: mockChatTypes,
    error: null,
    loading: false,
    searchQuery: '',
    paginationModel: { page: 0, pageSize: 10 },
    rowCount: 2,
    handleSearchChange: vi.fn(),
    handlePaginationChange: vi.fn(),
    handleCloseErrorMessage: vi.fn(),
    handleProcessRowUpdate: vi.fn().mockResolvedValue({}),
    handleProcessRowUpdateError: vi.fn(),
    hasQueryError: false,
    confirmDialogOpen: false,
    pendingEdit: null,
    handleConfirmSave: vi.fn(),
    handleCancelSave: vi.fn(),
    savingEdit: false,
    successMessage: null,
    handleCloseSuccessMessage: vi.fn(),
    dialogError: null,
    handleCloseDialogError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useChatTypesPage).mockReturnValue(mockHookReturn)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ChatTypesPageClient />)
      expect(container).toBeInTheDocument()
    })

    it('should render ChatTypesPage component', () => {
      render(<ChatTypesPageClient />)
      expect(ChatTypesPage).toHaveBeenCalledTimes(1)
    })

    it('should call useChatTypesPage hook', () => {
      render(<ChatTypesPageClient />)
      expect(useChatTypesPage).toHaveBeenCalledTimes(1)
    })

    it('should call useRouter hook', () => {
      render(<ChatTypesPageClient />)
      expect(useRouter).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props Passing to ChatTypesPage', () => {
    it('should pass all values from useChatTypesPage hook to ChatTypesPage component', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({
        chatTypes: mockHookReturn.chatTypes,
        error: mockHookReturn.error,
        loading: mockHookReturn.loading,
        searchQuery: mockHookReturn.searchQuery,
        paginationModel: mockHookReturn.paginationModel,
        rowCount: mockHookReturn.rowCount,
        onSearchChange: mockHookReturn.handleSearchChange,
        onPaginationChange: mockHookReturn.handlePaginationChange,
        onCloseErrorMessage: mockHookReturn.handleCloseErrorMessage,
      })
    })

    it('should pass chatTypes data correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.chatTypes).toBe(mockHookReturn.chatTypes)
      expect(props?.chatTypes).toHaveLength(2)
      expect(props?.chatTypes[0]?.name).toBe('General Assistant')
      expect(props?.chatTypes[1]?.name).toBe('Code Helper')
    })

    it('should pass error state correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.error).toBeNull()
    })

    it('should pass loading state correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.loading).toBe(false)
    })

    it('should pass searchQuery correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.searchQuery).toBe('')
    })

    it('should pass paginationModel correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.paginationModel).toEqual({ page: 0, pageSize: 10 })
    })

    it('should pass rowCount correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.rowCount).toBe(2)
    })

    it('should pass callback functions correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.onSearchChange).toBe(mockHookReturn.handleSearchChange)
      expect(props?.onPaginationChange).toBe(mockHookReturn.handlePaginationChange)
      expect(props?.onCloseErrorMessage).toBe(mockHookReturn.handleCloseErrorMessage)
      expect(typeof props?.onNavigateHome).toBe('function')
      expect(typeof props?.onSignOut).toBe('function')
      expect(typeof props?.onChangeOptions).toBe('function')
    })
  })

  describe('Loading State', () => {
    it('should pass loading=true when data is loading', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        chatTypes: [],
        loading: true,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.loading).toBe(true)
      expect(props?.chatTypes).toHaveLength(0)
    })

    it('should handle empty chatTypes array', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        chatTypes: [],
        rowCount: 0,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.chatTypes).toHaveLength(0)
      expect(props?.rowCount).toBe(0)
    })
  })

  describe('Error State', () => {
    it('should pass error message when error occurs', () => {
      const errorMessage = 'Failed to load chat types'
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        error: errorMessage,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.error).toBe(errorMessage)
    })

    it('should handle error with empty chatTypes', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        chatTypes: [],
        error: 'Network error',
        loading: false,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.error).toBe('Network error')
      expect(props?.chatTypes).toHaveLength(0)
      expect(props?.loading).toBe(false)
    })
  })

  describe('Search Functionality', () => {
    it('should pass non-empty searchQuery when user has searched', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        searchQuery: 'general',
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.searchQuery).toBe('general')
    })

    it('should call handleSearchChange from hook', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onSearchChange('test')

      expect(mockHookReturn.handleSearchChange).toHaveBeenCalledWith('test')
      expect(mockHookReturn.handleSearchChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Pagination Functionality', () => {
    it('should pass different paginationModel when page changes', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        paginationModel: { page: 2, pageSize: 25 },
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.paginationModel).toEqual({ page: 2, pageSize: 25 })
    })

    it('should call handlePaginationChange from hook', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      const newPaginationModel = { page: 1, pageSize: 25 }
      props?.onPaginationChange(newPaginationModel)

      expect(mockHookReturn.handlePaginationChange).toHaveBeenCalledWith(newPaginationModel)
      expect(mockHookReturn.handlePaginationChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation Functions', () => {
    it('should navigate to /dashboard when onNavigateHome is called', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onNavigateHome()

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /api/auth/signout when onSignOut is called', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onSignOut()

      expect(mockPush).toHaveBeenCalledWith('/api/auth/signout')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /ai-admin/:id when onChangeOptions is called', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onChangeOptions('some-chat-type-id')

      expect(mockPush).toHaveBeenCalledWith('/ai-admin/some-chat-type-id')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should not call router.push on initial render', () => {
      render(<ChatTypesPageClient />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle multiple navigation calls', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onNavigateHome()
      props?.onSignOut()
      props?.onNavigateHome()

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/dashboard')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/api/auth/signout')
      expect(mockPush).toHaveBeenNthCalledWith(3, '/dashboard')
    })
  })

  describe('Error Closing Functionality', () => {
    it('should call handleCloseErrorMessage from hook', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      props?.onCloseErrorMessage()

      expect(mockHookReturn.handleCloseErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('should pass handleCloseErrorMessage function correctly', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.onCloseErrorMessage).toBe(mockHookReturn.handleCloseErrorMessage)
    })
  })

  describe('Integration with Multiple State Changes', () => {
    it('should handle combined loading and error states', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        loading: true,
        error: 'Loading failed',
        chatTypes: [],
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.loading).toBe(true)
      expect(props?.error).toBe('Loading failed')
      expect(props?.chatTypes).toHaveLength(0)
    })

    it('should handle search query with filtered results', () => {
      const filteredChatTypes = [mockChatTypes[0]] as const
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        chatTypes: filteredChatTypes as any,
        searchQuery: 'general',
        rowCount: 1,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.searchQuery).toBe('general')
      expect(props?.chatTypes).toHaveLength(1)
      expect(props?.rowCount).toBe(1)
      expect(props?.chatTypes[0]?.name).toBe('General Assistant')
    })

    it('should handle pagination with different page sizes', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        paginationModel: { page: 1, pageSize: 50 },
        rowCount: 100,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.paginationModel).toEqual({ page: 1, pageSize: 50 })
      expect(props?.rowCount).toBe(100)
    })
  })

  describe('Component Re-rendering', () => {
    it('should update props when hook returns new values', () => {
      const { rerender } = render(<ChatTypesPageClient />)

      // First render
      let call = vi.mocked(ChatTypesPage).mock.calls[0]
      expect(call?.[0]?.loading).toBe(false)

      // Update mock return value
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        loading: true,
      })

      rerender(<ChatTypesPageClient />)

      // Second render
      call = vi.mocked(ChatTypesPage).mock.calls[1]
      expect(call?.[0]?.loading).toBe(true)
    })

    it('should maintain router instance across re-renders', () => {
      const { rerender } = render(<ChatTypesPageClient />)

      rerender(<ChatTypesPageClient />)
      rerender(<ChatTypesPageClient />)

      // Router should be called once per render
      expect(useRouter).toHaveBeenCalledTimes(3)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve chatTypes data structure', () => {
      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.chatTypes[0]).toHaveProperty('id')
      expect(props?.chatTypes[0]).toHaveProperty('name')
      expect(props?.chatTypes[0]).toHaveProperty('seoFriendlyId')
      expect(props?.chatTypes[0]).toHaveProperty('seoFriendlyBase64Id')
      expect(props?.chatTypes[0]).toHaveProperty('description')
      expect(props?.chatTypes[0]).toHaveProperty('createdAt')
      expect(props?.chatTypes[0]).toHaveProperty('updatedAt')
    })

    it('should handle large rowCount values', () => {
      vi.mocked(useChatTypesPage).mockReturnValue({
        ...mockHookReturn,
        rowCount: 10000,
      })

      render(<ChatTypesPageClient />)

      const call = vi.mocked(ChatTypesPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.rowCount).toBe(10000)
    })
  })
})
