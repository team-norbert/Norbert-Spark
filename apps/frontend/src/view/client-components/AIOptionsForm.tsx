'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

interface AIOptions {
  id: string
  chatTypeId: string
  prompt: string
  maxTokens: number | null
  temperature: string | null
  topP: string | null
  frequencyPenalty: string | null
  presencePenalty: string | null
  topK: number | null
  stopSequences: string[] | null
  seed: number | null
  maxRetries: number | null
}

interface AIOptionsFormProps {
  chatTypeId: string
}

export default function AIOptionsForm({ chatTypeId }: AIOptionsFormProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<AIOptions>({
    id: '',
    chatTypeId: '',
    prompt: '',
    maxTokens: null,
    temperature: null,
    topP: null,
    frequencyPenalty: null,
    presencePenalty: null,
    topK: null,
    stopSequences: null,
    seed: null,
    maxRetries: null,
  })

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/ai/chats/config/${chatTypeId}/settings`)
        if (!response.ok) {
          throw new Error('Failed to fetch AI settings')
        }
        const result = (await response.json()) as { success: boolean; data: AIOptions }
        setFormData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [chatTypeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/v1/ai/chats/config/${chatTypeId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update AI settings')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: keyof AIOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleNumberChange =
    (field: keyof AIOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setFormData((prev) => ({
        ...prev,
        [field]: value === '' ? null : Number(value),
      }))
    }

  const handleStopSequencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      stopSequences: value === '' ? null : value.split(',').map((s) => s.trim()),
    }))
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Chat Options Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          AI options updated successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Prompt"
          multiline
          rows={6}
          value={formData.prompt}
          onChange={handleChange('prompt')}
          required
          helperText="Prompts are instructions you give to a large language model (LLM) that tell it what to do. Much like asking someone for directions, the clearer and more specific your request, the better the response you'll receive."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Max Tokens"
          type="number"
          value={formData.maxTokens ?? ''}
          onChange={handleNumberChange('maxTokens')}
          helperText="Maximum number of tokens to generate."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Temperature"
          type="number"
          inputProps={{ step: '0.01', min: 0, max: 2 }}
          value={formData.temperature ?? ''}
          onChange={handleChange('temperature')}
          helperText="This value is passed through to the provider, and the valid range depends on the provider and model. For most providers, a value of 0 produces nearly deterministic output, while higher values introduce more randomness. It is recommended to configure either temperature or topP, but not both."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Top P"
          type="number"
          inputProps={{ step: '0.01', min: 0, max: 1 }}
          value={formData.topP ?? ''}
          onChange={handleChange('topP')}
          helperText="Nucleus sampling. This value is passed through to the provider, and the valid range depends on the provider and model. For most providers, nucleus sampling (topP) is a number between 0 and 1. For example, a value of 0.1 means that only tokens within the top 10% of the probability mass are considered. It is recommended to configure either temperature or topP, but not both."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Frequency Penalty"
          type="number"
          inputProps={{ step: '0.01', min: -2, max: 2 }}
          value={formData.frequencyPenalty ?? ''}
          onChange={handleChange('frequencyPenalty')}
          helperText="The frequency penalty controls how likely the model is to repeat the same words or phrases. This value is passed through to the provider, and the valid range depends on the provider and model. For most providers, a value of 0 means no penalty is applied."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Presence Penalty"
          type="number"
          inputProps={{ step: '0.01', min: -2, max: 2 }}
          value={formData.presencePenalty ?? ''}
          onChange={handleChange('presencePenalty')}
          helperText="The presence penalty controls how likely the model is to repeat information already present in the prompt. This value is passed through to the provider, and the valid range depends on the provider and model. For most providers, a value of 0 means no penalty is applied."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Top K"
          type="number"
          inputProps={{ min: 1, max: 100 }}
          value={formData.topK ?? ''}
          onChange={handleNumberChange('topK')}
          helperText="Top-K sampling parameter. Limits the model to consider only the top K most likely tokens."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Stop Sequences"
          value={formData.stopSequences?.join(', ') ?? ''}
          onChange={handleStopSequencesChange}
          helperText="Stop sequences define where text generation should end. When set, the model stops generating text as soon as it produces one of the specified stop sequences. Providers may impose limits on how many stop sequences can be used. Example: '###, END, \n\n\n' (comma-separated)"
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Seed"
          type="number"
          inputProps={{ min: 0, max: 2147483647 }}
          value={formData.seed ?? ''}
          onChange={handleNumberChange('seed')}
          helperText="This is the seed (an integer) used for random sampling. When set and supported by the model, it ensures that calls produce deterministic results."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Max Retries"
          type="number"
          inputProps={{ min: 0, max: 10 }}
          value={formData.maxRetries ?? ''}
          onChange={handleNumberChange('maxRetries')}
          helperText="The maximum number of times to retry a request if it fails due to transient errors such as network issues or rate limiting. The default value is 2 retries."
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={submitting}
          fullWidth
        >
          {submitting ? 'Saving...' : 'Save AI Options'}
        </Button>
      </Box>
    </Container>
  )
}
