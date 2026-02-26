import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { getAIChatSettingsById } from '@/infrastructure/serverActions/getAIChatSettingsById.server.js'
import { updateAIChatSettingsById } from '@/infrastructure/serverActions/updateAIChatSettingsById.server.js'
import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/infrastructure/serverActions/getAIChatSettingsById.server.js')
vi.mock('@/infrastructure/serverActions/updateAIChatSettingsById.server.js')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHAT_TYPE_ID = 'chat-type-uuid-001'

const baseSettings = {
  id: 'settings-uuid-001',
  chatTypeId: CHAT_TYPE_ID,
  prompt: 'You are a helpful assistant.',
  maxTokens: 2048,
  temperature: 0.7,
  topP: 0.95,
  frequencyPenalty: 0.1,
  presencePenalty: 0.2,
  topK: 40,
  stopSequences: ['END', '###'],
  seed: 42,
  maxRetries: 3,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
}

const successResponse = { success: true, data: baseSettings }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockNavigateHome = vi.fn()
const mockSignOut = vi.fn()

function renderForm(props: Partial<Parameters<typeof AIOptionsForm>[0]> = {}) {
  render(
    <AIOptionsForm
      chatTypeId={CHAT_TYPE_ID}
      onNavigateHome={mockNavigateHome}
      onSignOut={mockSignOut}
      {...props}
    />
  )
}

