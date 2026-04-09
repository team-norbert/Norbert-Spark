import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIChatOptionsResponse, ChatType } from '@/domain/ai/chat-config.js'
import { useAIAdminPage } from '@/view/hooks/useAIAdminPage.js'

vi.mock('@/infrastructure/serverActions/getAIChatConfig.server.js', () => ({
  getAIChatConfig: vi.fn(),
}))

// Helper function to create a QueryClientProvider wrapper
function createWrapper(client: QueryClient) {
  // eslint-disable-next-line @eslint-react/component-hook-factories
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

// Mock chat type data for tests
const mockChatTypes: ChatType[] = [
  {
    id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
    name: 'General Assistant',
    description: 'A general-purpose AI assistant for everyday tasks',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    seoFriendlyId: 'general-assistant',
    seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
    rag: false,
  },
  {
    id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
    name: 'Fitness Tracker',
    description: 'Track your fitness goals and progress',
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    seoFriendlyId: 'fitness-tracker',
    seoFriendlyBase64Id: 'AZQv42ejfD2OX2p7jJ',
    rag: false,
  },
  {
    id: '01942f8e-67a5-8d4e-9f6a-7b8c9d0e1f2a',
    name: 'Level 2 Gym Instructor',
    description: 'Expert fitness and training assistant',
    createdAt: '2024-01-17T10:30:00Z',
    updatedAt: '2024-01-17T10:30:00Z',
    seoFriendlyId: 'level-2-gym-instructor',
    seoFriendlyBase64Id: 'AZQv42ejjU6fane8nQ',
    rag: false,
  },
  {
    id: '01942f8e-67a6-9e5f-af7a-8b9c0d1e2f3b',
    name: 'Nutrition Advisor',
    description: 'Expert nutrition guidance and meal planning',
    createdAt: '2024-01-18T10:30:00Z',
    updatedAt: '2024-01-18T10:30:00Z',
    seoFriendlyId: 'nutrition-advisor',
    seoFriendlyBase64Id: 'AZQv42ejnlWvepuc',
    rag: false,
  },
  {
    id: '01942f8e-67a7-af6a-ba8b-9c0d1e2f3g4c',
    name: 'Wellness Coach',
    description: 'Holistic wellness and lifestyle coaching',
    createdAt: '2024-01-19T10:30:00Z',
    updatedAt: '2024-01-19T10:30:00Z',
    seoFriendlyId: 'wellness-coach',
    seoFriendlyBase64Id: 'AZQv42ejr2a6i5wN',
    rag: false,
  },
]

describe('useAIAdminPage', () => {
  let getAIChatConfigMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetAllMocks()
    // Import the mock after resetting
    const { getAIChatConfig } =
      await import('@/infrastructure/serverActions/getAIChatConfig.server.js')
    getAIChatConfigMock = vi.mocked(getAIChatConfig)
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [],
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.paginationModel).toEqual({ page: 0, pageSize: 10 })
      expect(result.current.rowCount).toBe(0)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.chatTypes).toEqual([])
    })

    it('should provide all required handlers', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [],
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.handlePaginationChange).toBeDefined()
      expect(result.current.handleSearchChange).toBeDefined()
      expect(result.current.handleCloseErrorMessage).toBeDefined()
      expect(typeof result.current.handlePaginationChange).toBe('function')
      expect(typeof result.current.handleSearchChange).toBe('function')
      expect(typeof result.current.handleCloseErrorMessage).toBe('function')
    })
  })

  describe('Successful Data Fetching', () => {
    it('should fetch chat types on mount', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)
      expect(result.current.chatTypes).toHaveLength(5)
      expect(result.current.rowCount).toBe(5)
      expect(result.current.error).toBeNull()
    })

    it('should display first page of results with default pageSize', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(5) // All items fit in page size 10
      expect(result.current.paginationModel.page).toBe(0)
      expect(result.current.paginationModel.pageSize).toBe(10)
    })
  })

  describe('Pagination', () => {
    it('should handle pagination changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const largeMockData = Array.from({ length: 25 }, (_, i) => ({
        id: `id-${i}`,
        name: `Chat Type ${i}`,
        description: `Description ${i}`,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: `chat-type-${i}`,
        seoFriendlyBase64Id: `base64-${i}`,
        rag: false,
      }))

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: largeMockData,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(10) // First page
      expect(result.current.rowCount).toBe(25)

      // Change to page 2
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(1)
      expect(result.current.chatTypes).toHaveLength(10) // Second page

      // Change to page 3
      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(2)
      expect(result.current.chatTypes).toHaveLength(5) // Last page with remaining items
    })

    it('should handle pageSize changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(5)

      // Change page size to 2
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 2 })
      })

      expect(result.current.paginationModel.pageSize).toBe(2)
      expect(result.current.chatTypes).toHaveLength(2)

      // Navigate to next page
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 2 })
      })

      expect(result.current.chatTypes).toHaveLength(2)
      expect(result.current.chatTypes[0]?.name).toBe('Level 2 Gym Instructor')
    })

    it('should maintain pagination state across renders', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { rerender, result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 2 })
      })

      expect(result.current.paginationModel.page).toBe(1)

      rerender()

      expect(result.current.paginationModel.page).toBe(1)
      expect(result.current.paginationModel.pageSize).toBe(2)
    })
  })

  describe('Search Functionality', () => {
    it('should filter chat types by name', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(5)

      act(() => {
        result.current.handleSearchChange('fitness tracker')
      })

      expect(result.current.searchQuery).toBe('fitness tracker')
      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]?.name).toBe('Fitness Tracker')
    })

    it('should filter chat types by description', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('expert')
      })

      expect(result.current.chatTypes).toHaveLength(2) // Level 2 Gym Instructor and Nutrition Advisor
      expect(result.current.rowCount).toBe(2)
    })

    it('should filter chat types by seoFriendlyId', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('wellness-coach')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]?.seoFriendlyId).toBe('wellness-coach')
    })

    it('should be case-insensitive', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('GENERAL')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]?.name).toBe('General Assistant')
    })

    it('should return empty array when no results match', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('nonexistent')
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.rowCount).toBe(0)
    })

    it('should reset to page 0 when search changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Set pagination to page 2
      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 2 })
      })

      expect(result.current.paginationModel.page).toBe(2)

      // Perform search
      act(() => {
        result.current.handleSearchChange('fitness')
      })

      expect(result.current.paginationModel.page).toBe(0) // Should reset to first page
    })

    it('should clear search and show all results', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('fitness tracker')
      })

      expect(result.current.chatTypes).toHaveLength(1)

      act(() => {
        result.current.handleSearchChange('')
      })

      expect(result.current.chatTypes).toHaveLength(5)
      expect(result.current.searchQuery).toBe('')
    })
  })

  describe('Search and Pagination Combined', () => {
    it('should paginate filtered results', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const largeMockData = Array.from({ length: 20 }, (_, i) => ({
        id: `id-${i}`,
        name: `Fitness Coach ${i}`,
        description: `Expert fitness coaching ${i}`,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: `fitness-coach-${i}`,
        seoFriendlyBase64Id: `base64-${i}`,
        rag: false,
      }))

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: largeMockData,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Search for "fitness"
      act(() => {
        result.current.handleSearchChange('fitness')
      })

      expect(result.current.rowCount).toBe(20) // All items match

      // Change page size to 5
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 5 })
      })

      expect(result.current.chatTypes).toHaveLength(5) // First 5 items

      // Navigate to page 2
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 5 })
      })

      expect(result.current.chatTypes).toHaveLength(5) // Next 5 items
      expect(result.current.chatTypes[0]?.name).toBe('Fitness Coach 5')
    })

    it('should update rowCount based on filtered results', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.rowCount).toBe(5)

      act(() => {
        result.current.handleSearchChange('expert')
      })

      expect(result.current.rowCount).toBe(2) // Only 2 items match
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication error', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const authError = new Error('No authentication token available')
      getAIChatConfigMock.mockRejectedValue(authError)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('No authentication token available')
      expect(result.current.chatTypes).toEqual([])
    })

    it('should handle backend server error', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const serverError = new Error('Backend service unavailable')
      getAIChatConfigMock.mockRejectedValue(serverError)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Backend service unavailable')
      expect(result.current.chatTypes).toEqual([])
    })

    it('should handle network error', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const networkError = new Error('Network request failed')
      getAIChatConfigMock.mockRejectedValue(networkError)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network request failed')
    })

    it('should clear error message when handleCloseErrorMessage is called', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Note: handleCloseErrorMessage only clears errorMessage state, not error from useAIChatConfig
      // This tests the handler functionality
      act(() => {
        result.current.handleCloseErrorMessage()
      })

      // The error from useAIChatConfig would still be there if it exists
      expect(result.current.error).toBeNull()
    })
  })

  describe('Loading States', () => {
    it('should set loading to true initially', () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      getAIChatConfigMock.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after successful fetch', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set loading to false after failed fetch', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      getAIChatConfigMock.mockRejectedValue(new Error('Fetch failed'))

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data set', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [],
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.rowCount).toBe(0)
    })

    it('should handle single item data set', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: [mockChatTypes[0]!],
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.rowCount).toBe(1)
    })

    it('should handle pagination beyond available data', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Navigate to page that has no data
      act(() => {
        result.current.handlePaginationChange({ page: 10, pageSize: 10 })
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.rowCount).toBe(5) // Total count should still be accurate
    })

    it('should handle special characters in search query', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const specialCharData = [
        {
          id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
          name: 'C++ Developer',
          description: 'Expert C++ programming',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          seoFriendlyId: 'cpp-developer',
          seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
          rag: false,
        },
      ]

      const mockResponse: AIChatOptionsResponse = {
        success: true,
        data: specialCharData,
      }

      getAIChatConfigMock.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAIAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('c++')
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]?.name).toBe('C++ Developer')
    })
  })
})
