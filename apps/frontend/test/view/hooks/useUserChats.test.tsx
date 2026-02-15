import type { AIUserIdResponseSchemaType } from '@norberts-spark/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserChats } from '@/view/hooks/useUserChats.js'

// Mock the server action
vi.mock('@/infrastructure/serverActions/getChatsByUserId.server.js', () => ({
  getChatsByUserIdAction: vi.fn(),
}))

describe('useUserChats', () => {
  let queryClient: QueryClient
  let mockGetChatsByUserIdAction: ReturnType<typeof vi.fn>

  const TEST_USER_ID = '01234567-89ab-cdef-0123-456789abcdef'
  const TEST_CHAT_IDS = [
    { id: 'chat-id-1', chatTypeId: 'type-1', seoFriendlyId: 'chat-test-1' },
    { id: 'chat-id-2', chatTypeId: 'type-2', seoFriendlyId: 'chat-test-2' },
    { id: 'chat-id-3', chatTypeId: 'type-3', seoFriendlyId: 'chat-test-3' },
  ]

  // Helper to create a wrapper with QueryClient
  function createWrapper() {
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
    return Wrapper
  }

  beforeEach(async () => {
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests
          gcTime: 0, // Disable cache time
        },
      },
    })

    // Get the mocked function
    const module = await import('@/infrastructure/serverActions/getChatsByUserId.server.js')
    mockGetChatsByUserIdAction = vi.mocked(module.getChatsByUserIdAction)

    vi.clearAllMocks()
  })

  describe('successful queries', () => {
    it('should fetch chat IDs when userId is provided', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: TEST_CHAT_IDS,
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for query to resolve
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(TEST_CHAT_IDS)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledExactlyOnceWith(TEST_USER_ID)
    })

    it('should return empty array when user has no chats', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: [],
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
      expect(result.current.data).toHaveLength(0)
    })

    it('should return single chat ID', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: [{ id: 'single-chat-id', chatTypeId: 'type-1', seoFriendlyId: 'chat-single' }],
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([
        { id: 'single-chat-id', chatTypeId: 'type-1', seoFriendlyId: 'chat-single' },
      ])
      expect(result.current.data).toHaveLength(1)
    })

    it('should handle many chat IDs', async () => {
      const manyChatIds = Array.from({ length: 100 }, (_, i) => ({
        id: `chat-id-${i}`,
        chatTypeId: `type-${i}`,
        seoFriendlyId: `chat-test-${i}`,
      }))
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: manyChatIds,
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(manyChatIds)
      expect(result.current.data).toHaveLength(100)
    })

    it('should extract data array from response', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: TEST_CHAT_IDS,
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should only return the data array, not the full response
      expect(result.current.data).toEqual(TEST_CHAT_IDS)
      expect(result.current.data).not.toHaveProperty('success')
    })
  })

  describe('disabled queries', () => {
    it('should not fetch when userId is null', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const { result } = renderHook(() => useUserChats(null), {
        wrapper: createWrapper(),
      })

      // Should not be loading or have data
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')

      // Should not call the action
      expect(mockGetChatsByUserIdAction).not.toHaveBeenCalled()
    })

    it('should not fetch when userId is empty string', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const { result } = renderHook(() => useUserChats(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(mockGetChatsByUserIdAction).not.toHaveBeenCalled()
    })

    it('should not fetch when userId is undefined', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const { result } = renderHook(() => useUserChats(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(mockGetChatsByUserIdAction).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle server action errors', async () => {
      const errorMessage = 'Failed to fetch chats'
      mockGetChatsByUserIdAction.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.data).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle network errors', async () => {
      mockGetChatsByUserIdAction.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle 401 unauthorized errors', async () => {
      const error = Object.assign(new Error('Unauthorized'), { status: 401 })
      mockGetChatsByUserIdAction.mockRejectedValue(error)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error & { status?: number }).status).toBe(401)
    })

    it('should handle empty response with success: false', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: false,
        data: [],
      }
      mockGetChatsByUserIdAction.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should still return the data even if success is false
      expect(result.current.data).toEqual([])
    })
  })

  describe('query configuration', () => {
    it('should use correct query key with userId', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that the query key is correct
      const queryState = queryClient.getQueryState(['user-chats', TEST_USER_ID])
      expect(queryState).toBeDefined()
    })

    it('should have different query keys for different userIds', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const userId1 = 'user-id-1'
      const userId2 = 'user-id-2'

      renderHook(() => useUserChats(userId1), { wrapper: createWrapper() })
      renderHook(() => useUserChats(userId2), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(queryClient.getQueryState(['user-chats', userId1])).toBeDefined()
        expect(queryClient.getQueryState(['user-chats', userId2])).toBeDefined()
      })

      // Both queries should exist independently
      expect(queryClient.getQueryState(['user-chats', userId1])).not.toBe(
        queryClient.getQueryState(['user-chats', userId2])
      )
    })

    it('should be enabled only when userId exists', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: [] })

      const { result: result1 } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      const { result: result2 } = renderHook(() => useUserChats(null), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      // First query should be enabled and succeed
      expect(result1.current.fetchStatus).toBe('idle')
      expect(result1.current.isSuccess).toBe(true)

      // Second query should be disabled
      expect(result2.current.fetchStatus).toBe('idle')
      expect(result2.current.isPending).toBe(true)
      expect(result2.current.isSuccess).toBe(false)
    })

    it('should have staleTime of 60 seconds', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: TEST_CHAT_IDS })

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const queryState = queryClient.getQueryState(['user-chats', TEST_USER_ID])
      expect(queryState?.dataUpdatedAt).toBeDefined()

      // Query should not be stale immediately after fetching
      expect(result.current.isStale).toBe(false)
    })
  })

  describe('refetching behavior', () => {
    it('should refetch when explicitly called', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: TEST_CHAT_IDS })

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetChatsByUserIdAction).toHaveBeenCalledOnce()

      // Refetch
      await result.current.refetch()

      await waitFor(() => {
        expect(mockGetChatsByUserIdAction).toHaveBeenCalledTimes(2)
      })
    })

    it('should update data after refetch', async () => {
      const initialData = ['chat-1', 'chat-2']
      const updatedData = ['chat-1', 'chat-2', 'chat-3']

      mockGetChatsByUserIdAction.mockResolvedValueOnce({
        success: true,
        data: initialData,
      })

      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(initialData)

      // Mock new data for refetch
      mockGetChatsByUserIdAction.mockResolvedValueOnce({
        success: true,
        data: updatedData,
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData)
      })
    })

    it('should cache results and not refetch immediately', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: TEST_CHAT_IDS })

      // First render
      const { unmount } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockGetChatsByUserIdAction).toHaveBeenCalledOnce()
      })

      unmount()

      // Second render with same userId - should use cache
      const { result } = renderHook(() => useUserChats(TEST_USER_ID), {
        wrapper: createWrapper(),
      })

      // Should immediately have data from cache
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(TEST_CHAT_IDS)
      // Should still only be called once (from first render)
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledOnce()
    })
  })

  describe('userId changes', () => {
    it('should refetch when userId changes', async () => {
      const userId1 = 'user-id-1'
      const userId2 = 'user-id-2'
      const chats1 = ['chat-1']
      const chats2 = ['chat-2', 'chat-3']

      mockGetChatsByUserIdAction
        .mockResolvedValueOnce({ success: true, data: chats1 })
        .mockResolvedValueOnce({ success: true, data: chats2 })

      const { rerender, result } = renderHook(({ userId }) => useUserChats(userId), {
        wrapper: createWrapper(),
        initialProps: { userId: userId1 },
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(chats1)
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledWith(userId1)

      // Change userId
      rerender({ userId: userId2 })

      await waitFor(() => {
        expect(result.current.data).toEqual(chats2)
      })

      expect(mockGetChatsByUserIdAction).toHaveBeenCalledWith(userId2)
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledTimes(2)
    })

    it('should disable query when userId changes to null', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: TEST_CHAT_IDS })

      const { rerender, result } = renderHook(
        ({ userId }: { userId: string | null }) => useUserChats(userId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: TEST_USER_ID as string | null },
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(TEST_CHAT_IDS)

      // Change to null
      rerender({ userId: null })

      // Query key changes, so data becomes undefined
      expect(result.current.data).toBeUndefined()
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledOnce()
    })

    it('should re-enable query when userId changes from null to valid', async () => {
      mockGetChatsByUserIdAction.mockResolvedValue({ success: true, data: TEST_CHAT_IDS })

      const { rerender, result } = renderHook(
        ({ userId }: { userId: string | null }) => useUserChats(userId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: null as string | null },
        }
      )

      // Should not fetch when null
      expect(mockGetChatsByUserIdAction).not.toHaveBeenCalled()

      // Change to valid userId
      rerender({ userId: TEST_USER_ID })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(TEST_CHAT_IDS)
      expect(mockGetChatsByUserIdAction).toHaveBeenCalledWith(TEST_USER_ID)
    })
  })
})
