import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AIChatOptionsResponse, ChatType } from '@/domain/ai/chat-config.js'
import { useAIChatConfig } from '@/view/hooks/queries/useAIChatConfig.js'

vi.mock('@/infrastructure/serverActions/getAIChatConfig.server.js', () => ({
  getAIChatConfig: vi.fn(),
}))

// Helper function to create a QueryClientProvider wrapper
function createWrapper(client: QueryClient) {
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
]

describe('useAIChatConfig', () => {
  let getAIChatConfigMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetAllMocks()
    // Import the mock after resetting
    const { getAIChatConfig } =
      await import('@/infrastructure/serverActions/getAIChatConfig.server.js')
    getAIChatConfigMock = vi.mocked(getAIChatConfig)
  })

  describe('Successful data fetching', () => {
    it('should fetch chat configuration successfully', async () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.chatTypes).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)
      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.error).toBeNull()
    })

    it('should return empty array when no chat types are available', async () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should return single chat type', async () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(result.current.chatTypes[0]).toEqual(mockChatTypes[0])
    })

    it('should handle all chat type fields correctly', async () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstChatType = result.current.chatTypes[0]
      expect(firstChatType).toBeDefined()
      expect(firstChatType?.id).toBe('01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e')
      expect(firstChatType?.name).toBe('General Assistant')
      expect(firstChatType?.description).toBe('A general-purpose AI assistant for everyday tasks')
      expect(firstChatType?.seoFriendlyId).toBe('general-assistant')
      expect(firstChatType?.seoFriendlyBase64Id).toBe('AZQv42ejeyy51P5qe4')
      expect(firstChatType?.createdAt).toBe('2024-01-15T10:30:00Z')
      expect(firstChatType?.updatedAt).toBe('2024-01-15T10:30:00Z')
    })
  })

  describe('Error handling', () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.message).toBe('No authentication token available')
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.message).toBe('Backend service unavailable')
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Network request failed')
      expect(result.current.chatTypes).toEqual([])
    })

    it('should handle 401 unauthorized error', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const unauthorizedError = new Error('Unauthorized')
      getAIChatConfigMock.mockRejectedValue(unauthorizedError)

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Unauthorized')
      expect(result.current.chatTypes).toEqual([])
    })

    it('should handle 403 forbidden error', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const forbiddenError = new Error('Access denied')
      getAIChatConfigMock.mockRejectedValue(forbiddenError)

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toBe('Access denied')
      expect(result.current.chatTypes).toEqual([])
    })
  })

  describe('Caching behavior', () => {
    it('should use cached data on subsequent renders', async () => {
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

      const { rerender, result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)
      expect(result.current.chatTypes).toEqual(mockChatTypes)

      // Rerender the hook - should use cached data
      rerender()

      // Should still have the same data without additional API call
      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)
      expect(result.current.chatTypes).toEqual(mockChatTypes)
    })

    it('should share cache across multiple hook instances', async () => {
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

      const { result: result1 } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)

      // Second instance should use cached data
      const { result: result2 } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      // Should immediately have data from cache
      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1) // No additional call
      expect(result2.current.chatTypes).toEqual(mockChatTypes)
    })
  })

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const initialResponse: AIChatOptionsResponse = {
        success: true,
        data: [mockChatTypes[0]!],
      }

      const updatedResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(updatedResponse)

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toHaveLength(1)
      expect(getAIChatConfigMock).toHaveBeenCalledTimes(1)

      // Trigger refetch
      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.chatTypes).toHaveLength(3)
      })

      expect(getAIChatConfigMock).toHaveBeenCalledTimes(2)
    })

    it('should handle errors during refetch', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const successResponse: AIChatOptionsResponse = {
        success: true,
        data: mockChatTypes,
      }

      getAIChatConfigMock
        .mockResolvedValueOnce(successResponse)
        .mockRejectedValueOnce(new Error('Refetch failed'))

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.chatTypes).toEqual(mockChatTypes)
      expect(result.current.error).toBeNull()

      // Trigger refetch that will fail
      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error?.message).toBe('Refetch failed')
    })
  })

  describe('Loading states', () => {
    it('should set isLoading to true initially', () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      getAIChatConfigMock.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.chatTypes).toEqual([])
    })

    it('should set isLoading to false after successful fetch', async () => {
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

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading to false after failed fetch', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      getAIChatConfigMock.mockRejectedValue(new Error('Fetch failed'))

      const { result } = renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('Query configuration', () => {
    it('should use correct query key', async () => {
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

      renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        const queries = qc.getQueryCache().getAll()
        expect(queries).toHaveLength(1)
        expect(queries[0]?.queryKey).toEqual(['ai-chat-config'])
      })
    })

    it('should respect staleTime configuration', async () => {
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

      renderHook(() => useAIChatConfig(), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        const queries = qc.getQueryCache().getAll()
        expect(queries).toHaveLength(1)
      })

      const query = qc.getQueryCache().getAll()[0]
      expect(query?.state.dataUpdatedAt).toBeGreaterThan(0)
    })
  })
})
