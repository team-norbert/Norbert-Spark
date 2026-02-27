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
import { bodyText } from './VectorStoreText.js'

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
  const [distanceMetric, setDistanceMetric] = useState<
    CreateVectorStoreFormData['vectorEmbeddings']['distanceMetric'] | ''
  >('')
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
    if (distanceMetric === '') return

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

        <AccordionComponent header="Instructions" body={bodyText} />

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
              onClose={() => setIsManualEntry(false)}
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>OR</strong> add new embedding model details manually:
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Model Name"
            value={modelName}
            onChange={(e) => {
              setModelName(e.target.value)
              setIsManualEntry(true)
            }}
            fullWidth
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-name-input"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Examples:</strong> openai, cohere, azure, vertex, etc
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Model Provider"
            value={modelProvider}
            onChange={(e) => {
              setModelProvider(e.target.value)
              setIsManualEntry(true)
            }}
            fullWidth
            sx={{ mb: 2 }}
            data-test-id="embedding-models-model-provider-input"
          />
          <Divider sx={{ my: 2 }} />
          <FormControl fullWidth required sx={{ mb: 2 }}>
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
                setIsManualEntry(true)
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

          {/* Vector Embeddings */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Vector Embeddings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            These settings control how your documents will be vectorised and stored in the vector
            store. The distance metric determines how similarity is calculated between vectors,
            while chunk size and overlap control how documents are split into smaller pieces for
            embedding. The recommended distance metric is usually &#34;cosine&#34;, but it depends
            on your specific use case and the embedding model you choose. If you&#39;re unsure,
            check the documentation for your embedding model or experiment with different metrics to
            see which gives better results for your data.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="distance-metric-label" shrink>
              Distance Metric
            </InputLabel>
            <Select
              labelId="distance-metric-label"
              label="Distance Metric"
              value={distanceMetric}
              displayEmpty
              data-test-id="vector-embeddings-distance-metric-select"
              onChange={(e) =>
                setDistanceMetric(
                  e.target.value as
                    | CreateVectorStoreFormData['vectorEmbeddings']['distanceMetric']
                    | ''
                )
              }
            >
              <MenuItem value="">
                <em>— choose a distance metric —</em>
              </MenuItem>
              {DISTANCE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Chunk Size</strong> ntrols how large each text chunk will be when splitting
            documents for embedding. A smaller chunk size means more, smaller pieces, which can
            capture finer-grained information but may increase the number of vectors and thus
            storage and query costs. A larger chunk size means fewer, larger pieces, which can be
            more efficient but may lose some detail. The optimal chunk size depends on the typical
            length of your documents and the context window of your embedding model. A common
            starting point is around 500 tokens, but you may want to experiment with different sizes
            to see what works best for your data and use case. The minimum allowed is 1 token, and
            the maximum is 10,000 tokens, but you should experiment with different values to find
            the right balance for your application and to avoid excessively large chunks that could
            lead to loss of detail or excessively small chunks that could lead to increased costs.
          </Typography>
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
            <strong>Chunk Overlap</strong> controls how much overlap there is between consecutive
            text chunks. Overlapping chunks can help preserve context across chunk boundaries, which
            can improve the quality of embeddings and downstream retrieval. However, too much
            overlap can increase the number of vectors and thus storage and query costs. A common
            setting is around 50 tokens, but you may want to experiment with different values to
            find the right balance for your data and use case. The minimum allowed is 0 (no overlap)
            and the maximum is 1000, but you should experiment with different values to find the
            right balance for your application and to avoid excessive overlap that could lead to
            increased costs without significant benefits.
          </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            These options control the behaviour of the AI when generating responses based on the
            vector store. The `chatTypeId` is a required field that identifies the type of chat or
            conversation you want to enable. The other parameters are optional and can be used to
            fine-tune the AI&#39;s responses. For example, `maxTokens` limits the length of the
            generated response, while `temperature` and `topP` control the randomness and creativity
            of the output. Penalties can be applied to reduce repetition or encourage new topics.
            Stop sequences can be defined to indicate when the AI should stop generating text. The
            seed can be set for reproducibility, and max retries can specify how many times the AI
            should attempt to generate a response if it fails or produces undesirable output. Adjust
            these settings based on your specific use case and desired behaviour of the AI.
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>max tokens</strong> limits the length of the AI&#39;s generated response.
            Setting a lower value can help ensure concise answers, while a higher value allows for
            more detailed responses. The optimal setting depends on your use case and the typical
            length of responses you want to receive. The minimum allowed is 1 token, and the maximum
            is 100,000 tokens, but you should experiment with different values to find the right
            balance for your application and to avoid excessively long or short responses from the
            AI.
          </Typography>
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
            <strong>Temperature</strong> controls the randomness and creativity of the AI&#39;s
            responses. A value of 0 makes the output more deterministic and focused, while higher
            values (up to around 2) increase randomness and can lead to more creative or varied
            responses. The best setting depends on your specific use case and whether you prefer
            more consistent answers or a wider range of outputs. The minimum is 0, which will make
            the AI more deterministic, and the maximum is 2, which will make it more random, with
            step values of 0.1 inbetween. You should experiment with different values to find the
            right balance for your specific use case and the behaviour you want from the AI.
          </Typography>
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
            <strong>Top P</strong> is an alternative to temperature for controlling the randomness
            of the AI&#39;s responses. It uses nucleus sampling to consider only the most probable
            tokens whose cumulative probability exceeds the top P value. A lower top P (e.g., 0.1)
            means the AI will only consider the very top tokens, leading to more focused responses,
            while a higher top P (e.g., 0.9) allows for a wider range of tokens and more varied
            outputs. Experiment with different values to find the right balance for your use case.
            The minimum is 0 and the maximum is 1, with step values of 0.1 inbetween, but you should
            experiment with different values to find the right balance for your specific use case
            and the behaviour you want from the AI.
          </Typography>
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
            <strong>Frequency Penalty</strong> reduces the likelihood of the AI repeating the same
            tokens in its response. A positive value (up to around 2) will penalise new tokens based
            on their existing frequency in the generated text, encouraging more varied language. A
            value of 0 means no penalty, while negative values can actually increase repetition.
            Adjust this setting if you find that the AI is being too repetitive or if you want to
            encourage more diversity in its responses. The minimum is -2, which can encourage
            repetition, and the maximum is 2, with step values of 0.1 inbetween, which can
            discourage it. The optimal value depends on your specific use case and how much
            repetition you want to allow in the AI&#39;s responses.
          </Typography>
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
            <strong>Presence Penalty</strong> is similar to frequency penalty but instead of looking
            at the frequency of tokens, it penalises based on whether a token has already appeared
            in the generated text at all. A positive value (up to around 2) will encourage the AI to
            introduce new topics and concepts by penalising tokens that have already been mentioned,
            while a value of 0 means no penalty. Negative values can decrease the likelihood of
            introducing new topics. Use this setting if you want to encourage the AI to explore new
            ideas or if you find that it&#39;s sticking too closely to certain themes in its
            responses. The minimum is -2 and the maximum is 2, with steps values of 0.1 inbetween,
            but you should experiment with different values to find the right balance for your
            specific use case and the behaviour you want from the AI.
          </Typography>
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
            <strong>Stop Sequences</strong> are specific tokens or strings that, when generated by
            the AI, will signal it to stop generating any further text. This can be useful for
            controlling the format of the output or ensuring that the AI doesn&#39;t produce
            unwanted content beyond a certain point. You can enter multiple stop sequences separated
            by commas. For example, if you set a stop sequence of &#34;\n\n&#34;, the AI will stop
            generating text once it produces two consecutive newline characters. Adjust this setting
            based on your specific use case and the desired format of the AI&#39;s responses. If
            nothing is entered then it will default to an empty array, meaning the AI will not have
            any specific stop sequences and will rely on other parameters (like max tokens) to
            determine when to stop generating text. An example entry could be: &#34;END, STOP,
            \n\n&#34; which would stop generation if the AI outputs &#34;END&#34;, &#34;STOP&#34;,
            or two newlines in a row.
          </Typography>
          <TextField
            label="Stop Sequences (comma-separated)"
            value={stopSequences}
            onChange={(e) => setStopSequences(e.target.value)}
            fullWidth
            data-test-id="chat-ai-options-stop-sequences-input"
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Seed</strong> is a number that can be used to initialize the random number
            generator for the AI&#39;s response generation. Setting a specific seed value allows for
            reproducibility, meaning that if you use the same seed and the same parameters, you
            should get the same output from the AI. This can be useful for testing and debugging
            purposes, or if you want to generate consistent responses for certain inputs. If you
            leave this field blank, the AI will use a random seed each time, resulting in different
            outputs even with the same input and parameters.
          </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <strong>Max Retries</strong> specifies the number of times the AI should attempt to
            generate a response if it fails or produces undesirable output. This can be useful for
            handling cases where the AI might produce an error or an output that doesn&#39;t meet
            certain criteria (e.g., too short, contains disallowed content, etc.). By setting a max
            retries value, you can allow the AI to try generating a response multiple times before
            giving up, which can improve the chances of getting a satisfactory answer. If you set
            this to 0, the AI will not retry and will return whatever output it generates on the
            first attempt. The optimal number of retries depends on your specific use case and how
            critical it is to get a good response. For some applications, you might want to allow
            several retries, while for others, you might prefer to keep it low to reduce latency.
            The maximum allowed is 10 to prevent excessively long response times, but you should
            experiment with different values to find the right balance for your application.
          </Typography>
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
