import type { GridPaginationModel } from '@mui/x-data-grid'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAllUsers, type FindAllUsersResult } from '@/application/actions/findAllUsers.js'
import type { User } from '@/domain/user/user.js'
import { useAdminPage } from '@/view/hooks/useAdminPage.js'

// Mock the findAllUsers action
vi.mock('@/application/actions/findAllUsers.js', () => ({
  findAllUsers: vi.fn(),
}))

// Helper function to create a QueryClientProvider wrapper
function createWrapper(client: QueryClient) {
  // eslint-disable-next-line @eslint-react/component-hook-factories
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

// Mock user data for tests
const mockUsers: readonly User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'moderator',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
]

describe('useAdminPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: [],
        total: 0,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.currentUserRole).toBe('admin')
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.paginationModel).toEqual({ page: 0, pageSize: 10 })
      expect(result.current.rowCount).toBe(0)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.users).toEqual([])
    })

    it('should provide all required handlers', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: [],
        total: 0,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.handlePaginationChange).toBeDefined()
      expect(result.current.handleSearchChange).toBeDefined()
      expect(typeof result.current.handlePaginationChange).toBe('function')
      expect(typeof result.current.handleSearchChange).toBe('function')
    })
  })

  describe('Successful Data Fetching', () => {
    it('should fetch users with default pagination on mount', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        signal: expect.any(AbortSignal),
      })
      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.rowCount).toBe(3)
      expect(result.current.error).toBeNull()
    })

    it('should fetch users with correct pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        signal: expect.any(AbortSignal),
      })
    })

    it('should handle empty user list', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: [],
        total: 0,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.users).toEqual([])
      expect(result.current.rowCount).toBe(0)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Pagination Handling', () => {
    it('should update pagination model when handlePaginationChange is called', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newPaginationModel: GridPaginationModel = { page: 2, pageSize: 20 }

      act(() => {
        result.current.handlePaginationChange(newPaginationModel)
      })

      expect(result.current.paginationModel).toEqual(newPaginationModel)
    })

    it('should trigger new data fetch when pagination changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Change to page 2 with pageSize 10
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 10,
          offset: 10,
          signal: expect.any(AbortSignal),
        })
      })

      expect(findAllUsers).toHaveBeenCalledTimes(2)
    })

    it('should calculate correct offset for different page sizes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 100,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Change to page 3 with pageSize 25
      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 25 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 25,
          offset: 50,
          signal: expect.any(AbortSignal),
        })
      })
    })

    it('should handle pagination to first page', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Go to page 3
      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.paginationModel.page).toBe(2)
      })

      // Go back to page 1
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(0)

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
          signal: expect.any(AbortSignal),
        })
      })
    })

    it('should handle page size changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 100,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Change page size from 10 to 25
      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 25 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 25,
          offset: 0,
          signal: expect.any(AbortSignal),
        })
      })

      expect(result.current.paginationModel.pageSize).toBe(25)
    })

    it('should successfully fetch data for different pages', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      // Mock successful responses for different pages
      vi.mocked(findAllUsers).mockImplementation(async (params) => {
        if (params.offset === 0) {
          return {
            success: true,
            users: mockUsers.slice(0, 1),
            total: 30,
            status: 200,
          }
        }
        // Page 1
        return {
          success: true,
          users: mockUsers.slice(1, 2),
          total: 30,
          status: 200,
        }
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // First page should have first user
      expect(result.current.users).toEqual(mockUsers.slice(0, 1))

      // Change to page 1
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should now have second user
      expect(result.current.error).toBeNull()
      expect(result.current.users).toEqual(mockUsers.slice(1, 2))
      expect(findAllUsers).toHaveBeenCalledTimes(2)
    })
  })

  describe('Search Functionality', () => {
    it('should update search query when handleSearchChange is called', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.searchQuery).toBe('')

      act(() => {
        result.current.handleSearchChange('John')
      })

      expect(result.current.searchQuery).toBe('John')
    })

    it('should handle empty search query', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('test')
      })

      expect(result.current.searchQuery).toBe('test')

      act(() => {
        result.current.handleSearchChange('')
      })

      expect(result.current.searchQuery).toBe('')
    })

    it('should handle multiple search query updates', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('John')
      })
      expect(result.current.searchQuery).toBe('John')

      act(() => {
        result.current.handleSearchChange('Jane')
      })
      expect(result.current.searchQuery).toBe('Jane')

      act(() => {
        result.current.handleSearchChange('Bob')
      })
      expect(result.current.searchQuery).toBe('Bob')
    })

    it('should handle special characters in search query', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('test@example.com')
      })

      expect(result.current.searchQuery).toBe('test@example.com')
    })
  })

  describe('Loading States', () => {
    it('should show loading true initially', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      let resolvePromise!: (value: FindAllUsersResult) => void
      const promise = new Promise<FindAllUsersResult>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(findAllUsers).mockReturnValue(promise)

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.users).toEqual([])
      expect(result.current.rowCount).toBe(0)

      resolvePromise({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should show loading false after successful fetch', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.rowCount).toBe(3)
    })

    it('should show loading true during pagination change', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resolvePromise!: (value: FindAllUsersResult) => void
      const promise = new Promise<FindAllUsersResult>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(findAllUsers).mockReturnValue(promise)

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      resolvePromise({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBe('Network error')
      expect(result.current.users).toEqual([])
      expect(result.current.rowCount).toBe(0)
    })

    it('should handle server errors', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockRejectedValue(new Error('Internal server error'))

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBe('Internal server error')
      expect(result.current.users).toEqual([])
    })

    it('should handle non-Error exceptions', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockRejectedValue('String error')

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBeNull()
      expect(result.current.users).toEqual([])
    })
  })

  describe('User Role', () => {
    it('should always return admin role', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.currentUserRole).toBe('admin')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid pagination changes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 100,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Rapidly change pages
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
        result.current.handlePaginationChange({ page: 3, pageSize: 10 })
      })

      expect(result.current.paginationModel.page).toBe(3)
    })

    it('should handle very large page numbers', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: [],
        total: 10000,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 999, pageSize: 10 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 10,
          offset: 9990,
          signal: expect.any(AbortSignal),
        })
      })
    })

    it('should handle very large page sizes', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 1000 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 1000,
          offset: 0,
          signal: expect.any(AbortSignal),
        })
      })
    })

    it('should maintain state consistency across multiple operations', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Perform multiple operations
      act(() => {
        result.current.handleSearchChange('John')
        result.current.handlePaginationChange({ page: 1, pageSize: 20 })
        result.current.handleSearchChange('Jane')
      })

      expect(result.current.searchQuery).toBe('Jane')
      expect(result.current.paginationModel).toEqual({ page: 1, pageSize: 20 })
    })
  })

  describe('AbortController Integration', () => {
    it('should pass AbortSignal to findAllUsers', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
          signal: expect.any(AbortSignal),
        })
      })
    })

    it('should handle aborted requests', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      // DOMException is not an instance of Error in some environments
      // The useUsers hook returns null for non-Error exceptions
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      vi.mocked(findAllUsers).mockRejectedValue(abortError)

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBe('The operation was aborted')
      expect(result.current.users).toEqual([])
    })
  })

  describe('Query Caching and Refetching', () => {
    it('should use cached data for same pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 3,
        status: 200,
      })

      const { result: result1 } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result1.current.loading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Second render with same parameters should use cache
      const { result: result2 } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      // Should not call findAllUsers again due to cache
      expect(findAllUsers).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(result2.current.loading).toBe(false)
      })

      expect(result2.current.users).toEqual(mockUsers)
    })

    it('should fetch new data for different pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 50,
        status: 200,
      })

      const { result } = renderHook(() => useAdminPage(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Change pagination
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledTimes(2)
      })
    })
  })
})
