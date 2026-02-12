import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { getAIChatTypes } from '@/infrastructure/serverActions/getAIChatTypes.server.js'
import { useAIChatTypes } from '@/view/hooks/queries/useAIChatTypes.js'

// Mock the server action
vi.mock('@/infrastructure/serverActions/getAIChatTypes.server.js', () => ({
  getAIChatTypes: vi.fn(),
}))

const mockChatTypes: ChatType[] = [
  {
    id: '019c50e0-b3ea-7bd5-849c-bc2c78a7d911',
    name: 'General Assistant',
    seoFriendlyId: 'general-assistant',
    seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
    description: 'A general purpose AI assistant',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '019c50e0-b3ea-7bd5-849c-bc2c78a7d912',
    name: 'Code Helper',
    seoFriendlyId: 'code-helper',
    seoFriendlyBase64Id: 'XyZaBcDeFgHiJkLmNoPqRs',
    description: 'Specialized in coding assistance',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

describe('useAIChatTypes', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('successful fetch', () => {
    it('should fetch and return chat types successfully', async () => {
      vi.mocked(getAIChatTypes).mockResolvedValue({
        success: true,
        data: mockChatTypes,
      })

      const { result } = renderHook(() => useAIChatTypes(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.chatTypes).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.error).toBeNull()
    })

    it('should return empty array when no chat types exist', async () => {
      vi.mocked(getAIChatTypes).mockResolvedValue({
        success: true,
        data: [],
      })

      const { result } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch chat types'
      vi.mocked(getAIChatTypes).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(errorMessage)
    })

    it('should handle network errors', async () => {
      vi.mocked(getAIChatTypes).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Network error')
    })
  })

  describe('refetch', () => {
    it('should refetch data when refetch is called', async () => {
      vi.mocked(getAIChatTypes).mockResolvedValue({
        success: true,
        data: mockChatTypes,
      })

      const { result } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual(mockChatTypes)

      // Mock a new response
      const updatedChatTypes = [
        ...mockChatTypes,
        {
          id: '019c50e0-b3ea-7bd5-849c-bc2c78a7d913',
          name: 'New Chat Type',
          seoFriendlyId: 'new-chat-type',
          seoFriendlyBase64Id: 'NeWcHaTtYpEaBcDeFgHiJk',
          description: 'A new chat type',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ]

      vi.mocked(getAIChatTypes).mockResolvedValue({
        success: true,
        data: updatedChatTypes,
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.chatTypes).toEqual(updatedChatTypes)
      })
    })
  })

  describe('caching', () => {
    it('should cache results and not refetch immediately', async () => {
      vi.mocked(getAIChatTypes).mockResolvedValue({
        success: true,
        data: mockChatTypes,
      })

      const { result: result1 } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(vi.mocked(getAIChatTypes)).toHaveBeenCalledTimes(1)

      // Second render should use cached data
      const { result: result2 } = renderHook(() => useAIChatTypes(), { wrapper })

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should still be called only once due to caching
      expect(vi.mocked(getAIChatTypes)).toHaveBeenCalledTimes(1)
      expect(result2.current.chatTypes).toEqual(mockChatTypes)
    })
  })
})
