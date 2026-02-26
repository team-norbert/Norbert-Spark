import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChatTypeForm } from '@/view/hooks/useCreateChatTypeForm.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
vi.mock('next/navigation.js', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockMutateAsync = vi.fn()
const mockIsPending = { value: false }

vi.mock('@/view/hooks/queries/useCreateChatType.js', () => ({
  useCreateChatType: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending.value
    },
  }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeChangeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>
}

function makeCheckboxEvent(checked: boolean): React.ChangeEvent<HTMLInputElement> {
  return { target: { checked } } as React.ChangeEvent<HTMLInputElement>
}

function makeSubmitEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCreateChatTypeForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockIsPending.value = false
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('returns empty name and description', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.formData.name).toBe('')
      expect(result.current.formData.description).toBe('')
    })

    it('returns rag as false', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.formData.rag).toBe(false)
    })

    it('returns empty field errors', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.errors.name).toBe('')
      expect(result.current.errors.description).toBe('')
    })

    it('returns empty generalError and successMessage', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.generalError).toBe('')
      expect(result.current.successMessage).toBe('')
    })

    it('returns isSubmitting as false', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  // ── handleChange ──────────────────────────────────────────────────────────

  describe('handleChange', () => {
    it('updates the name field', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
      })

      expect(result.current.formData.name).toBe('My Chat Type')
    })

    it('updates the description field', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })

      expect(result.current.formData.description).toBe('A description')
    })

    it('clears the field error for that field when typing', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      // Trigger a validation error first by submitting an empty form
      act(() => {
        result.current.handleSubmit(makeSubmitEvent())
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Something'))
      })

      expect(result.current.errors.name).toBe('')
    })

    it('clears generalError when typing', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce(new Error('Server error'))

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('New name'))
      })

      expect(result.current.generalError).toBe('')
    })

    it('clears successMessage when typing', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({
        success: true,
        data: { name: 'My Chat Type' },
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Something else'))
      })

      expect(result.current.successMessage).toBe('')
    })
  })

  // ── handleRagChange ───────────────────────────────────────────────────────

  describe('handleRagChange', () => {
    it('sets rag to true when checkbox is checked', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleRagChange(makeCheckboxEvent(true))
      })

      expect(result.current.formData.rag).toBe(true)
    })

    it('sets rag back to false when checkbox is unchecked', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleRagChange(makeCheckboxEvent(true))
      })
      act(() => {
        result.current.handleRagChange(makeCheckboxEvent(false))
      })

      expect(result.current.formData.rag).toBe(false)
    })

    it('clears generalError when rag is toggled', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce(new Error('Server error'))

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      act(() => {
        result.current.handleRagChange(makeCheckboxEvent(true))
      })

      expect(result.current.generalError).toBe('')
    })

    it('clears successMessage when rag is toggled', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({
        success: true,
        data: { name: 'My Chat Type' },
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      act(() => {
        result.current.handleRagChange(makeCheckboxEvent(true))
      })

      expect(result.current.successMessage).toBe('')
    })
  })

  // ── validateForm / handleSubmit — validation failures ─────────────────────

  describe('handleSubmit — validation', () => {
    it('does not call mutateAsync when name is empty', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('sets name error when name is empty', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.errors.name).toBeTruthy()
    })

    it('sets description error when description is empty', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.errors.description).toBeTruthy()
    })

    it('sets name error when name exceeds 200 characters', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('a'.repeat(201)))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.errors.name).toBeTruthy()
    })

    it('sets description error when description exceeds 500 characters', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('a'.repeat(501)))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.errors.description).toBeTruthy()
    })

    it('calls event.preventDefault', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      const event = makeSubmitEvent()

      await act(async () => {
        await result.current.handleSubmit(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  // ── handleSubmit — success ─────────────────────────────────────────────────

  describe('handleSubmit — success', () => {
    it('calls mutateAsync with the current form data', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({
        success: true,
        data: { name: 'My Chat Type' },
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
        result.current.handleRagChange(makeCheckboxEvent(true))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'My Chat Type',
        description: 'A description',
        rag: true,
      })
    })

    it('sets successMessage using the created chat type name', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({
        success: true,
        data: { name: 'My Chat Type' },
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.successMessage).toBe('Chat type "My Chat Type" created successfully!')
    })

    it('does not set generalError on success', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({
        success: true,
        data: { name: 'My Chat Type' },
      })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('My Chat Type'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.generalError).toBe('')
    })

    it('does not set successMessage when result.success is false', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockResolvedValueOnce({ success: false, data: { name: 'X' } })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.successMessage).toBe('')
    })
  })

  // ── handleSubmit — error handling ─────────────────────────────────────────

  describe('handleSubmit — error handling', () => {
    it('sets name error on 409 conflict', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce({ status: 409 })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Duplicate Name'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.errors.name).toBe(
        'A chat type with this name already exists. Please choose a different name.'
      )
    })

    it('does not set generalError on 409 conflict', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce({ status: 409 })

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Duplicate Name'))
        result.current.handleChange('description')(makeChangeEvent('A description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.generalError).toBe('')
    })

    it('sets generalError from Error.message for non-409 errors', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce(new Error('Internal server error'))

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.generalError).toBe('Internal server error')
    })

    it('sets a generic generalError for unknown non-Error throws', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce('some string error')

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.generalError).toBe('An unexpected error occurred. Please try again.')
    })

    it('does not set successMessage on error', async () => {
      const { result } = renderHook(() => useCreateChatTypeForm())
      mockMutateAsync.mockRejectedValueOnce(new Error('Oops'))

      act(() => {
        result.current.handleChange('name')(makeChangeEvent('Valid Name'))
        result.current.handleChange('description')(makeChangeEvent('Valid description'))
      })
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent())
      })

      expect(result.current.successMessage).toBe('')
    })
  })

  // ── handleCancel ──────────────────────────────────────────────────────────

  describe('handleCancel', () => {
    it('navigates to /chat-types', () => {
      const { result } = renderHook(() => useCreateChatTypeForm())

      act(() => {
        result.current.handleCancel()
      })

      expect(mockPush).toHaveBeenCalledWith('/chat-types')
    })
  })

  // ── isSubmitting ──────────────────────────────────────────────────────────

  describe('isSubmitting', () => {
    it('reflects mutation isPending state', () => {
      mockIsPending.value = true
      const { result } = renderHook(() => useCreateChatTypeForm())

      expect(result.current.isSubmitting).toBe(true)
    })
  })
})
