import type { GridPaginationModel, GridRowModel } from '@mui/x-data-grid'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { updateChatType } from '@/infrastructure/serverActions/updateChatType.server.js'
import { useAIChatConfig } from '@/view/hooks/queries/useAIChatConfig.js'
import { useChatTypesPage } from '@/view/hooks/useChatTypesPage.js'

// Mock the useAIChatConfig hook
vi.mock('@/view/hooks/queries/useAIChatConfig.js', () => ({
  useAIChatConfig: vi.fn(),
}))

// Mock the updateChatType server action
vi.mock('@/infrastructure/serverActions/updateChatType.server.js', () => ({
  updateChatType: vi.fn(),
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
      expect(result.current).toHaveProperty('dialogError')
      expect(result.current).toHaveProperty('handleCloseDialogError')
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
      expect(result.current.chatTypes.length).toBeGreaterThan(0)
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

  // ---------------------------------------------------------------------------
  // Edit confirmation dialog – initial state
  // ---------------------------------------------------------------------------

  describe('Edit Confirmation Dialog - Initial State', () => {
    it('should initialise confirmDialogOpen as false', () => {
      const { result } = renderHook(() => useChatTypesPage())
      expect(result.current.confirmDialogOpen).toBe(false)
    })

    it('should initialise pendingEdit as null', () => {
      const { result } = renderHook(() => useChatTypesPage())
      expect(result.current.pendingEdit).toBeNull()
    })

    it('should initialise savingEdit as false', () => {
      const { result } = renderHook(() => useChatTypesPage())
      expect(result.current.savingEdit).toBe(false)
    })

    it('should initialise successMessage as null', () => {
      const { result } = renderHook(() => useChatTypesPage())
      expect(result.current.successMessage).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // handleProcessRowUpdate
  // ---------------------------------------------------------------------------

  describe('handleProcessRowUpdate', () => {
    it('should open the confirmation dialog when name changes', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      expect(result.current.confirmDialogOpen).toBe(true)
    })

    it('should set pendingEdit with field "name" when name changes', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      expect(result.current.pendingEdit).toEqual({ newRow, oldRow, field: 'name' })
    })

    it('should set pendingEdit with field "seoFriendlyId" when seoFriendlyId changes', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], seoFriendlyId: 'new-seo-id' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      expect(result.current.pendingEdit).toEqual({ newRow, oldRow, field: 'seoFriendlyId' })
    })

    it('should set pendingEdit with field "description" when description changes', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], description: 'New description text' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      expect(result.current.pendingEdit).toEqual({ newRow, oldRow, field: 'description' })
    })

    it('should resolve immediately with newRow when no field changed', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const row: GridRowModel = { ...mockChatTypes[0] }

      let resolvedRow: GridRowModel | undefined
      await act(async () => {
        resolvedRow = await result.current.handleProcessRowUpdate(row, row)
      })

      expect(resolvedRow).toEqual(row)
      expect(result.current.confirmDialogOpen).toBe(false)
      expect(result.current.pendingEdit).toBeNull()
    })

    it('should return a Promise', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      let promise: Promise<GridRowModel> | undefined
      act(() => {
        promise = result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      expect(promise).toBeInstanceOf(Promise)
    })

    it('should clear successMessage when a new edit begins', async () => {
      ;(updateChatType as Mock).mockResolvedValue(undefined)
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow1: GridRowModel = { ...mockChatTypes[0], name: 'First Update' }

      // Complete a first save so successMessage is populated
      act(() => {
        void result.current.handleProcessRowUpdate(newRow1, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })
      expect(result.current.successMessage).toBe('Update successful')

      // Starting a second edit should clear successMessage
      const newRow2: GridRowModel = { ...mockChatTypes[0], name: 'Second Update' }
      act(() => {
        void result.current.handleProcessRowUpdate(newRow2, oldRow)
      })

      expect(result.current.successMessage).toBeNull()
    })

    it('should prevent new edits when a save is in progress', async () => {
      ;(updateChatType as Mock).mockImplementation(() => {
        // Simulate a slow server response
        return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      })

      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const firstEdit: GridRowModel = { ...mockChatTypes[0], name: 'First Edit' }
      const secondEdit: GridRowModel = { ...mockChatTypes[0], name: 'Second Edit' }

      // Start first edit
      let firstPromiseResolved: GridRowModel | undefined
      act(() => {
        void result.current.handleProcessRowUpdate(firstEdit, oldRow).then((row) => {
          firstPromiseResolved = row
          return row
        })
      })

      // Confirm the first edit (starts save in progress)
      act(() => {
        void result.current.handleConfirmSave()
      })

      // Try to start a second edit while save is in progress
      let secondPromiseResolved: GridRowModel | undefined
      act(() => {
        void result.current.handleProcessRowUpdate(secondEdit, oldRow).then((row) => {
          secondPromiseResolved = row
          return row
        })
      })

      // Second edit should be rejected immediately with oldRow
      await waitFor(() => {
        expect(secondPromiseResolved).toEqual(oldRow)
      })

      // Wait for first edit to complete
      await waitFor(() => {
        expect(firstPromiseResolved).toEqual(firstEdit)
      })

      // After save completes, savingEdit should be false.
      // Must use waitFor because setSavingEdit(false) is called in the finally
      // block after pendingResolver.resolve() — those are separate microtasks,
      // so the synchronous check would read stale state.
      await waitFor(() => {
        expect(result.current.savingEdit).toBe(false)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // handleCancelSave
  // ---------------------------------------------------------------------------

  describe('handleCancelSave', () => {
    it('should close the confirmation dialog', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      expect(result.current.confirmDialogOpen).toBe(true)

      act(() => {
        result.current.handleCancelSave()
      })

      expect(result.current.confirmDialogOpen).toBe(false)
    })

    it('should clear pendingEdit', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      expect(result.current.pendingEdit).not.toBeNull()

      act(() => {
        result.current.handleCancelSave()
      })

      expect(result.current.pendingEdit).toBeNull()
    })

    it('should resolve the DataGrid promise with oldRow', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      let resolvedRow: GridRowModel | undefined
      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow).then((row) => {
          resolvedRow = row
          return row
        })
      })

      act(() => {
        result.current.handleCancelSave()
      })

      await waitFor(() => {
        expect(resolvedRow).toEqual(oldRow)
      })
    })

    it('should not call updateChatType', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      act(() => {
        result.current.handleCancelSave()
      })

      expect(updateChatType).not.toHaveBeenCalled()
    })

    it('should not set successMessage', () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      act(() => {
        result.current.handleCancelSave()
      })

      expect(result.current.successMessage).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // handleConfirmSave – successful save
  // ---------------------------------------------------------------------------

  describe('handleConfirmSave - Successful Save', () => {
    beforeEach(() => {
      ;(updateChatType as Mock).mockResolvedValue(undefined)
    })

    it('should call updateChatType with the correct name payload', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(updateChatType).toHaveBeenCalledWith({
        id: mockChatTypes[0]!.id,
        name: 'Updated Name',
      })
    })

    it('should call updateChatType with the correct seoFriendlyId payload', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], seoFriendlyId: 'new-seo-id' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(updateChatType).toHaveBeenCalledWith({
        id: mockChatTypes[0]!.id,
        seoFriendlyId: 'new-seo-id',
      })
    })

    it('should call updateChatType with the correct description payload', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], description: 'New description' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(updateChatType).toHaveBeenCalledWith({
        id: mockChatTypes[0]!.id,
        description: 'New description',
      })
    })

    it('should resolve the DataGrid promise with newRow', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      let resolvedRow: GridRowModel | undefined
      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow).then((row) => {
          resolvedRow = row
          return row
        })
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      await waitFor(() => {
        expect(resolvedRow).toEqual(newRow)
      })
    })

    it('should set successMessage to "Update successful"', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.successMessage).toBe('Update successful')
    })

    it('should call refetch after a successful save', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(mockUseAIChatConfig.refetch).toHaveBeenCalledOnce()
    })

    it('should close the dialog after save', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      expect(result.current.confirmDialogOpen).toBe(true)

      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.confirmDialogOpen).toBe(false)
    })

    it('should clear pendingEdit after save', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      expect(result.current.pendingEdit).not.toBeNull()

      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.pendingEdit).toBeNull()
    })

    it('should set savingEdit to false after a successful save', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.savingEdit).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // handleConfirmSave – error handling (thrown exception)
  // ---------------------------------------------------------------------------

  describe('handleConfirmSave - Error Handling', () => {
    it('should NOT resolve the DataGrid promise when updateChatType throws', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Chat type name already exists'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Duplicate Name' }

      let resolvedRow: GridRowModel | undefined
      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow).then((row) => {
          resolvedRow = row
          return row
        })
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      // The promise should NOT be resolved on error to keep edit mode active
      expect(resolvedRow).toBeUndefined()
    })

    it('should set dialogError message from the thrown Error object', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Chat type name already exists'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Duplicate Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.dialogError).toBe('Chat type name already exists')
    })

    it('should use fallback message in dialogError when a non-Error value is thrown', async () => {
      ;(updateChatType as Mock).mockRejectedValue('string error')
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.dialogError).toBe('An unexpected error occurred')
    })

    it('should not set successMessage on error', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Some error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Bad Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.successMessage).toBeNull()
    })

    it('should keep the dialog open on error', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Some error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Bad Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.confirmDialogOpen).toBe(true)
    })

    it('should not call refetch on error', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Some error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Bad Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(mockUseAIChatConfig.refetch).not.toHaveBeenCalled()
    })

    it('should handle network timeout error in dialogError', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Network timeout'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.dialogError).toBe('Network timeout')
    })

    it('should allow retry after error by keeping pendingEdit state', async () => {
      ;(updateChatType as Mock).mockRejectedValueOnce(new Error('Network error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      // First attempt - should fail
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.dialogError).toBe('Network error')
      expect(result.current.confirmDialogOpen).toBe(true)
      expect(result.current.pendingEdit).not.toBeNull()

      // Mock successful update for retry
      ;(updateChatType as Mock).mockResolvedValueOnce({ success: true })

      // Second attempt - should succeed
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.successMessage).toBe('Update successful')
      expect(result.current.confirmDialogOpen).toBe(false)
      expect(result.current.pendingEdit).toBeNull()
    })

    it('should clear dialogError when handleCancelSave is called', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Some error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Bad Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.dialogError).toBe('Some error')

      act(() => {
        result.current.handleCancelSave()
      })

      expect(result.current.dialogError).toBeNull()
      expect(result.current.confirmDialogOpen).toBe(false)
    })

    it('should clear previous dialogError before attempting new save', async () => {
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      // First, set a dialogError via a failed save
      ;(updateChatType as Mock).mockRejectedValueOnce(new Error('First error'))
      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })
      expect(result.current.dialogError).toBe('First error')

      // Now attempt a second save - should clear the previous dialogError first
      ;(updateChatType as Mock).mockResolvedValueOnce({ success: true })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      // dialogError should be cleared on successful save
      expect(result.current.dialogError).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // savingEdit in-flight state
  // ---------------------------------------------------------------------------

  describe('savingEdit State During Save', () => {
    it('should be true while the save is in progress and false once resolved', async () => {
      let resolveUpdate!: (value: { success: boolean }) => void
      ;(updateChatType as Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      // Open the dialog
      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })

      // Start the save without awaiting so we can inspect mid-flight state
      act(() => {
        void result.current.handleConfirmSave()
      })

      await waitFor(() => {
        expect(result.current.savingEdit).toBe(true)
      })

      // Resolve the API call
      act(() => {
        resolveUpdate({ success: true })
      })

      await waitFor(() => {
        expect(result.current.savingEdit).toBe(false)
      })
    })

    it('should be false after a save that throws (finally block runs)', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Server error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })

      expect(result.current.savingEdit).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // handleProcessRowUpdateError
  // ---------------------------------------------------------------------------

  describe('handleProcessRowUpdateError', () => {
    it('should set error message from the Error object', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleProcessRowUpdateError(new Error('Row update failed'))
      })

      expect(result.current.error).toBe('Row update failed')
    })

    it('should set fallback message when Error has an empty message', () => {
      const { result } = renderHook(() => useChatTypesPage())

      act(() => {
        result.current.handleProcessRowUpdateError(new Error(''))
      })

      expect(result.current.error).toBe('An error occurred while updating the row')
    })
  })

  // ---------------------------------------------------------------------------
  // handleCloseSuccessMessage
  // ---------------------------------------------------------------------------

  describe('handleCloseSuccessMessage', () => {
    it('should clear successMessage', async () => {
      ;(updateChatType as Mock).mockResolvedValue(undefined)
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })
      expect(result.current.successMessage).toBe('Update successful')

      act(() => {
        result.current.handleCloseSuccessMessage()
      })

      expect(result.current.successMessage).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // handleCloseDialogError
  // ---------------------------------------------------------------------------

  describe('handleCloseDialogError', () => {
    it('should clear dialogError', async () => {
      ;(updateChatType as Mock).mockRejectedValue(new Error('Test error'))
      const { result } = renderHook(() => useChatTypesPage())
      const oldRow: GridRowModel = { ...mockChatTypes[0] }
      const newRow: GridRowModel = { ...mockChatTypes[0], name: 'Updated Name' }

      act(() => {
        void result.current.handleProcessRowUpdate(newRow, oldRow)
      })
      await act(async () => {
        await result.current.handleConfirmSave()
      })
      expect(result.current.dialogError).toBe('Test error')

      act(() => {
        result.current.handleCloseDialogError()
      })

      expect(result.current.dialogError).toBeNull()
    })
  })
})
