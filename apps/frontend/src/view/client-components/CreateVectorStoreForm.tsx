'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import type { components } from '@norberts-spark/shared/openapi-types'
import type React from 'react'
import { useMemo, useState } from 'react'

import { useEmbeddingModels } from '@/view/hooks/queries/useEmbeddingModels.js'

import { AccordionComponent } from './AccordionComponent.js'

export type CreateVectorStoreFormData = components['schemas']['CreateVectorStoreRequest']
export type DocumentEntry = CreateVectorStoreFormData['documents'][number]

const DISTANCE_METRICS: CreateVectorStoreFormData['vectorEmbeddings']['distanceMetric'][] = [
  'cosine',
  'euclidean',
  'dot_product',
]

/**
 * Derives a human-readable document title from a bucket fileKey.
 * e.g. "rag/uuid/Sample-Handbook_copy.pdf" → "Sample-Handbook copy"
 */
function titleFromFileKey(fileKey: string): string {
  const filename = fileKey.split('/').pop() ?? fileKey
  const withoutExt = filename.replace(/\.[^.]+$/, '')
  return withoutExt.replace(/_/g, ' ')
}

interface CreateVectorStoreFormProps {
  fileKeys: string[]
  initialChatTypeId?: string
  onSubmit?: (data: CreateVectorStoreFormData) => void
}

/**
 * CreateVectorStoreForm presentational component.
 * Renders after a successful RAG file upload to collect the configuration
 * needed to call the POST /ai/create-vector-store endpoint.
 *
 * The form is typed against the generated OpenAPI `CreateVectorStoreRequest`
 * schema. Select fields are used for enum-constrained values:
 * - `embeddingModels.dimension`: [3072, 1536, 1024, 768, 384]
 * - `vectorEmbeddings.distanceMetric`: ['cosine', 'euclidean', 'dot_product']
 */
