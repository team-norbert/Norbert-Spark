'use client'

import { Alert, Box, Button, CircularProgress, Container, TextField } from '@mui/material'

import { AccordionComponent } from '@/view/client-components/AccordionComponent.js'
import { PageHeader } from '@/view/client-components/PageHeader.js'

interface CreateChatTypeFormProps {
  readonly formData: { readonly name: string; readonly description: string }
  readonly errors: { readonly name: string; readonly description: string }
  readonly generalError?: string
  readonly successMessage?: string
  readonly isSubmitting?: boolean
  readonly onFieldChange: (
    field: 'name' | 'description'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly onSubmit: (event: React.FormEvent) => void
  readonly onCancel: () => void
  readonly onNavigateHome: () => void
  readonly onSignOut: () => void
}

/**
 * Presentational form for creating a new AI chat type.
 *
 * Two fields: name (text) and description (multiline).
 * All behaviour is provided by the parent via props — this component
 * contains zero business logic.
 */
export function CreateChatTypeForm({
  errors,
  formData,
  generalError,
  isSubmitting,
  onCancel,
  onFieldChange,
  onNavigateHome,
  onSignOut,
  onSubmit,
  successMessage,
}: CreateChatTypeFormProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Create Chat Type"
          onNavigateHome={onNavigateHome}
          onSignOut={onSignOut}
        />

        <AccordionComponent
          header="Read me: What is a chat type?"
          body='<p>This form will create a new chat type. From the two entries below the following will be generated</p><ol><li>A global id used for that is used to connect chat options and individual chats - this is immutable.</li><li>A base64 encoding from this id - this is immutable</li><li>From the name, a SEO-friendly title will be auto generated - this can changed in the chat types table</li><li>The description. This is not the prompt. This is short-description of the purpose of the chat</li></ol><p>In the same action will be generated a new entry into the chat_ai_options table.</p><ol><li>The prompt text will will "Enter prompt here"</li><li>No other settings will be created</li></ol>'
        />

        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            fullWidth
            required
            id="name"
            label="Name"
            value={formData.name}
            onChange={onFieldChange('name')}
            error={!!errors.name}
            helperText={errors.name || 'Display name for the chat type (max 200 characters)'}
            disabled={isSubmitting}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            sx={{ mb: 3 }}
            data-testid="name-input"
          />

          <TextField
            fullWidth
            required
            id="description"
            label="Description"
            value={formData.description}
            onChange={onFieldChange('description')}
            error={!!errors.description}
            helperText={
              errors.description || 'Detailed description of the chat type (max 500 characters)'
            }
            disabled={isSubmitting}
            multiline
            rows={4}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ mb: 3 }}
            data-testid="description-input"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>

            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