async function renderAndWaitForLoad(
  props: Partial<Parameters<typeof AIOptionsForm>[0]> = {}
): Promise<void> {
  renderForm(props)
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AIOptionsForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(getAIChatSettingsById as Mock).mockResolvedValue(successResponse)
    ;(updateAIChatSettingsById as Mock).mockResolvedValue(undefined)
    window.scrollTo = vi.fn() as typeof window.scrollTo
  })

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading spinner while fetching', () => {
      ;(getAIChatSettingsById as Mock).mockReturnValue(new Promise(() => {}))
      renderForm()

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('hides the loading spinner after data loads', async () => {
      await renderAndWaitForLoad()

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('calls getAIChatSettingsById with the provided chatTypeId', async () => {
      await renderAndWaitForLoad()

      expect(getAIChatSettingsById).toHaveBeenCalledWith(CHAT_TYPE_ID)
    })
  })

  // ── Rendering after load ──────────────────────────────────────────────────

  describe('rendering after load', () => {
    it('renders the page title', async () => {
      await renderAndWaitForLoad()

      expect(
        screen.getByRole('heading', { name: /ai chat options configuration/i })
      ).toBeInTheDocument()
    })

    it('renders the Prompt field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('prompt-input')).toBeInTheDocument()
    })

    it('renders the Max Tokens field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-tokens-input')).toBeInTheDocument()
    })

    it('renders the Temperature field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('temperature-input')).toBeInTheDocument()
    })

    it('renders the Top P field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('top-p-input')).toBeInTheDocument()
    })

    it('renders the Frequency Penalty field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('frequency-penalty-input')).toBeInTheDocument()
    })

    it('renders the Presence Penalty field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('presence-penalty-input')).toBeInTheDocument()
    })

    it('renders the Top K field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('top-k-input')).toBeInTheDocument()
    })

    it('renders the Stop Sequences field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('stop-sequences-input')).toBeInTheDocument()
    })

    it('renders the Seed field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('seed-input')).toBeInTheDocument()
    })

    it('renders the Max Retries field', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-retries-input')).toBeInTheDocument()
    })

    it('renders the Save AI Options button', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('save-button')).toHaveTextContent('Save AI Options')
    })
  })

  // ── Field values ──────────────────────────────────────────────────────────

  describe('field values from fetched data', () => {
    it('displays the prompt value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('prompt-input').querySelector('textarea')).toHaveValue(
        'You are a helpful assistant.'
      )
    })

    it('displays the maxTokens value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-tokens-input').querySelector('input')).toHaveValue(2048)
    })

    it('displays the temperature value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('temperature-input').querySelector('input')).toHaveValue(0.7)
    })

    it('displays the topP value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('top-p-input').querySelector('input')).toHaveValue(0.95)
    })

    it('displays stopSequences as comma-separated string', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('stop-sequences-input').querySelector('input')).toHaveValue(
        'END, ###'
      )
    })

    it('displays empty string for null stopSequences', async () => {
      ;(getAIChatSettingsById as Mock).mockResolvedValue({
        success: true,
        data: { ...baseSettings, stopSequences: null },
      })
      await renderAndWaitForLoad()

      expect(screen.getByTestId('stop-sequences-input').querySelector('input')).toHaveValue('')
    })

    it('displays the seed value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('seed-input').querySelector('input')).toHaveValue(42)
    })

    it('displays the maxRetries value', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-retries-input').querySelector('input')).toHaveValue(3)
    })

    it('displays empty string for null numeric fields', async () => {
      ;(getAIChatSettingsById as Mock).mockResolvedValue({
        success: true,
        data: { ...baseSettings, maxTokens: null, temperature: null },
      })
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-tokens-input').querySelector('input')).toHaveValue(null)
      expect(screen.getByTestId('temperature-input').querySelector('input')).toHaveValue(null)
    })
  })

  // ── Disabled fields ───────────────────────────────────────────────────────

  describe('disabled fields', () => {
    it('Max Tokens field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-tokens-input').querySelector('input')).toBeDisabled()
    })

    it('Temperature field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('temperature-input').querySelector('input')).toBeDisabled()
    })

    it('Top P field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('top-p-input').querySelector('input')).toBeDisabled()
    })

    it('Frequency Penalty field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('frequency-penalty-input').querySelector('input')).toBeDisabled()
    })

    it('Presence Penalty field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('presence-penalty-input').querySelector('input')).toBeDisabled()
    })

    it('Top K field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('top-k-input').querySelector('input')).toBeDisabled()
    })

    it('Stop Sequences field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('stop-sequences-input').querySelector('input')).toBeDisabled()
    })

    it('Seed field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('seed-input').querySelector('input')).toBeDisabled()
    })

    it('Max Retries field is disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('max-retries-input').querySelector('input')).toBeDisabled()
    })

    it('Prompt field is NOT disabled', async () => {
      await renderAndWaitForLoad()

      expect(screen.getByTestId('prompt-input').querySelector('textarea')).not.toBeDisabled()
    })
  })

  // ── Fetch error handling ──────────────────────────────────────────────────

  describe('fetch error handling', () => {
    it('shows an error alert when getAIChatSettingsById rejects', async () => {
      ;(getAIChatSettingsById as Mock).mockRejectedValue(new Error('Network failure'))
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network failure')
      })
    })

    it('shows an error alert when success is false', async () => {
      ;(getAIChatSettingsById as Mock).mockResolvedValue({ success: false, data: null })
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch AI settings')
      })
    })

    it('shows a generic error message for non-Error rejections', async () => {
      ;(getAIChatSettingsById as Mock).mockRejectedValue('unknown error')
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('An error occurred')
      })
    })

    it('does not show an error alert on successful fetch', async () => {
      await renderAndWaitForLoad()

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  // ── Form submission ───────────────────────────────────────────────────────

  describe('form submission', () => {
    it('calls updateAIChatSettingsById with the correct chatTypeId and payload', async () => {
      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(updateAIChatSettingsById).toHaveBeenCalledWith(
          CHAT_TYPE_ID,
          expect.objectContaining({
            prompt: 'You are a helpful assistant.',
            maxTokens: 2048,
            temperature: 0.7,
            topP: 0.95,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            topK: 40,
            stopSequences: ['END', '###'],
            seed: 42,
            maxRetries: 3,
          })
        )
      })
    })

    it('shows a success alert after a successful save', async () => {
      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('AI options updated successfully!')
      })
    })

    it('calls window.scrollTo after a successful save', async () => {
      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      })
    })

    it('shows an error alert when updateAIChatSettingsById rejects', async () => {
      ;(updateAIChatSettingsById as Mock).mockRejectedValue(new Error('Save failed'))
      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
      })
    })

    it('clears a previous error before re-submitting', async () => {
      ;(updateAIChatSettingsById as Mock)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce(undefined)

      await renderAndWaitForLoad()

      const form = screen.getByTestId('save-button').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('First failure')
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('AI options updated successfully!')
      })
    })

    it('disables the save button while submitting', async () => {
      let resolveUpdate!: () => void
      ;(updateAIChatSettingsById as Mock).mockReturnValue(
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        })
      )

      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toBeDisabled()
      })

      resolveUpdate()

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).not.toBeDisabled()
      })
    })

    it('shows "Saving..." on the button while submitting', async () => {
      ;(updateAIChatSettingsById as Mock).mockReturnValue(new Promise(() => {}))

      await renderAndWaitForLoad()

      fireEvent.submit(screen.getByTestId('save-button').closest('form')!)

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toHaveTextContent('Saving...')
      })
    })
  })

  // ── Prompt field interaction ──────────────────────────────────────────────

  describe('prompt field interaction', () => {
    it('updates the prompt value when the user types', async () => {
      await renderAndWaitForLoad()

      const textarea = screen.getByTestId('prompt-input').querySelector('textarea')!
      fireEvent.change(textarea, { target: { value: 'New system prompt' } })

      expect(textarea).toHaveValue('New system prompt')
    })

    it('sets the prompt field to null when cleared', async () => {
      await renderAndWaitForLoad()

      const form = screen.getByTestId('save-button').closest('form')!
      const textarea = screen.getByTestId('prompt-input').querySelector('textarea')!

      // Clear the prompt
      fireEvent.change(textarea, { target: { value: '' } })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(updateAIChatSettingsById).toHaveBeenCalledWith(
          CHAT_TYPE_ID,
          expect.objectContaining({ prompt: null })
        )
      })
    })
  })

  // ── Header callbacks ──────────────────────────────────────────────────────

  describe('header callbacks', () => {
    it('calls onNavigateHome when the Home button is clicked', async () => {
      await renderAndWaitForLoad()

      fireEvent.click(screen.getByRole('button', { name: /home/i }))

      expect(mockNavigateHome).toHaveBeenCalledTimes(1)
    })

    it('calls onSignOut when the Sign Out button is clicked', async () => {
      await renderAndWaitForLoad()

      fireEvent.click(screen.getByTestId('sign-out-button'))

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})
