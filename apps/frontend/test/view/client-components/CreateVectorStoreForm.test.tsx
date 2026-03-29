import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateVectorStoreForm } from '@/view/client-components/CreateVectorStoreForm.js'

// Mock the embedding models hook so tests don't require a QueryClientProvider
vi.mock('@/view/hooks/queries/useEmbeddingModels.js', () => ({
  useEmbeddingModels: () => ({
    embeddingModels: [
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000001',
        name: 'text-embedding-ada-002',
        provider: 'openai',
        dimension: 1536,
        status: 'legacy',
        release_year: 2022,
        recommended_usage: 'Only for backward compatibility with existing vector databases',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fill every *required* field with a sensible default value so tests that
 * only care about one particular field can rely on a complete, submittable
 * form without repeating boilerplate.
 *
 * NOTE: MUI required TextFields render their label as "Label *" (with an
 * aria-hidden asterisk span). We use regex matchers to do a substring match
 * so that exact-string lookups don't fail because of the trailing " *".
 */
function fillRequiredFields({
  chatTypeId = 'aabbccdd-1234-1234-1234-aabbccddee01',
  chunkOverlap = '50',
  chunkSize = '512',
  dimension = '1536',
  id = 'test-id-0000-0000-0000-000000000001',
  modelName = 'text-embedding-ada-002',
  modelProvider = 'openai',
  recommendedUsage = 'Best for semantic similarity',
  releaseYear = '2024',
  source = 'https://example.com',
  title = 'My Document',
} = {}) {
  fireEvent.change(screen.getByLabelText(/^vector store id/i), { target: { value: id } })
  fireEvent.change(screen.getAllByLabelText(/^title/i)[0]!, { target: { value: title } })
  fireEvent.change(screen.getAllByLabelText(/^source/i)[0]!, { target: { value: source } })
  fireEvent.change(screen.getByLabelText(/^model name/i), { target: { value: modelName } })
  fireEvent.change(screen.getByLabelText(/^model provider/i), {
    target: { value: modelProvider },
  })
  selectDimension(dimension)
  fireEvent.change(screen.getByLabelText(/^recommended usage/i), {
    target: { value: recommendedUsage },
  })
  fireEvent.change(screen.getByLabelText(/^release year/i), { target: { value: releaseYear } })
  fireEvent.change(screen.getByLabelText(/^chunk size/i), { target: { value: chunkSize } })
  fireEvent.change(screen.getByLabelText(/^chunk overlap/i), { target: { value: chunkOverlap } })
  fireEvent.change(screen.getByLabelText(/^chat type id/i), { target: { value: chatTypeId } })
}

/** Submit the form via the submit button. */
function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: /create vector store/i }))
}

/** Open the Dimension Select dropdown and click the given option. */
function selectDimension(value: string) {
  const selectRoot = document.querySelector(
    '[data-testid="embedding-models-dimension-select"]'
  ) as HTMLElement
  const trigger = (selectRoot.querySelector('[role="combobox"]') ?? selectRoot) as HTMLElement
  fireEvent.mouseDown(trigger)
  // CSS attribute selector is far faster than screen.getByRole which traverses the full ARIA tree
  fireEvent.click(document.querySelector(`li[role="option"][data-value="${value}"]`) as HTMLElement)
}

const DEFAULT_FILE_KEYS = ['uploads/file-a.pdf', 'uploads/file-b.pdf']

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateVectorStoreForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    // Shared render for all read-only snapshot-style assertions; avoids repeating
    // render() in every test body.  RTL's afterEach cleanup still runs per-test.
    beforeEach(() => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)
    })

    it('renders the "Create Vector Store" card title', () => {
      expect(screen.getByRole('heading', { name: /create vector store/i })).toBeInTheDocument()
    })

    it('renders the Documents section heading', () => {
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('renders the Embedding Models section heading', () => {
      expect(screen.getByText('Embedding Models')).toBeInTheDocument()
    })

    it('renders the Vector Embeddings section heading', () => {
      expect(screen.getByText('Vector Embeddings')).toBeInTheDocument()
    })

    it('renders the Chat AI Options section heading', () => {
      expect(screen.getByText('Chat AI Options')).toBeInTheDocument()
    })

    it('renders the Title and Source text fields', () => {
      expect(screen.getByLabelText(/^vector store id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^source/i)).toBeInTheDocument()
    })

    it('renders the Model Name and Model Provider text fields', () => {
      expect(screen.getByLabelText(/^model name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^model provider/i)).toBeInTheDocument()
    })

    it('renders Chunk Size and Chunk Overlap fields', () => {
      expect(screen.getByLabelText(/^chunk size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^chunk overlap/i)).toBeInTheDocument()
    })

    it('renders the Chat Type ID field', () => {
      expect(screen.getByLabelText(/^chat type id/i)).toBeInTheDocument()
    })

    it('renders all optional chatAIOptions fields', () => {
      expect(screen.getByLabelText(/^max tokens/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^temperature/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^top p/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^frequency penalty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^presence penalty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^stop sequences/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^max retries/i)).toBeInTheDocument()
    })

    it('renders the "Create Vector Store" submit button', () => {
      expect(screen.getByRole('button', { name: /create vector store/i })).toBeInTheDocument()
    })

    it('shows a caption for each uploaded file', () => {
      // This test needs non-empty fileKeys; the beforeEach render (fileKeys=[]) stays in
      // the document but does not contain these captions, so no false positives occur.
      render(<CreateVectorStoreForm fileKeys={DEFAULT_FILE_KEYS} onSubmit={mockOnSubmit} />)

      expect(screen.getByText(/File 1:.*file-a\.pdf/i)).toBeInTheDocument()
      expect(screen.getByText(/File 2:.*file-b\.pdf/i)).toBeInTheDocument()
    })

    it('does not show the fileKeys line when the array is empty', () => {
      expect(screen.queryByText(/files to embed/i)).not.toBeInTheDocument()
    })
  })

  // ── Initial state ───────────────────────────────────────────────────────────

  describe('Initial state', () => {
    // ── default props ──────────────────────────────────────────────────────────
    describe('default props', () => {
      beforeEach(() => {
        render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)
      })

      it('all text fields start empty', () => {
        // Note: maxTokens, temperature and topP are intentionally excluded here because
        // they are pre-populated with sensible defaults (1000, 0.7, 1) so users can
        // submit the form without having to fill in those optional fields manually.
        const labelRegexes = [
          /^vector store id/i,
          /^title/i,
          /^source/i,
          /^model name/i,
          /^model provider/i,
          /^chat type id/i,
          /^stop sequences/i,
        ]
        for (const labelRegex of labelRegexes) {
          expect((screen.getByLabelText(labelRegex) as HTMLInputElement).value).toBe('')
        }
      })

      it('max tokens, temperature, top p, frequency penalty, presence penalty and max retries start with their default values', () => {
        expect((screen.getByLabelText(/^max tokens/i) as HTMLInputElement).value).toBe('1000')
        expect((screen.getByLabelText(/^temperature/i) as HTMLInputElement).value).toBe('0.7')
        expect((screen.getByLabelText(/^top p/i) as HTMLInputElement).value).toBe('1')
        expect((screen.getByLabelText(/^frequency penalty/i) as HTMLInputElement).value).toBe('0')
        expect((screen.getByLabelText(/^presence penalty/i) as HTMLInputElement).value).toBe('0')
        expect((screen.getByLabelText(/^max retries/i) as HTMLInputElement).value).toBe('2')
      })

      it('chatTypeId is empty when initialChatTypeId is not provided', () => {
        expect((screen.getByLabelText(/^chat type id/i) as HTMLInputElement).value).toBe('')
      })

      it('id field starts empty', () => {
        expect((screen.getByLabelText(/^vector store id/i) as HTMLInputElement).value).toBe('')
      })

      it('dimension shows "— choose a dimension —" placeholder by default', () => {
        // The MUI Select shows the placeholder when no dimension has been chosen
        expect(screen.getByText('— choose a dimension —')).toBeInTheDocument()
      })
    })

    // ── with initialChatTypeId prop ────────────────────────────────────────────
    describe('with initialChatTypeId prop', () => {
      it('chatTypeId is pre-populated when initialChatTypeId is provided', () => {
        const id = 'aabbccdd-1234-1234-1234-aabbccddee01'
        render(
          <CreateVectorStoreForm fileKeys={[]} initialChatTypeId={id} onSubmit={mockOnSubmit} />
        )

        expect((screen.getByLabelText(/^chat type id/i) as HTMLInputElement).value).toBe(id)
      })

      it('id field is pre-populated from initialChatTypeId when provided', () => {
        const initialId = 'aabbccdd-1234-1234-1234-aabbccddee01'
        render(
          <CreateVectorStoreForm
            fileKeys={[]}
            initialChatTypeId={initialId}
            onSubmit={mockOnSubmit}
          />
        )

        expect((screen.getByLabelText(/^vector store id/i) as HTMLInputElement).value).toBe(
          initialId
        )
      })
    })
  })

  // ── Form submission — required fields ───────────────────────────────────────

  describe('Form submission — required fields', () => {
    it('calls onSubmit once when the form is submitted', () => {
      render(<CreateVectorStoreForm fileKeys={DEFAULT_FILE_KEYS} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('passes the correct documents shape', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ title: 'Heart of Darkness', source: 'https://gutenberg.org/hod' })
      submitForm()

      const { documents } = mockOnSubmit.mock.calls[0]![0]!
      expect(documents).toEqual([
        {
          title: 'Heart of Darkness',
          source: 'https://gutenberg.org/hod',
        },
      ])
    })

    it('passes the required id field', () => {
      const testId = 'abc12345-0000-0000-0000-000000000001'
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ id: testId })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.id).toBe(testId)
    })

    it('submits the id pre-populated from initialChatTypeId when the field is not changed', () => {
      const initialId = 'prepopulated-0000-0000-0000-000000000001'
      render(
        <CreateVectorStoreForm
          fileKeys={[]}
          initialChatTypeId={initialId}
          onSubmit={mockOnSubmit}
        />
      )

      fillRequiredFields({ id: initialId })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.id).toBe(initialId)
    })

    it('passes the correct embeddingModels shape', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelName: 'ada-002', modelProvider: 'openai' })
      submitForm()

      const { embeddingModels } = mockOnSubmit.mock.calls[0]![0]!
      expect(embeddingModels).toEqual({
        modelName: 'ada-002',
        modelProvider: 'openai',
        dimension: 1536, // default
        releaseYear: 2024, // default from fillRequiredFields
        recommendedUsage: 'Best for semantic similarity', // default from fillRequiredFields
      })
    })

    it('converts chunkSize and chunkOverlap to numbers', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ chunkSize: '256', chunkOverlap: '32' })
      submitForm()

      const { vectorEmbeddings } = mockOnSubmit.mock.calls[0]![0]!
      expect(vectorEmbeddings.chunkSize).toBe(256)
      expect(vectorEmbeddings.chunkOverlap).toBe(32)
      expect(typeof vectorEmbeddings.chunkSize).toBe('number')
      expect(typeof vectorEmbeddings.chunkOverlap).toBe('number')
    })

    it('includes chatTypeId in chatAIOptions', () => {
      const id = 'chattype-uuid-here-0001'
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ chatTypeId: id })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.chatTypeId).toBe(id)
    })
  })

  // ── Form submission — optional chatAIOptions ────────────────────────────────

  describe('Form submission — optional chatAIOptions fields', () => {
    it('omits optional fields from chatAIOptions when their inputs are empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields() // fills required fields; clear optional fields that have defaults
      fireEvent.change(screen.getByLabelText(/^max tokens/i), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText(/^temperature/i), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText(/^top p/i), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText(/^frequency penalty/i), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText(/^presence penalty/i), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText(/^max retries/i), { target: { value: '' } })
      submitForm()

      const { chatAIOptions } = mockOnSubmit.mock.calls[0]![0]!
      expect(chatAIOptions).not.toHaveProperty('maxTokens')
      expect(chatAIOptions).not.toHaveProperty('temperature')
      expect(chatAIOptions).not.toHaveProperty('topP')
      expect(chatAIOptions).not.toHaveProperty('frequencyPenalty')
      expect(chatAIOptions).not.toHaveProperty('presencePenalty')
      expect(chatAIOptions.stopSequences).toEqual([])
      expect(chatAIOptions).not.toHaveProperty('maxRetries')
    })

    it('includes maxTokens as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^max tokens/i), { target: { value: '4096' } })
      submitForm()

      const { chatAIOptions } = mockOnSubmit.mock.calls[0]![0]!
      expect(chatAIOptions.maxTokens).toBe(4096)
      expect(typeof chatAIOptions.maxTokens).toBe('number')
    })

    it('includes temperature as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^temperature/i), { target: { value: '0.7' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.temperature).toBe(0.7)
    })

    it('includes topP as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^top p/i), { target: { value: '0.9' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.topP).toBe(0.9)
    })

    it('includes frequencyPenalty as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^frequency penalty/i), { target: { value: '0.5' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.frequencyPenalty).toBe(0.5)
    })

    it('includes presencePenalty as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^presence penalty/i), { target: { value: '-0.3' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.presencePenalty).toBe(-0.3)
    })

    it('includes maxRetries as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^max retries/i), { target: { value: '3' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.maxRetries).toBe(3)
    })
  })

  // ── stopSequences parsing ────────────────────────────────────────────────────

  describe('stopSequences parsing', () => {
    it('splits a comma-separated string into an array', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^stop sequences/i), {
        target: { value: 'END,STOP,DONE' },
      })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.stopSequences).toEqual([
        'END',
        'STOP',
        'DONE',
      ])
    })

    it('trims whitespace from each entry', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^stop sequences/i), {
        target: { value: ' END , STOP , DONE ' },
      })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.stopSequences).toEqual([
        'END',
        'STOP',
        'DONE',
      ])
    })

    it('wraps a single value in an array', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^stop sequences/i), {
        target: { value: 'END' },
      })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.stopSequences).toEqual(['END'])
    })

    it('sends empty array for stopSequences when the field is empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields() // stop sequences field left empty
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.stopSequences).toEqual([])
    })
  })

  // ── Dimension Select ─────────────────────────────────────────────────────────

  describe('Dimension Select', () => {
    it('submits dimension 1536 when 1536 is selected', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ dimension: '1536' })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(1536)
    })

    it('selecting 3072 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      selectDimension('3072')
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(3072)
    })

    it('selecting 1024 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      selectDimension('1024')
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(1024)
    })

    it('selecting 768 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      selectDimension('768')
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(768)
    })

    it('selecting 384 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      selectDimension('384')
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(384)
    })
  })

  // ── Optional onSubmit prop ───────────────────────────────────────────────────

  describe('onSubmit prop is optional', () => {
    it('does not throw when onSubmit is not provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} />)

      fillRequiredFields()
      expect(() => submitForm()).not.toThrow()
    })
  })

  // ── Field interaction ────────────────────────────────────────────────────────

  describe('Field interaction', () => {
    it('reflects typed value in the Title field', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      const input = screen.getByLabelText(/^title/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'War and Peace' } })

      expect(input.value).toBe('War and Peace')
    })

    it('reflects typed value in the Source field', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      const input = screen.getByLabelText(/^source/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'https://source.example.com' } })

      expect(input.value).toBe('https://source.example.com')
    })

    it('reflects the initialChatTypeId value in the Chat Type ID field on mount', () => {
      const id = 'initial-chat-type-id-9999'
      render(<CreateVectorStoreForm fileKeys={[]} initialChatTypeId={id} onSubmit={mockOnSubmit} />)

      expect((screen.getByLabelText(/^chat type id/i) as HTMLInputElement).value).toBe(id)
    })

    it('allows the Chat Type ID field to be changed after mount', () => {
      const initial = 'initial-id'
      const updated = 'updated-id'
      render(
        <CreateVectorStoreForm fileKeys={[]} initialChatTypeId={initial} onSubmit={mockOnSubmit} />
      )

      const input = screen.getByLabelText(/^chat type id/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: updated } })

      expect(input.value).toBe(updated)
    })
  })

  // ── Embedding Model — dropdown vs manual entry validation ────────────────────

  describe('Embedding Model — dropdown vs manual entry validation', () => {
    /**
     * Opens the embedding models Select dropdown.
     * Uses the data-test-id on the Select root to locate the combobox trigger,
     * making it robust regardless of what text is currently displayed.
     */
    function openEmbeddingModelsDropdown() {
      const select = document.querySelector(
        '[data-testid="embedding-models-select"]'
      ) as HTMLElement
      const trigger = (select.querySelector('[role="combobox"]') ?? select) as HTMLElement
      fireEvent.mouseDown(trigger)
    }

    /** Selects the single mock model (text-embedding-ada-002) from the dropdown. */
    function selectEmbeddingModelFromDropdown() {
      openEmbeddingModelsDropdown()
      // Target the mock model by its known ID via CSS selector — faster than getByRole ARIA traversal
      fireEvent.click(
        document.querySelector(
          'li[role="option"][data-value="aaaaaaaa-0000-0000-0000-000000000001"]'
        ) as HTMLElement
      )
    }

    it('shows no conflict error when only the dropdown is used', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      selectEmbeddingModelFromDropdown()

      expect(
        screen.queryByText(/please use either the dropdown or manual entry/i)
      ).not.toBeInTheDocument()
    })

    it('shows no conflict error when only manual fields are filled', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByLabelText(/^model name/i), {
        target: { value: 'my-custom-model' },
      })
      fireEvent.change(screen.getByLabelText(/^model provider/i), {
        target: { value: 'custom-provider' },
      })

      expect(
        screen.queryByText(/please use either the dropdown or manual entry/i)
      ).not.toBeInTheDocument()
    })

    it('typing in modelName after dropdown selection clears the dropdown selection', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      selectEmbeddingModelFromDropdown()
      fireEvent.change(screen.getByLabelText(/^model name/i), {
        target: { value: 'custom-override' },
      })

      // No conflict error — typing in a manual field deselects the dropdown instead
      expect(
        screen.queryByText(/please use either the dropdown or manual entry/i)
      ).not.toBeInTheDocument()
      // The dropdown combobox should no longer show the selected model name
      const select = document.querySelector(
        '[data-testid="embedding-models-select"]'
      ) as HTMLElement
      const combobox = (select.querySelector('[role="combobox"]') ?? select) as HTMLElement
      expect(combobox).not.toHaveTextContent('text-embedding-ada-002')
    })

    it('typing in modelProvider after dropdown selection clears the dropdown selection', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      selectEmbeddingModelFromDropdown()
      fireEvent.change(screen.getByLabelText(/^model provider/i), {
        target: { value: 'custom-provider' },
      })

      // No conflict error — typing in a manual field deselects the dropdown instead
      expect(
        screen.queryByText(/please use either the dropdown or manual entry/i)
      ).not.toBeInTheDocument()
    })

    it('blocks form submission when dimension is missing after switching from dropdown to manual entry', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      // Selecting from dropdown clears dimension (mutual exclusion)
      selectEmbeddingModelFromDropdown()
      // Typing into modelName clears selectedModelId — leaving dimension empty
      fireEvent.change(screen.getByLabelText(/^model name/i), {
        target: { value: 'custom-override' },
      })
      // Both selectedModelId='' and dimension='' → form cannot be submitted

      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when manual entry mode is used but dimension is not selected', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      // Fill all required fields except dimension — no dropdown model selected either
      fireEvent.change(screen.getByLabelText(/^vector store id/i), {
        target: { value: 'test-id-0000-0000-0000-000000000001' },
      })
      fireEvent.change(screen.getAllByLabelText(/^title/i)[0]!, {
        target: { value: 'My Document' },
      })
      fireEvent.change(screen.getAllByLabelText(/^source/i)[0]!, {
        target: { value: 'https://example.com' },
      })
      // Manual entry fields — triggers isManualEntry = true
      fireEvent.change(screen.getByLabelText(/^model name/i), {
        target: { value: 'text-embedding-ada-002' },
      })
      fireEvent.change(screen.getByLabelText(/^model provider/i), { target: { value: 'openai' } })
      // Intentionally skip selecting a dimension
      fireEvent.change(screen.getByLabelText(/^chunk size/i), { target: { value: '512' } })
      fireEvent.change(screen.getByLabelText(/^chunk overlap/i), { target: { value: '50' } })
      fireEvent.change(screen.getByLabelText(/^chat type id/i), {
        target: { value: 'aabbccdd-1234-1234-1234-aabbccddee01' },
      })

      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when modelProvider is not an allowed value', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelProvider: 'invalid-provider' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when modelProvider is empty in manual entry mode', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelProvider: '' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when modelName is empty in manual entry mode', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelName: '' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when releaseYear is below 2000', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ releaseYear: '1999' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when releaseYear is above 2027', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ releaseYear: '2028' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('blocks form submission when releaseYear is not an integer', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ releaseYear: '2024.5' })
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('allows submission when releaseYear is exactly 2000 (lower bound)', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ releaseYear: '2000' })
      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledOnce()
      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.releaseYear).toBe(2000)
    })

    it('allows submission when releaseYear is exactly 2027 (upper bound)', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ releaseYear: '2027' })
      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledOnce()
      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.releaseYear).toBe(2027)
    })

    it('blocks form submission when modelProvider is google with a task-type model but taskType is empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelName: 'text-embedding-005', modelProvider: 'google' })
      // taskType select is enabled but left empty
      submitForm()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('allows form submission when modelProvider is google with a task-type model and taskType is set', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelName: 'text-embedding-005', modelProvider: 'google' })

      // Select a taskType from the enabled select
      const taskTypeSelect = document.querySelector(
        '[data-testid="embedding-models-task-type-select"]'
      ) as HTMLElement
      const trigger = (taskTypeSelect.querySelector('[role="combobox"]') ??
        taskTypeSelect) as HTMLElement
      fireEvent.mouseDown(trigger)
      fireEvent.click(
        document.querySelector('li[role="option"][data-value="RETRIEVAL_QUERY"]') as HTMLElement
      )

      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledOnce()
      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.taskType).toBe('RETRIEVAL_QUERY')
    })

    it('allows form submission for google provider with a non-task-type model name without taskType', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ modelName: 'text-embedding-gecko', modelProvider: 'google' })
      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledOnce()
    })

    it('submits existingModelId when a dropdown model is selected and no manual entry is made', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      selectEmbeddingModelFromDropdown()
      // Fill remaining required fields without touching manual embedding fields
      fireEvent.change(screen.getByLabelText(/^vector store id/i), {
        target: { value: 'test-id-0000-0000-0000-000000000001' },
      })
      fireEvent.change(screen.getAllByLabelText(/^title/i)[0]!, {
        target: { value: 'My Document' },
      })
      fireEvent.change(screen.getAllByLabelText(/^source/i)[0]!, {
        target: { value: 'https://example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^chunk size/i), { target: { value: '512' } })
      fireEvent.change(screen.getByLabelText(/^chunk overlap/i), { target: { value: '50' } })
      fireEvent.change(screen.getByLabelText(/^chat type id/i), {
        target: { value: 'aabbccdd-1234-1234-1234-aabbccddee01' },
      })
      submitForm()

      const { embeddingModels } = mockOnSubmit.mock.calls[0]![0]!
      expect(embeddingModels).toEqual({ existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001' })
      expect(embeddingModels).not.toHaveProperty('modelName')
      expect(embeddingModels).not.toHaveProperty('modelProvider')
      expect(embeddingModels).not.toHaveProperty('dimension')
    })

    it('selecting a model from the dropdown clears the manual entry fields', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      // Enter manual values first
      fireEvent.change(screen.getByLabelText(/^model name/i), {
        target: { value: 'custom-model' },
      })
      fireEvent.change(screen.getByLabelText(/^model provider/i), {
        target: { value: 'custom-provider' },
      })

      // Picking from the dropdown clears the manual fields
      selectEmbeddingModelFromDropdown()

      expect((screen.getByLabelText(/^model name/i) as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText(/^model provider/i) as HTMLInputElement).value).toBe('')
    })

    it('selecting a pre-seeded model does NOT autopopulate model name, model provider, or dimension', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      // All manual fields start empty
      expect((screen.getByLabelText(/^model name/i) as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText(/^model provider/i) as HTMLInputElement).value).toBe('')
      const dimensionSelect = document.querySelector(
        '[data-testid="embedding-models-dimension-select"]'
      ) as HTMLElement
      const dimensionCombobox = (dimensionSelect.querySelector('[role="combobox"]') ??
        dimensionSelect) as HTMLElement
      expect(dimensionCombobox).toHaveTextContent('— choose a dimension —')

      // Select the pre-seeded model from the dropdown
      selectEmbeddingModelFromDropdown()

      // Manual fields must remain empty — dropdown and manual entry are mutually exclusive
      expect((screen.getByLabelText(/^model name/i) as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText(/^model provider/i) as HTMLInputElement).value).toBe('')
      expect(dimensionCombobox).toHaveTextContent('— choose a dimension —')
    })
  })
})
