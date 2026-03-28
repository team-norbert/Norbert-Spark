// TODO: refactor to be under 600 lines of code
/* eslint-disable max-lines */
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
import type React from 'react'
import { useMemo, useState } from 'react'

import type {
  CreateVectorStoreRequest,
  VectorStoreDocumentEntry,
} from '@/domain/ai/vector-store.js'
import { useEmbeddingModels } from '@/view/hooks/queries/useEmbeddingModels.js'

import { AccordionComponent } from './AccordionComponent.js'
import {
  bodyText,
  chunkOverlapText,
  frequencyPenaltyText,
  maxRetriesText,
  maxTokensText,
  presencePenaltyText,
  stopSequencesText,
  taskTypes,
  temperatureText,
  topPText,
  vectorEmbeddingsText,
} from './VectorStoreText.js'

export type CreateVectorStoreFormData = CreateVectorStoreRequest
export type DocumentEntry = VectorStoreDocumentEntry

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
 * - `embeddingModels.modelProvider`: ['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral']
 * - `embeddingModels.taskType` (optional): ['RETRIEVAL_QUERY', 'RETRIEVAL_DOCUMENT', 'SEMANTIC_SIMILARITY', 'CLASSIFICATION', 'CLUSTERING']
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
  const [dimension, setDimension] = useState<3072 | 1536 | 1024 | 768 | 384 | ''>('')
  const [releaseYear, setReleaseYear] = useState('')
  const [taskType, setTaskType] = useState('')

  // Selecting a pre-seeded model clears the manual fields (mutually exclusive modes)
  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    setModelName('')
    setModelProvider('')
    setDimension('')
    setReleaseYear('')
    setTaskType('')
  }

  // Typing into a manual field deselects the dropdown (mutually exclusive modes)
  const handleManualModelChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      setSelectedModelId('')
    }

  // vectorEmbeddings
  const [chunkSize, setChunkSize] = useState('300')
  const [chunkOverlap, setChunkOverlap] = useState('40')
  const [distanceMetric, setDistanceMetric] = useState<'cosine' | 'euclidean' | 'dot_product'>(
    'cosine'
  )

  // chatAIOptions
  const [chatTypeId, setChatTypeId] = useState(initialChatTypeId ?? '')
  const [maxTokens, setMaxTokens] = useState('1000')
  const [temperature, setTemperature] = useState('0.7')
  const [topP, setTopP] = useState('1')
  const [frequencyPenalty, setFrequencyPenalty] = useState('')
  const [presencePenalty, setPresencePenalty] = useState('')
  const [stopSequences, setStopSequences] = useState('')
  const [seed, setSeed] = useState('')
  const [maxRetries, setMaxRetries] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedModelId && (dimension === '' || !releaseYear)) return
    if (distanceMetric === 'euclidean' || distanceMetric === 'dot_product') return

    const embeddingModels =
      selectedModelId !== ''
        ? { existingModelId: selectedModelId }
        : {
            modelName,
            modelProvider: modelProvider as
              | 'openai'
              | 'google'
              | 'cohere'
              | 'amazon'
              | 'voyage'
              | 'mistral',
            dimension: dimension as 3072 | 1536 | 1024 | 768 | 384,
            releaseYear: Number(releaseYear),
            ...(taskType
              ? {
                  taskType: taskType as
                    | 'RETRIEVAL_QUERY'
                    | 'RETRIEVAL_DOCUMENT'
                    | 'SEMANTIC_SIMILARITY'
                    | 'CLASSIFICATION'
                    | 'CLUSTERING',
                }
              : {}),
          }

    const formData: CreateVectorStoreFormData = {
      id,
      documents,
      embeddingModels,
      vectorEmbeddings: {
        chunkSize: Number(chunkSize),
        chunkOverlap: Number(chunkOverlap),
        distanceMetric,
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
    <Card
      elevation={3}
      sx={{ mt: 3 }}
      id="create-vector-store-form"
      data-testid="create-vector-store-form"
    >
      <CardContent>
        <Typography id="create-vector-store-heading" variant="h6" gutterBottom>
          Create Vector Store
        </Typography>

        <AccordionComponent header="Read instructions" body={bodyText} />

        <Divider sx={{ my: 2 }} />
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
            The embedding model you want to use for vectorising your documents. You can choose from
            the pre-seeded models in the dropdown or add your own custom model by providing the
            name, provider, and dimension.
          </Typography>
          <Divider sx={{ my: 2 }} />
          {/* Embedding Models dropdown */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="embedding-model-select-label" shrink>
              Select a pre-seeded model
            </InputLabel>
            <Select
              labelId="embedding-model-select-label"
              label="Select a pre-seeded model"
              value={selectedModelId}
              data-test-id="embedding-models-select"
              displayEmpty
              disabled={embeddingModelsLoading}
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
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>OR</strong> add new embedding model details manually:
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Model Name"
            value={modelName}
            onChange={handleManualModelChange(setModelName)}
            fullWidth
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-name-input"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Examples:</strong> &#39;text-embedding-3-large&#39;,
            &#39;embed-english-v3.0&#39;
          </Typography>
          <Divider sx={{ my: 2 }} />

          <TextField
            label="Model Provider"
            value={modelProvider}
            onChange={(e) => {
              setModelProvider(e.target.value)
              setSelectedModelId('')
            }}
            data-testid="embedding-models-provider-input"
            fullWidth
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-provider-input"
            error={
              modelProvider !== '' &&
              !['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral'].includes(modelProvider)
            }
            helperText={
              modelProvider !== '' &&
              !['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral'].includes(modelProvider)
                ? 'Must be one of: openai, google, cohere, amazon, voyage, mistral'
                : undefined
            }
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Examples:</strong> openai, google, cohere, amazon, voyage, mistral
          </Typography>
          <Divider sx={{ my: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="dimension-label" shrink>
              Dimension
            </InputLabel>
            <Select
              labelId="dimension-label"
              label="Dimension"
              value={dimension}
              displayEmpty
              data-test-id="embedding-models-dimension-select"
              onChange={(e) => {
                setDimension(e.target.value as 3072 | 1536 | 1024 | 768 | 384 | '')
                setSelectedModelId('')
              }}
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

          <TextField
            label="Release Year"
            type="number"
            value={releaseYear}
            onChange={handleManualModelChange(setReleaseYear)}
            inputProps={{ min: 2000, max: new Date().getFullYear() + 1 }}
            fullWidth
            sx={{ mb: 2 }}
            data-test-id="embedding-models-release-year-input"
            error={
              releaseYear !== '' &&
              (Number(releaseYear) < 2000 || Number(releaseYear) > new Date().getFullYear() + 1)
            }
            helperText={
              releaseYear !== '' &&
              (Number(releaseYear) < 2000 || Number(releaseYear) > new Date().getFullYear() + 1)
                ? `Must be between 2000 and ${new Date().getFullYear() + 1}`
                : undefined
            }
          />

          <Divider sx={{ my: 2 }} />
          <AccordionComponent header="Information on Task Type" body={taskTypes} />
          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="task-type-label" shrink>
              {[
                'text-embedding-005',
                'text-multilingual-embedding-002',
                'gemini-embedding-001',
              ].includes(modelName) && modelProvider === 'google'
                ? 'Task Type (required for this Google model)'
                : 'Task Type (not applicable for this model)'}
            </InputLabel>
            <Select
              labelId="task-type-label"
              label={
                [
                  'text-embedding-005',
                  'text-multilingual-embedding-002',
                  'gemini-embedding-001',
                ].includes(modelName) && modelProvider === 'google'
                  ? 'Task Type (required for this Google model)'
                  : 'Task Type (not applicable for this model)'
              }
              value={taskType}
              displayEmpty
              disabled={
                !(
                  [
                    'text-embedding-005',
                    'text-multilingual-embedding-002',
                    'gemini-embedding-001',
                  ].includes(modelName) && modelProvider === 'google'
                )
              }
              data-test-id="embedding-models-task-type-select"
              onChange={(e) => {
                setTaskType(e.target.value)
                setSelectedModelId('')
              }}
            >
              <MenuItem value="">
                <em>— none —</em>
              </MenuItem>
              <MenuItem value="RETRIEVAL_QUERY">RETRIEVAL_QUERY</MenuItem>
              <MenuItem value="RETRIEVAL_DOCUMENT">RETRIEVAL_DOCUMENT</MenuItem>
              <MenuItem value="SEMANTIC_SIMILARITY">SEMANTIC_SIMILARITY</MenuItem>
              <MenuItem value="CLASSIFICATION">CLASSIFICATION</MenuItem>
              <MenuItem value="CLUSTERING">CLUSTERING</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Vector Embeddings */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Vector Embeddings
          </Typography>
          <AccordionComponent
            header="Information on Vector Embeddings"
            body={vectorEmbeddingsText}
          />
          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="distance-metric-label" shrink>
              Distance Metric
            </InputLabel>
            <Select
              labelId="distance-metric-label"
              label="Distance Metric"
              value={distanceMetric}
              data-test-id="vector-embeddings-distance-metric-select"
              onChange={(e) =>
                setDistanceMetric(e.target.value as 'cosine' | 'euclidean' | 'dot_product')
              }
            >
              <MenuItem value="cosine">cosine</MenuItem>
              <MenuItem value="euclidean">euclidean (not currently supported)</MenuItem>
              <MenuItem value="dot_product">dot_product (not currently supported)</MenuItem>
            </Select>
          </FormControl>
          {(distanceMetric === 'euclidean' || distanceMetric === 'dot_product') && (
            <Typography
              color="error"
              variant="body2"
              data-test-id="distance-metric-error"
              sx={{ mb: 2 }}
            >
              This distance metric is not currently supported.
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Chunk size recommended default: 300 tokens.</strong> Adjust based on your
            document structure and retrieval needs.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent header="Information on ChunkOverlap" body={chunkOverlapText} />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Chunk Overlap recommended default: 40 tokens.</strong> Adding overlap helps
            preserve context at chunk boundaries, which can improve retrieval quality. However,
            larger overlap values increase the total number of vectors stored, which can increase
            storage and query costs. Adjust based on your document structure and retrieval needs.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Chat AI Options */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Chat AI Options
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            These options control the behaviour of the AI when generating responses based on the
            vector store. The `chatTypeId` is a required field that identifies the type of chat or
            conversation you want to enable. The other parameters are optional and can be used to
            fine-tune the AI&#39;s responses. For example, `maxTokens` limits the length of the
            generated response, while `temperature` and `topP` control the randomness and creativity
            of the output. Penalties can be applied to reduce repetition or encourage new topics.
            Stop sequences can be defined to indicate when the AI should stop generating text.
            Adjust these settings based on your specific use case and desired behaviour of the AI.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Chat Type ID"
            value={chatTypeId}
            onChange={(e) => setChatTypeId(e.target.value)}
            fullWidth
            required
            data-test-id="chat-ai-options-chat-type-id-input"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />
          <AccordionComponent header="Information on Max Tokens" body={maxTokensText} />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default 1000.</strong> Adjust based on your preference and desired
            response style. Lower values produce shorter and more concise responses, while higher
            values allow longer and more detailed outputs. The optimal setting depends on your use
            case and the AI model being used, as different models support different maximum output
            lengths.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent
            header="Read information on Temperature settings"
            body={temperatureText}
          />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default: 0.7</strong> Adjust based on your preference and desired
            response style. Lower values (closer to 0) produce more focused and deterministic
            responses, while higher values increase randomness and creativity. It&#39;s generally
            recommended to adjust either temperature or Top P, but not both simultaneously.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent header="Information on Top P settings" body={topPText} />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default: 1.0</strong> It is usually recommended to adjust either
            Temperature or Top-P, but not both simultaneously. Leave this value as 1.0 and adjust
            the Temperature. Lower values (closer to 0) produce more focused and deterministic
            responses, while higher values increase randomness and creativity.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent
            header="Information on Frequency Penalty settings"
            body={frequencyPenaltyText}
          />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default 0.</strong> Adjust based on your preference and desired
            response style. For RAG, the priority is usually faithful, grounded answers, not
            novelty. Presence and frequency penalties are designed to push the model toward using
            different words or avoiding repetition; that can be useful for creative writing, but for
            RAG it can make answers slightly less literal and less stable. Gemini documents both
            penalties as vocabulary-shaping controls rather than grounding controls, so 0 is the
            safest default.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent
            header="Information on Presence Penalty settings"
            body={presencePenaltyText}
          />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default 0.</strong> Adjust based on your preference and desired
            response style. For RAG, the priority is usually faithful, grounded answers, not
            novelty. Presence and frequency penalties are designed to push the model toward using
            different words or avoiding repetition; that can be useful for creative writing, but for
            RAG it can make answers slightly less literal and less stable. Gemini documents both
            penalties as vocabulary-shaping controls rather than grounding controls, so 0 is the
            safest default.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
            data-test-id="chat-ai-options-seed-input"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />
          <AccordionComponent
            header="Information on Stop Sequences settings"
            body={stopSequencesText}
          />
          <Divider sx={{ my: 2 }} />

          <TextField
            label="Stop Sequences (comma-separated)"
            value={stopSequences}
            onChange={(e) => setStopSequences(e.target.value)}
            fullWidth
            data-test-id="chat-ai-options-stop-sequences-input"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default [].</strong> Adjust based on your preference and desired
            response style. For stop sequences, the safest default is usually none unless you have a
            very specific output format you need to terminate early. Stop sequences can truncate
            valid answers unexpectedly, and providers already stop naturally or at the token limit.
            Both OpenAI and Gemini describe stop conditions as either a natural stop or a provided
            stop sequence.
          </Typography>

          <Typography variant={'body2'} color="text.secondary" sx={{ mb: 1.5 }}>
            If no stop sequences are specified, an empty array will be used.
          </Typography>

          <Divider sx={{ my: 2 }} />
          <AccordionComponent header="Information on Max Retries settings" body={maxRetriesText} />
          <Divider sx={{ my: 2 }} />

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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Recommended default: 2</strong> Adjust based on your preference and desired
            response style. For max retries, 2 is a good production default. In the AI SDK docs,
            retry-related generation helpers default to 2 retries (3 total attempts), which is a
            sensible balance between resilience and latency/cost.
          </Typography>

          <Divider sx={{ my: 2 }} />

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
