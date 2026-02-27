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
  distanceMetric = 'cosine',
  id = 'test-id-0000-0000-0000-000000000001',
  modelName = 'text-embedding-ada-002',
  modelProvider = 'openai',
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
  // distanceMetric is a Select; only interact if a non-default value is needed
  if (distanceMetric !== 'cosine') {
    selectDistanceMetric(distanceMetric)
  }
  fireEvent.change(screen.getByLabelText(/^chunk size/i), { target: { value: chunkSize } })
  fireEvent.change(screen.getByLabelText(/^chunk overlap/i), { target: { value: chunkOverlap } })
  fireEvent.change(screen.getByLabelText(/^chat type id/i), { target: { value: chatTypeId } })
}

/** Submit the form via the submit button. */
function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: /create vector store/i }))
}

/** Open the Distance Metric Select dropdown and click the given option. */
function selectDistanceMetric(value: string) {
  const selectButton = screen
    .getByText('cosine')
    .closest('[role="combobox"], [role="button"]') as HTMLElement
  fireEvent.mouseDown(selectButton)
  fireEvent.click(screen.getByRole('option', { name: value }))
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
    it('renders the "Create Vector Store" card title', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('heading', { name: /create vector store/i })).toBeInTheDocument()
    })

    it('renders the Documents section heading', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('renders the Embedding Models section heading', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Embedding Models')).toBeInTheDocument()
    })

    it('renders the Vector Embeddings section heading', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Vector Embeddings')).toBeInTheDocument()
    })

    it('renders the Chat AI Options section heading', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Chat AI Options')).toBeInTheDocument()
    })

    it('renders the Title and Source text fields', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/^vector store id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^source/i)).toBeInTheDocument()
    })

    it('renders the Model Name and Model Provider text fields', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/^model name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^model provider/i)).toBeInTheDocument()
    })

    it('renders Distance Metric, Chunk Size and Chunk Overlap fields', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/^distance metric/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^chunk size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^chunk overlap/i)).toBeInTheDocument()
    })

    it('renders the Chat Type ID field', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/^chat type id/i)).toBeInTheDocument()
    })

    it('renders all optional chatAIOptions fields', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/^max tokens/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^temperature/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^top p/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^frequency penalty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^presence penalty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^stop sequences/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^seed/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^max retries/i)).toBeInTheDocument()
    })

    it('renders the "Create Vector Store" submit button', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: /create vector store/i })).toBeInTheDocument()
    })

    it('shows a caption for each uploaded file', () => {
      render(<CreateVectorStoreForm fileKeys={DEFAULT_FILE_KEYS} onSubmit={mockOnSubmit} />)

      expect(screen.getByText(/File 1:.*file-a\.pdf/i)).toBeInTheDocument()
      expect(screen.getByText(/File 2:.*file-b\.pdf/i)).toBeInTheDocument()
    })

    it('does not show the fileKeys line when the array is empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.queryByText(/files to embed/i)).not.toBeInTheDocument()
    })
  })

  // ── Initial state ───────────────────────────────────────────────────────────

  describe('Initial state', () => {
    it('all text fields start empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      const labelRegexes = [
        /^vector store id/i,
        /^title/i,
        /^source/i,
        /^model name/i,
        /^model provider/i,
        /^chat type id/i,
        /^max tokens/i,
        /^temperature/i,
        /^top p/i,
        /^frequency penalty/i,
        /^presence penalty/i,
        /^stop sequences/i,
        /^seed/i,
        /^max retries/i,
      ]
      for (const labelRegex of labelRegexes) {
        expect((screen.getByLabelText(labelRegex) as HTMLInputElement).value).toBe('')
      }
    })

    it('chatTypeId is empty when initialChatTypeId is not provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect((screen.getByLabelText(/^chat type id/i) as HTMLInputElement).value).toBe('')
    })

    it('id field starts empty', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect((screen.getByLabelText(/^vector store id/i) as HTMLInputElement).value).toBe('')
    })

    it('distanceMetric Select defaults to "cosine"', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      expect(screen.getByText('cosine')).toBeInTheDocument()
    })

    it('chatTypeId is pre-populated when initialChatTypeId is provided', () => {
      const id = 'aabbccdd-1234-1234-1234-aabbccddee01'
      render(<CreateVectorStoreForm fileKeys={[]} initialChatTypeId={id} onSubmit={mockOnSubmit} />)

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

      expect((screen.getByLabelText(/^vector store id/i) as HTMLInputElement).value).toBe(initialId)
    })

    it('dimension defaults to 1536', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      // The MUI Select shows the current value as visible text
      expect(screen.getByText('1536')).toBeInTheDocument()
    })
  })

  // ── Form submission — required fields ───────────────────────────────────────

  describe('Form submission — required fields', () => {
    it('calls onSubmit once when the form is submitted', () => {
      render(<CreateVectorStoreForm fileKeys={DEFAULT_FILE_KEYS} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      submitForm()

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    }, 15000)

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
    }, 15000)

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
      })
    }, 15000)

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

    it('includes distanceMetric in vectorEmbeddings', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields({ distanceMetric: 'euclidean' })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.vectorEmbeddings.distanceMetric).toBe('euclidean')
    })

    it('distanceMetric defaults to "cosine" in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields() // uses default distanceMetric = 'cosine'
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.vectorEmbeddings.distanceMetric).toBe('cosine')
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

      fillRequiredFields() // leaves all optional fields blank
      submitForm()

      const { chatAIOptions } = mockOnSubmit.mock.calls[0]![0]!
      expect(chatAIOptions).not.toHaveProperty('maxTokens')
      expect(chatAIOptions).not.toHaveProperty('temperature')
      expect(chatAIOptions).not.toHaveProperty('topP')
      expect(chatAIOptions).not.toHaveProperty('frequencyPenalty')
      expect(chatAIOptions).not.toHaveProperty('presencePenalty')
      expect(chatAIOptions.stopSequences).toEqual([])
      expect(chatAIOptions).not.toHaveProperty('seed')
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
    }, 15000)

    it('includes presencePenalty as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^presence penalty/i), { target: { value: '-0.3' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.presencePenalty).toBe(-0.3)
    }, 15000)

    it('includes seed as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^seed/i), { target: { value: '42' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.seed).toBe(42)
    }, 15000)

    it('includes maxRetries as a number when provided', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      fireEvent.change(screen.getByLabelText(/^max retries/i), { target: { value: '3' } })
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.chatAIOptions.maxRetries).toBe(3)
    })
  }, 15000)

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
    it('dimension defaults to 1536 in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()
      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(1536)
    })

    it('selecting 3072 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      const selectButton = screen
        .getByText('1536')
        .closest('[role="combobox"], [role="button"]') as HTMLElement
      fireEvent.mouseDown(selectButton)
      fireEvent.click(screen.getByRole('option', { name: '3072' }))

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(3072)
    })

    it('selecting 1024 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      const selectButton = screen
        .getByText('1536')
        .closest('[role="combobox"], [role="button"]') as HTMLElement
      fireEvent.mouseDown(selectButton)
      fireEvent.click(screen.getByRole('option', { name: '1024' }))

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(1024)
    })

    it('selecting 768 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      // Open the MUI Select dropdown then click the 768 option
      const selectButton = screen
        .getByText('1536')
        .closest('[role="combobox"], [role="button"]') as HTMLElement
      fireEvent.mouseDown(selectButton)
      fireEvent.click(screen.getByRole('option', { name: '768' }))

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(768)
    })

    it('selecting 384 updates dimension in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      const selectButton = screen
        .getByText('1536')
        .closest('[role="combobox"], [role="button"]') as HTMLElement
      fireEvent.mouseDown(selectButton)
      fireEvent.click(screen.getByRole('option', { name: '384' }))

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.embeddingModels.dimension).toBe(384)
    })
  })

  // ── Distance Metric Select ────────────────────────────────────────────────────

  describe('Distance Metric Select', () => {
    it('selecting euclidean updates distanceMetric in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      selectDistanceMetric('euclidean')

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.vectorEmbeddings.distanceMetric).toBe('euclidean')
    })

    it('selecting dot_product updates distanceMetric in the submitted data', () => {
      render(<CreateVectorStoreForm fileKeys={[]} onSubmit={mockOnSubmit} />)

      fillRequiredFields()

      selectDistanceMetric('dot_product')

      submitForm()

      expect(mockOnSubmit.mock.calls[0]![0]!.vectorEmbeddings.distanceMetric).toBe('dot_product')
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
})