export function CreateVectorStoreForm({
  fileKeys,
  initialChatTypeId,
  onSubmit,
}: CreateVectorStoreFormProps) {
  const { embeddingModels, isLoading: embeddingModelsLoading } = useEmbeddingModels()

  // top-level id
  const [id, setId] = useState(initialChatTypeId ?? '')

  // Track per-index edits made by the user (both title and source).
  // Derived from fileKeys so no useEffect is needed.
  // Map<index, DocumentEntry> avoids object-injection lint warnings.
  const [editedDocs, setEditedDocs] = useState<Map<number, DocumentEntry>>(new Map())

  const documents: DocumentEntry[] = useMemo(() => {
    const base: DocumentEntry[] =
      fileKeys.length > 0
        ? fileKeys.map((key) => ({ title: titleFromFileKey(key), source: key }))
        : [{ title: '', source: '' }]
    return base.map((entry, i) => editedDocs.get(i) ?? entry)
  }, [fileKeys, editedDocs])

  const handleDocumentChange = (index: number, field: keyof DocumentEntry, value: string) => {
    setEditedDocs((prev) => {
      // eslint-disable-next-line security/detect-object-injection -- Safe: index is a controlled render index bounded by documents array length
      const current = prev.get(index) ?? documents[index] ?? { title: '', source: '' }
      return new Map(prev).set(index, { ...current, [field]: value })
    })
  }

  // embeddingModels
  const [selectedModelId, setSelectedModelId] = useState('')
  const [modelName, setModelName] = useState('')
  const [modelProvider, setModelProvider] = useState('')
  const [dimension, setDimension] = useState<3072 | 1536 | 1024 | 768 | 384 | ''>(``)
  // true when the user has typed directly into the name/provider fields
  const [isManualEntry, setIsManualEntry] = useState(false)

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    const model = embeddingModels.find((m) => m.id === modelId)
    if (model) {
      setModelName(model.name)
      setModelProvider(model.provider)
      setDimension(model.dimension)
      setIsManualEntry(false)
    }
  }

  // True when the user has BOTH selected from the dropdown AND typed into a manual field.
  // The two entry modes are mutually exclusive — choosing both is invalid.
  const embeddingModelConflict = selectedModelId !== '' && isManualEntry

  // vectorEmbeddings
  const [distanceMetric, setDistanceMetric] =
    useState<CreateVectorStoreFormData['vectorEmbeddings']['distanceMetric']>('cosine')
  const [chunkSize, setChunkSize] = useState('')
  const [chunkOverlap, setChunkOverlap] = useState('')

  // chatAIOptions
  const [chatTypeId, setChatTypeId] = useState(initialChatTypeId ?? '')
  const [maxTokens, setMaxTokens] = useState('')
  const [temperature, setTemperature] = useState('')
  const [topP, setTopP] = useState('')
  const [frequencyPenalty, setFrequencyPenalty] = useState('')
  const [presencePenalty, setPresencePenalty] = useState('')
  const [stopSequences, setStopSequences] = useState('')
  const [seed, setSeed] = useState('')
  const [maxRetries, setMaxRetries] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (embeddingModelConflict) return

    const formData: CreateVectorStoreFormData = {
      id,
      documents,
      embeddingModels: {
        modelName,
        modelProvider,
        dimension: dimension as 3072 | 1536 | 1024 | 768 | 384,
      },
      vectorEmbeddings: {
        distanceMetric,
        chunkSize: Number(chunkSize),
        chunkOverlap: Number(chunkOverlap),
      },
      chatAIOptions: {
        chatTypeId,
        ...(maxTokens ? { maxTokens: Number(maxTokens) } : {}),
        ...(temperature ? { temperature: Number(temperature) } : {}),
        ...(topP ? { topP: Number(topP) } : {}),
        ...(frequencyPenalty ? { frequencyPenalty: Number(frequencyPenalty) } : {}),
        ...(presencePenalty ? { presencePenalty: Number(presencePenalty) } : {}),
        ...(stopSequences
          ? { stopSequences: stopSequences.split(',').map((s) => s.trim()) }
          : { stopSequences: [] }),
        ...(seed ? { seed: Number(seed) } : {}),
        ...(maxRetries ? { maxRetries: Number(maxRetries) } : {}),
      },
    }

    onSubmit?.(formData)
  }

  return (
    <Card elevation={3} sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Create Vector Store
        </Typography>

        <AccordionComponent header="Instructions" body="" />

        <Box component="form" onSubmit={handleSubmit}>
          {/* ID */}
          <TextField
            label="Vector Store ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            fullWidth
            required
            className={'hide'}
            inputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
            data-test-id="vector-store-id-input"
          />

          {/* Documents */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
            Documents
          </Typography>
          {documents.map((doc, index) => (
            <Box key={index} sx={{ mb: 2, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                File {index + 1}
                {fileKeys.at(index) ? `: ${fileKeys.at(index)?.split('/').pop()}` : ''}
              </Typography>
              <TextField
                label="Title"
                value={doc.title}
                onChange={(e) => handleDocumentChange(index, 'title', e.target.value)}
                fullWidth
                required
                sx={{ mb: 1.5 }}
                data-test-id={`documents-title-input-${index}`}
              />
              <TextField
                label="Source"
                value={doc.source}
                onChange={(e) => handleDocumentChange(index, 'source', e.target.value)}
                fullWidth
                required
                sx={{ mb: 0.5 }}
                data-test-id={`documents-source-input-${index}`}
              />
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Embedding Models */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Embedding Models
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            The embedding model you want to use for vectorizing your documents. You can choose from
            the pre-seeded models in the dropdown or add your own custom model by providing the
            name, provider, and dimension.
          </Typography>
          {/* Embedding Models dropdown */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="embedding-model-select-label" className="visuallyhidden">
              Select a pre-seeded model
            </InputLabel>
            <Select
              labelId="embedding-model-select-label"
              label="Select a pre-seeded model"
              value={selectedModelId}
              data-test-id="embedding-models-select"
              displayEmpty
              disabled={embeddingModelsLoading}
              onOpen={() => setIsManualEntry(false)}
              onChange={(e) => handleModelSelect(e.target.value)}
              startAdornment={
                embeddingModelsLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
              }
            >
              <MenuItem value="">
                <em>— choose a model —</em>
              </MenuItem>
              {embeddingModels.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {model.name} &mdash; {model.provider} ({model.dimension}d)
                    </Typography>
                    {model.status !== undefined && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Status: {model.status}
                        {model.release_year !== undefined
                          ? ` · Released: ${model.release_year}`
                          : ''}
                      </Typography>
                    )}
                    {model.recommended_usage !== undefined && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {model.recommended_usage}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {embeddingModelConflict && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2 }}
              data-test-id="embedding-model-conflict-error"
            >
              Please use either the dropdown or manual entry, not both.
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Model Name"
            value={modelName}
            onChange={(e) => {
              setModelName(e.target.value)
              setIsManualEntry(true)
            }}
            fullWidth
            required
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-name-input"
          />
          <TextField
            label="Model Provider"
            value={modelProvider}
            onChange={(e) => {
              setModelProvider(e.target.value)
              setIsManualEntry(true)
            }}
            fullWidth
            required
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-provider-input"
          />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="dimension-label">Dimension</InputLabel>
            <Select
              labelId="dimension-label"
              label="Dimension"
              value={dimension}
              displayEmpty
              data-test-id="embedding-models-dimension-select"
              onChange={(e) => setDimension(e.target.value as 3072 | 1536 | 1024 | 768 | 384 | '')}
            >
              <MenuItem value="">
                <em>— choose a dimension —</em>
              </MenuItem>
              <MenuItem value={3072}>3072</MenuItem>
              <MenuItem value={1536}>1536</MenuItem>
              <MenuItem value={1024}>1024</MenuItem>
              <MenuItem value={768}>768</MenuItem>
              <MenuItem value={384}>384</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Vector Embeddings */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Vector Embeddings
          </Typography>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="distance-metric-label">Distance Metric</InputLabel>
            <Select
              labelId="distance-metric-label"
              label="Distance Metric"
              value={distanceMetric}
              data-test-id="vector-embeddings-distance-metric-select"
              onChange={(e) =>
                setDistanceMetric(
                  e.target.value as CreateVectorStoreFormData['vectorEmbeddings']['distanceMetric']
                )
              }
            >
              {DISTANCE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Chunk Size"
            type="number"
            value={chunkSize}
            onChange={(e) => setChunkSize(e.target.value)}
            inputProps={{ min: 1, max: 10000 }}
            fullWidth
            required
            data-test-id="vector-embeddings-chunk-size-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Chunk Overlap"
            type="number"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(e.target.value)}
            inputProps={{ min: 0, max: 1000 }}
            fullWidth
            required
            data-test-id="vector-embeddings-chunk-overlap-input"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Chat AI Options */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Chat AI Options
          </Typography>
          <TextField
            label="Chat Type ID"
            value={chatTypeId}
            onChange={(e) => setChatTypeId(e.target.value)}
            fullWidth
            required
            data-test-id="chat-ai-options-chat-type-id-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Max Tokens"
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            inputProps={{ min: 1, max: 100000 }}
            fullWidth
            data-test-id="chat-ai-options-max-tokens-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Temperature"
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            inputProps={{ step: 0.1, min: 0, max: 2 }}
            fullWidth
            data-test-id="chat-ai-options-temperature-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Top P"
            type="number"
            value={topP}
            onChange={(e) => setTopP(e.target.value)}
            inputProps={{ step: 0.1, min: 0, max: 1 }}
            fullWidth
            data-test-id="chat-ai-options-top-p-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Frequency Penalty"
            type="number"
            value={frequencyPenalty}
            onChange={(e) => setFrequencyPenalty(e.target.value)}
            inputProps={{ step: 0.1, min: -2, max: 2 }}
            fullWidth
            data-test-id="chat-ai-options-frequency-penalty-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Presence Penalty"
            type="number"
            value={presencePenalty}
            onChange={(e) => setPresencePenalty(e.target.value)}
            inputProps={{ step: 0.1, min: -2, max: 2 }}
            fullWidth
            data-test-id="chat-ai-options-presence-penalty-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Stop Sequences (comma-separated)"
            value={stopSequences}
            onChange={(e) => setStopSequences(e.target.value)}
            fullWidth
            data-test-id="chat-ai-options-stop-sequences-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            inputProps={{ min: 0, max: 1000000 }}
            fullWidth
            data-test-id="chat-ai-options-seed-input"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Max Retries"
            type="number"
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
            inputProps={{ min: 0, max: 10 }}
            fullWidth
            data-test-id="chat-ai-options-max-retries-input"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            size="large"
            data-test-id="create-vector-store-submit-button"
          >
            Create Vector Store
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
