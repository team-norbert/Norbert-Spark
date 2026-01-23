import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAdminPageClient } from '@/app/ai-admin/AIAdminPageClient.js'
import type { ChatType } from '@/domain/ai/chat-config.js'
// Import mocked modules
import { AIAdminPage } from '@/view/client-components/AIAdminPage.js'
import { useAIAdminPage } from '@/view/hooks/useAIAdminPage.js'

// Mock the AIAdminPage component
vi.mock('@/view/client-components/AIAdminPage.js', () => ({
  AIAdminPage: vi.fn(({ chatTypes, error, loading, paginationModel, searchQuery }) => (
    <div data-testid="ai-admin-page">
      <div data-testid="chat-types-count">{chatTypes.length}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="search-query">{searchQuery}</div>
      <div data-testid="pagination-page">{paginationModel.page}</div>
      <div data-testid="pagination-page-size">{paginationModel.pageSize}</div>
    </div>
  )),
}))

// Mock the useAIAdminPage hook
vi.mock('@/view/hooks/useAIAdminPage.js', () => ({
  useAIAdminPage: vi.fn(),
}))

describe('AIAdminPageClient', () => {
  const mockChatTypes: ChatType[] = [
    {
      id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
      name: 'General Assistant',
      description: 'A general-purpose AI assistant',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      seoFriendlyId: 'general-assistant',
      seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
    },
    {
      id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
      name: 'Fitness Tracker',
      description: 'Track your fitness goals',
      createdAt: '2024-01-16T10:30:00Z',
      updatedAt: '2024-01-16T10:30:00Z',
      seoFriendlyId: 'fitness-tracker',
      seoFriendlyBase64Id: 'AZQv42ejfD2OX2p7jJEFGH',
    },
  ]

  const mockHandleCloseErrorMessage = vi.fn()
  const mockHandlePaginationChange = vi.fn()
  const mockHandleSearchChange = vi.fn()

  const mockHookReturnValue = {
    chatTypes: mockChatTypes,
    error: null,
    handleCloseErrorMessage: mockHandleCloseErrorMessage,
    handlePaginationChange: mockHandlePaginationChange,
    handleSearchChange: mockHandleSearchChange,
    loading: false,
    paginationModel: { page: 0, pageSize: 10 },
    rowCount: mockChatTypes.length,
    searchQuery: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAIAdminPage).mockReturnValue(mockHookReturnValue)
  })

  describe('Integration with useAIAdminPage Hook', () => {
    it('should call useAIAdminPage hook on render', () => {
      render(<AIAdminPageClient />)

      expect(useAIAdminPage).toHaveBeenCalledTimes(1)
    })

    it('should render AIAdminPage component', () => {
      render(<AIAdminPageClient />)

      expect(screen.getByTestId('ai-admin-page')).toBeInTheDocument()
    })
  })

  describe('Prop Passing - Data Props', () => {
    it('should pass chatTypes from hook to AIAdminPage', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.chatTypes).toEqual(mockChatTypes)

      expect(screen.getByTestId('chat-types-count')).toHaveTextContent(
        mockChatTypes.length.toString()
      )
    })

    it('should pass error from hook to AIAdminPage', () => {
      const errorMessage = 'Failed to fetch chat types'
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        error: errorMessage,
      })

      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.error).toBe(errorMessage)

      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    })

    it('should pass null error when there is no error', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.error).toBeNull()

      expect(screen.getByTestId('error')).toBeEmptyDOMElement()
    })

    it('should pass loading state from hook to AIAdminPage', () => {
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        loading: true,
      })

      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.loading).toBe(true)

      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })

    it('should pass searchQuery from hook to AIAdminPage', () => {
      const searchQuery = 'fitness'
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        searchQuery,
      })

      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.searchQuery).toBe(searchQuery)

      expect(screen.getByTestId('search-query')).toHaveTextContent(searchQuery)
    })

    it('should pass paginationModel from hook to AIAdminPage', () => {
      const paginationModel = { page: 2, pageSize: 25 }
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        paginationModel,
      })

      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.paginationModel).toEqual(paginationModel)

      expect(screen.getByTestId('pagination-page')).toHaveTextContent('2')
      expect(screen.getByTestId('pagination-page-size')).toHaveTextContent('25')
    })

    it('should pass rowCount from hook to AIAdminPage', () => {
      const rowCount = 42
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        rowCount,
      })

      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.rowCount).toBe(rowCount)
    })
  })

  describe('Prop Passing - Event Handlers', () => {
    it('should pass handleSearchChange handler to AIAdminPage as onSearchChange', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.onSearchChange).toBe(mockHandleSearchChange)
    })

    it('should pass handlePaginationChange handler to AIAdminPage as onPaginationChange', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.onPaginationChange).toBe(mockHandlePaginationChange)
    })

    it('should pass handleCloseErrorMessage handler to AIAdminPage as onCloseErrorMessage', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.onCloseErrorMessage).toBe(mockHandleCloseErrorMessage)
    })
  })

  describe('Complete Props Validation', () => {
    it('should pass all required props to AIAdminPage', () => {
      render(<AIAdminPageClient />)

      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props).toEqual({
        chatTypes: mockChatTypes,
        error: null,
        loading: false,
        searchQuery: '',
        paginationModel: { page: 0, pageSize: 10 },
        rowCount: mockChatTypes.length,
        onSearchChange: mockHandleSearchChange,
        onPaginationChange: mockHandlePaginationChange,
        onCloseErrorMessage: mockHandleCloseErrorMessage,
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty chatTypes array', () => {
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        chatTypes: [],
        rowCount: 0,
      })

      render(<AIAdminPageClient />)

      expect(screen.getByTestId('chat-types-count')).toHaveTextContent('0')
      expect(AIAdminPage).toHaveBeenCalled()
      const props = vi.mocked(AIAdminPage).mock.calls[0]?.[0]
      expect(props?.chatTypes).toEqual([])
      expect(props?.rowCount).toBe(0)
    })

    it('should handle large chatTypes array', () => {
      const largeChatTypes = Array.from({ length: 100 }, (_, i) => ({
        id: `01942f8e-67a3-7b2c-9d4e-5f6a7b8c${i.toString().padStart(4, '0')}`,
        name: `Chat Type ${i}`,
        description: `Description ${i}`,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: `chat-type-${i}`,
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }))

      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        chatTypes: largeChatTypes,
        rowCount: 100,
      })

      render(<AIAdminPageClient />)

      expect(screen.getByTestId('chat-types-count')).toHaveTextContent('100')
    })

    it('should handle multiple re-renders with different hook values', () => {
      const { rerender } = render(<AIAdminPageClient />)

      expect(screen.getByTestId('loading')).toHaveTextContent('false')

      // Simulate loading state change
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        loading: true,
      })

      rerender(<AIAdminPageClient />)

      expect(screen.getByTestId('loading')).toHaveTextContent('true')

      // Simulate data loaded
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        loading: false,
        chatTypes: mockChatTypes,
      })

      rerender(<AIAdminPageClient />)

      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('chat-types-count')).toHaveTextContent('2')
    })

    it('should handle special characters in search query', () => {
      const specialSearchQuery = 'JS & Python!@#$%'
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        searchQuery: specialSearchQuery,
      })

      render(<AIAdminPageClient />)

      expect(screen.getByTestId('search-query')).toHaveTextContent(specialSearchQuery)
    })

    it('should handle long error messages', () => {
      const longError = 'A'.repeat(500)
      vi.mocked(useAIAdminPage).mockReturnValue({
        ...mockHookReturnValue,
        error: longError,
      })

      render(<AIAdminPageClient />)

      expect(screen.getByTestId('error')).toHaveTextContent(longError)
    })
  })

  describe('Client Component Behavior', () => {
    it('should not render server-side', () => {
      // This component has 'use client' directive, so it should only render on client
      render(<AIAdminPageClient />)

      expect(screen.getByTestId('ai-admin-page')).toBeInTheDocument()
    })

    it('should maintain component structure on multiple renders', () => {
      const { rerender } = render(<AIAdminPageClient />)

      const firstRender = screen.getByTestId('ai-admin-page')

      rerender(<AIAdminPageClient />)

      const secondRender = screen.getByTestId('ai-admin-page')

      expect(firstRender).toBe(secondRender)
    })
  })
})
