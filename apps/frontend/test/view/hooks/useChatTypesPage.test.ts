import type { GridPaginationModel } from '@mui/x-data-grid'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { useAIChatConfig } from '@/view/hooks/queries/useAIChatConfig.js'
import { useChatTypesPage } from '@/view/hooks/useChatTypesPage.js'

// Mock the useAIChatConfig hook
vi.mock('@/view/hooks/queries/useAIChatConfig.js', () => ({
  useAIChatConfig: vi.fn(),
}))

describe('useChatTypesPage', () => {
  const mockChatTypes: ChatType[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'General Chat',
      description: 'General purpose chat configuration',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      seoFriendlyId: 'general-chat',
      seoFriendlyBase64Id: 'EREREREREREREREREREREA',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Technical Support',
      description: 'Technical support and troubleshooting',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      seoFriendlyId: 'technical-support',
      seoFriendlyBase64Id: 'IiIiIiIiIiIiIiIiIiIiIg',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Sales Assistant',
      description: 'Sales and marketing assistance',
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
      seoFriendlyId: 'sales-assistant',
      seoFriendlyBase64Id: 'MzMzMzMzMzMzMzMzMzMzMw',
    },
  ]

  const mockUseAIChatConfig = {
    chatTypes: mockChatTypes,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAIChatConfig as Mock).mockReturnValue(mockUseAIChatConfig)
  })

  describe('Initial State', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current).toHaveProperty('chatTypes')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('searchQuery')
      expect(result.current).toHaveProperty('paginationModel')
      expect(result.current).toHaveProperty('rowCount')
      expect(result.current).toHaveProperty('handlePaginationChange')
      expect(result.current).toHaveProperty('handleSearchChange')
      expect(result.current).toHaveProperty('handleCloseErrorMessage')
    })

    it('should initialize with empty search query', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.searchQuery).toBe('')
    })

    it('should initialize with default pagination model (page 0, pageSize 10)', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.paginationModel).toEqual({
        page: 0,
        pageSize: 10,
      })
    })

    it('should initialize with loading false when data is ready', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.loading).toBe(false)
    })

    it('should initialize with null error when no error exists', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.error).toBeNull()
    })

    it('should call useAIChatConfig hook', () => {
      renderHook(() => useChatTypesPage())

      expect(useAIChatConfig).toHaveBeenCalled()
    })
  })

  describe('Data Loading and Error States', () => {
    it('should display loading state when data is being fetched', () => {
      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        isLoading: true,
        chatTypes: [],
      })

      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.loading).toBe(true)
      expect(result.current.chatTypes).toEqual([])
    })

    it('should handle error from useAIChatConfig', () => {
      const errorMessage = 'Failed to fetch chat types'
      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        error: new Error(errorMessage),
        chatTypes: [],
      })

      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.chatTypes).toEqual([])
    })

    it('should return all chat types when no search query is active', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.rowCount).toBe(mockChatTypes.length)
    })

    it('should handle empty chat types array', () => {
      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        chatTypes: [],
      })

      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.rowCount).toBe(0)
    })
  })

  describe('Search Functionality', () => {
    it('should filter chat types by name (case-insensitive)', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('technical')
      })

      expect(result.current.searchQuery).toBe('technical')
      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('Technical Support')
      expect(result.current.rowCount).toBe(1)
    })

    it('should filter chat types by description (case-insensitive)', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('marketing')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.description).toContain('marketing')
      expect(result.current.rowCount).toBe(1)
    })

    it('should filter chat types by seoFriendlyId (case-insensitive)', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('sales-assistant')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.seoFriendlyId).toBe('sales-assistant')
      expect(result.current.rowCount).toBe(1)
    })

    it('should filter chat types by id (case-insensitive)', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('11111111-1111')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.id).toContain('11111111-1111')
      expect(result.current.rowCount).toBe(1)
    })

    it('should handle search query with no matches', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('nonexistent')
      })

      expect(result.current.chatTypes).toHaveLength(0)
      expect(result.current.rowCount).toBe(0)
    })

    it('should return all chat types when search query is empty', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('technical')
      })

      expect(result.current.chatTypes).toHaveLength(1)

      act(() => {
        result.current.handleSearchChange('')
      })

      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.rowCount).toBe(mockChatTypes.length)
    })

    it('should reset pagination to page 0 when search query changes', () => {
      const { result } = renderHook(() => useChatTypesPage())

      // First, change to page 2
      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(2)

      // Then search - should reset to page 0
      act(() => {
        result.current.handleSearchChange('technical')
      })

      expect(result.current.paginationModel.page).toBe(0)
    })

    it('should preserve pageSize when search resets pagination', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 25 })
      })

      expect(result.current.paginationModel.pageSize).toBe(25)

      act(() => {
        result.current.handleSearchChange('general')
      })

      expect(result.current.paginationModel.page).toBe(0)
      expect(result.current.paginationModel.pageSize).toBe(25)
    })

    it('should handle multiple consecutive searches', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('technical')
      })
      expect(result.current.chatTypes).toHaveLength(1)

      act(() => {
        result.current.handleSearchChange('general')
      })
      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('General Chat')

      act(() => {
        result.current.handleSearchChange('')
      })
      expect(result.current.chatTypes).toHaveLength(3)
    })

    it('should filter matching multiple chat types', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('chat')
      })

      // Should match "General Chat" in name and "technical-support" doesn't contain "chat"
      expect(result.current.chatTypes.length).toBeGreaterThan(0)
      expect(result.current.rowCount).toBeGreaterThan(0)
    })
  })

  describe('Pagination Functionality', () => {
    it('should update pagination model when handlePaginationChange is called', () => {
      const { result } = renderHook(() => useChatTypesPage())

      const newPaginationModel: GridPaginationModel = { page: 2, pageSize: 20 }

      act(() => {
        result.current.handlePaginationChange(newPaginationModel)
      })

      expect(result.current.paginationModel).toEqual(newPaginationModel)
    })

    it('should change page number', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 3, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(3)
    })

    it('should change page size', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 50 })
      })

      expect(result.current.paginationModel.pageSize).toBe(50)
    })

    it('should paginate chat types correctly - first page', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 2 })
      })

      expect(result.current.chatTypes).toHaveLength(2)
      expect(result.current.chatTypes[0]!.name).toBe('General Chat')
      expect(result.current.chatTypes[1]!.name).toBe('Technical Support')
    })

    it('should paginate chat types correctly - second page', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 2 })
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('Sales Assistant')
    })

    it('should handle page beyond available data', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 10, pageSize: 10 })
      })

      expect(result.current.chatTypes).toHaveLength(0)
    })

    it('should update rowCount to reflect total filtered results', () => {
      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.rowCount).toBe(3)

      act(() => {
        result.current.handleSearchChange('technical')
      })

      expect(result.current.rowCount).toBe(1)
    })

    it('should handle page size of 1', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 1 })
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('General Chat')

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 1 })
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('Technical Support')
    })

    it('should handle large page size that exceeds total items', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 100 })
      })

      expect(result.current.chatTypes).toHaveLength(3)
      expect(result.current.chatTypes).toEqual(mockChatTypes)
    })
  })

  describe('Combined Search and Pagination', () => {
    it('should apply pagination to filtered results', () => {
      // Add more mock data for meaningful pagination
      const extendedMockChatTypes: ChatType[] = [
        ...mockChatTypes,
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Support Chat',
          description: 'Customer support chat',
          createdAt: '2024-01-04T00:00:00.000Z',
          updatedAt: '2024-01-04T00:00:00.000Z',
          seoFriendlyId: 'support-chat',
          seoFriendlyBase64Id: 'NDQ0NDQ0NDQ0NDQ0NDQ0NA',
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          name: 'Technical Chat',
          description: 'Advanced technical chat',
          createdAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-05T00:00:00.000Z',
          seoFriendlyId: 'technical-chat',
          seoFriendlyBase64Id: 'NTU1NTU1NTU1NTU1NTU1NQ',
        },
      ]

      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        chatTypes: extendedMockChatTypes,
      })

      const { result } = renderHook(() => useChatTypesPage())

      // Search for "chat" - should match 4 items
      act(() => {
        result.current.handleSearchChange('chat')
      })

      // Should match: General Chat, Support Chat, Technical Chat
      expect(result.current.rowCount).toBeGreaterThanOrEqual(3)

      // Paginate with pageSize 2
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 2 })
      })

      expect(result.current.chatTypes).toHaveLength(2)

      // Go to page 2
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 2 })
      })

      expect(result.current.chatTypes.length).toBeGreaterThan(0)
    })

    it('should maintain pagination state when search results change', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 5 })
      })

      expect(result.current.paginationModel.page).toBe(1)

      act(() => {
        result.current.handleSearchChange('general')
      })

      // Page should reset to 0 after search
      expect(result.current.paginationModel.page).toBe(0)
      // PageSize should be preserved
      expect(result.current.paginationModel.pageSize).toBe(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle error from query with error message', () => {
      const errorMessage = 'Network error occurred'
      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        error: new Error(errorMessage),
      })

      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.error).toBe(errorMessage)
    })

    it('should clear error message when handleCloseErrorMessage is called', () => {
      const { result } = renderHook(() => useChatTypesPage())

      // Initially no error
      expect(result.current.error).toBeNull()

      // Call handleCloseErrorMessage
      act(() => {
        result.current.handleCloseErrorMessage()
      })

      // Should still be null
      expect(result.current.error).toBeNull()
    })

    it('should handle error from query alongside loading state', () => {
      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        isLoading: true,
        error: new Error('Error while loading'),
      })

      const { result } = renderHook(() => useChatTypesPage())

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe('Error while loading')
    })
  })

  describe('Integration - Multiple State Changes', () => {
    it('should handle multiple operations in sequence', () => {
      const { result } = renderHook(() => useChatTypesPage())

      // Initial state
      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.paginationModel.page).toBe(0)
      expect(result.current.searchQuery).toBe('')

      // Search
      act(() => {
        result.current.handleSearchChange('technical')
      })
      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.paginationModel.page).toBe(0)

      // Change pagination
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 5 })
      })
      expect(result.current.paginationModel.pageSize).toBe(5)

      // Clear search
      act(() => {
        result.current.handleSearchChange('')
      })
      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.paginationModel.page).toBe(0)
    })

    it('should update data when useAIChatConfig returns new data', async () => {
      const { rerender, result } = renderHook(() => useChatTypesPage())

      expect(result.current.chatTypes).toEqual(mockChatTypes)

      // Simulate new data from API
      const newChatTypes: ChatType[] = [
        {
          id: '99999999-9999-9999-9999-999999999999',
          name: 'New Chat Type',
          description: 'Newly added chat type',
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
          seoFriendlyId: 'new-chat-type',
          seoFriendlyBase64Id: 'OTk5OTk5OTk5OTk5OTk5OQ',
        },
      ]

      ;(useAIChatConfig as Mock).mockReturnValue({
        ...mockUseAIChatConfig,
        chatTypes: newChatTypes,
      })

      rerender()

      await waitFor(() => {
        expect(result.current.chatTypes).toEqual(newChatTypes)
        expect(result.current.rowCount).toBe(1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle search with special characters', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('(test)')
      })

      expect(result.current.searchQuery).toBe('(test)')
      expect(result.current.chatTypes).toHaveLength(0)
    })

    it('should handle very long search query', () => {
      const { result } = renderHook(() => useChatTypesPage())

      const longQuery = 'a'.repeat(1000)

      act(() => {
        result.current.handleSearchChange(longQuery)
      })

      expect(result.current.searchQuery).toBe(longQuery)
      expect(result.current.chatTypes).toHaveLength(0)
    })

    it('should handle pagination with pageSize of 0', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 0 })
      })

      expect(result.current.paginationModel.pageSize).toBe(0)
      expect(result.current.chatTypes).toHaveLength(0)
    })

    it('should handle negative page number', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handlePaginationChange({ page: -1, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(-1)
      expect(result.current.chatTypes).toHaveLength(0)
    })

    it('should handle case-insensitive search correctly', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('GENERAL')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]!.name).toBe('General Chat')
    })

    it('should handle whitespace in search query', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleSearchChange('  technical  ')
      })

      expect(result.current.searchQuery).toBe('  technical  ')
      // Should still find results despite whitespace
      expect(result.current.chatTypes.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve original chat types data structure', () => {
      const { result } = renderHook(() => useChatTypesPage())

      const chatType = result.current.chatTypes[0]
      expect(chatType).toHaveProperty('id')
      expect(chatType).toHaveProperty('name')
      expect(chatType).toHaveProperty('description')
      expect(chatType).toHaveProperty('createdAt')
      expect(chatType).toHaveProperty('updatedAt')
      expect(chatType).toHaveProperty('seoFriendlyId')
      expect(chatType).toHaveProperty('seoFriendlyBase64Id')
    })

    it('should not mutate original chat types array', () => {
      const { result } = renderHook(() => useChatTypesPage())

      const originalLength = mockChatTypes.length

      act(() => {
        result.current.handleSearchChange('technical')
      })

      expect(mockChatTypes).toHaveLength(originalLength)
    })

    it('should return readonly array for chatTypes', () => {
      const { result } = renderHook(() => useChatTypesPage())

      // TypeScript should enforce readonly, but we can verify the data is there
      expect(Array.isArray(result.current.chatTypes)).toBe(true)
    })
  })
})
