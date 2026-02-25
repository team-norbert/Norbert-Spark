'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import type React from 'react'
import { useState } from 'react'

export interface CreateVectorStoreFormData {
  documents: {
    title: string
    source: string
  }
  embeddingModels: {
    modelName: string
    modelProvider: string
    dimension: 1536 | 768 | 384
  }
  vectorEmbeddings: {
    distanceMetric: string
    chunkSize: number
    chunkOverlap: number
  }
  chatAIOptions: {
    chatTypeId: string
    maxTokens?: number
    temperature?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stopSequences?: string[]
    seed?: number
    maxRetries?: number
  }
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
 * All fields are text inputs except embeddingModels.dimension which is a
 * Select with values [1536, 768, 384].
 */
export function CreateVectorStoreForm({
  fileKeys,
  initialChatTypeId,
  onSubmit,
}: CreateVectorStoreFormProps) {
  // documents
  const [documentsTitle, setDocumentsTitle] = useState('')
  const [documentsSource, setDocumentsSource] = useState('')

  // embeddingModels
  const [modelName, setModelName] = useState('')
  const [modelProvider, setModelProvider] = useState('')
  const [dimension, setDimension] = useState<1536 | 768 | 384>(1536)

  // vectorEmbeddings
  const [distanceMetric, setDistanceMetric] = useState('')
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

    const formData: CreateVectorStoreFormData = {
      documents: {
        title: documentsTitle,
        source: documentsSource,
      },
      embeddingModels: {
        modelName,
        modelProvider,
        dimension,
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
        ...(stopSequences ? { stopSequences: stopSequences.split(',').map((s) => s.trim()) } : {}),
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

        {fileKeys.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Files to embed: {fileKeys.join(', ')}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Documents */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
            Documents
          </Typography>
          <TextField
            label="Title"
            value={documentsTitle}
            onChange={(e) => setDocumentsTitle(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Source"
            value={documentsSource}
            onChange={(e) => setDocumentsSource(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Embedding Models */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Embedding Models
          </Typography>
          <TextField
            label="Model Name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Model Provider"
            value={modelProvider}
            onChange={(e) => setModelProvider(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="dimension-label">Dimension</InputLabel>
            <Select
              labelId="dimension-label"
              label="Dimension"
              value={dimension}
              onChange={(e) => setDimension(Number(e.target.value) as 1536 | 768 | 384)}
            >
              <MenuItem value={1536}>1536</MenuItem>
              <MenuItem value={768}>768</MenuItem>
              <MenuItem value={384}>384</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Vector Embeddings */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Vector Embeddings
          </Typography>
          <TextField
            label="Distance Metric"
            value={distanceMetric}
            onChange={(e) => setDistanceMetric(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Chunk Size"
            type="number"
            value={chunkSize}
            onChange={(e) => setChunkSize(e.target.value)}
            inputProps={{ min: 1, max: 10000 }}
            fullWidth
            required
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
            sx={{ mb: 2 }}
          />
          <TextField
            label="Max Tokens"
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            inputProps={{ min: 1, max: 100000 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Temperature"
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            inputProps={{ step: 0.1, min: 0, max: 2 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Top P"
            type="number"
            value={topP}
            onChange={(e) => setTopP(e.target.value)}
            inputProps={{ step: 0.1, min: 0, max: 1 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Frequency Penalty"
            type="number"
            value={frequencyPenalty}
            onChange={(e) => setFrequencyPenalty(e.target.value)}
            inputProps={{ step: 0.1, min: -2, max: 2 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Presence Penalty"
            type="number"
            value={presencePenalty}
            onChange={(e) => setPresencePenalty(e.target.value)}
            inputProps={{ step: 0.1, min: -2, max: 2 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Stop Sequences (comma-separated)"
            value={stopSequences}
            onChange={(e) => setStopSequences(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            inputProps={{ min: 0, max: 1000000 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Max Retries"
            type="number"
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
            inputProps={{ min: 0, max: 10 }}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Button variant="contained" color="primary" type="submit" fullWidth size="large">
            Create Vector Store
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
