import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreateChatTypeData, CreateChatTypeResponse } from '@/domain/ai/chat-config.js'
import { createAIChatSettingsById } from '@/infrastructure/serverActions/createAIChatSettingsById.server.js'
import { createChatType } from '@/infrastructure/serverActions/createChatType.server.js'
import { useCreateChatType } from '@/view/hooks/queries/useCreateChatType.js'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation.js', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock logger — use vi.hoisted() so the variable is available inside the hoisted vi.mock() factory
const mockLoggerError = vi.hoisted(() => vi.fn())
vi.mock('@/infrastructure/logging/logger.js', () => ({
  createLogger: () => ({ error: mockLoggerError }),
}))

// Mock server actions
vi.mock('@/infrastructure/serverActions/createChatType.server.js', () => ({
  createChatType: vi.fn(),
}))

vi.mock('@/infrastructure/serverActions/createAIChatSettingsById.server.js', () => ({
  createAIChatSettingsById: vi.fn(),
}))

// Helper to create a QueryClientProvider wrapper
function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockInput: CreateChatTypeData = {
  name: 'Support Chat',
  description: 'Customer support chat type',
  rag: false,
}

const mockChatTypeId = '11111111-1111-1111-1111-111111111111'

const mockSuccessResponse: CreateChatTypeResponse = {
  success: true,
  data: {
    id: mockChatTypeId,
    name: 'Support Chat',
    description: 'Customer support chat type',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    seoFriendlyId: 'support-chat',
    seoFriendlyBase64Id: 'EREREREREREREREREREREA',
    rag: false,
  },
}

const mockFailureResponse: CreateChatTypeResponse = {
  success: false,
  data: {
    id: mockChatTypeId,
    name: 'Support Chat',
    description: 'Customer support chat type',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    seoFriendlyId: 'support-chat',
    seoFriendlyBase64Id: 'EREREREREREREREREREREA',
    rag: false,
  },
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useCreateChatType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Successful full flow ──────────────────────────────────────────────────

  describe('successful creation', () => {
    it('calls createChatType with the provided input data', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      expect(vi.mocked(createChatType)).toHaveBeenCalledWith(mockInput)
    })

    it('seeds initial AI settings with the new chat type id', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      expect(vi.mocked(createAIChatSettingsById)).toHaveBeenCalledWith(mockChatTypeId, {
        chatTypeId: mockChatTypeId,
        prompt: 'Enter prompt here',
      })
    })

    it('returns the result from createChatType', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      const response = await act(async () => result.current.mutateAsync(mockInput))

      expect(response).toEqual(mockSuccessResponse)
    })

    it('invalidates the ai-chat-config query', async () => {
      const qc = new QueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ai-chat-config'] })
      })
    })

    it('redirects to /chat-types', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/chat-types')
      })
    })
  })

  // ── success: false ────────────────────────────────────────────────────────

  describe('when createChatType returns success: false', () => {
    it('does not call createAIChatSettingsById', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockFailureResponse)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      expect(vi.mocked(createAIChatSettingsById)).not.toHaveBeenCalled()
    })

    it('does not redirect to /chat-types', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockFailureResponse)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not invalidate any queries', async () => {
      const qc = new QueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
      vi.mocked(createChatType).mockResolvedValue(mockFailureResponse)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      expect(invalidateSpy).not.toHaveBeenCalled()
    })

    it('still returns the result from createChatType', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockFailureResponse)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      const response = await act(async () => result.current.mutateAsync(mockInput))

      expect(response).toEqual(mockFailureResponse)
    })
  })

  // ── createAIChatSettingsById throws ──────────────────────────────────────

  describe('when createAIChatSettingsById throws', () => {
    it('rejects with a user-friendly error about manual configuration', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await expect(
        act(async () => {
          await result.current.mutateAsync(mockInput)
        })
      ).rejects.toThrow(
        'The chat type was created, but initial AI settings could not be created. ' +
          'Please open the new chat type and configure its AI settings manually.'
      )
    })

    it('logs the error with the original cause and chat type id', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      const settingsError = new Error('Network error')
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockRejectedValue(settingsError)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput).catch(() => {})
      })

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to seed initial AI settings for new chat type',
        settingsError,
        { chatTypeId: mockChatTypeId }
      )
    })

    it('does not redirect', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput).catch(() => {})
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // ── createChatType throws ─────────────────────────────────────────────────

  describe('when createChatType throws', () => {
    it('rejects the mutation with the original error', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      vi.mocked(createChatType).mockRejectedValue(new Error('Request failed'))

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await expect(
        act(async () => {
          await result.current.mutateAsync(mockInput)
        })
      ).rejects.toThrow('Request failed')
    })

    it('does not call createAIChatSettingsById', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      vi.mocked(createChatType).mockRejectedValue(new Error('Request failed'))

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput).catch(() => {})
      })

      expect(vi.mocked(createAIChatSettingsById)).not.toHaveBeenCalled()
    })
  })

  // ── Mutation states ───────────────────────────────────────────────────────

  describe('mutation states', () => {
    it('starts in idle state', () => {
      const qc = new QueryClient()
      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      expect(result.current.isIdle).toBe(true)
      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('transitions to success state after a successful mutation', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.isPending).toBe(false)
        expect(result.current.isError).toBe(false)
      })
    })

    it('transitions to error state when mutation fails', async () => {
      const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      vi.mocked(createChatType).mockRejectedValue(new Error('Request failed'))

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput).catch(() => {})
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.isPending).toBe(false)
        expect(result.current.isSuccess).toBe(false)
      })
    })

    it('resets to idle state after calling reset()', async () => {
      const qc = new QueryClient()
      vi.mocked(createChatType).mockResolvedValue(mockSuccessResponse)
      vi.mocked(createAIChatSettingsById).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCreateChatType(), { wrapper: createWrapper(qc) })

      await act(async () => {
        await result.current.mutateAsync(mockInput)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      act(() => {
        result.current.reset()
      })

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.data).toBeUndefined()
      })
    })
  })
})
