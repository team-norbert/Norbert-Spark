import { useRouter } from 'next/navigation.js'
import { useState } from 'react'

import { CreateChatTypeSchema } from '@/domain/ai/chat-config.js'
import { useCreateChatType } from '@/view/hooks/queries/useCreateChatType.js'

interface FormData {
  name: string
  description: string
  rag: boolean
}

interface FormErrors {
  name: string
  description: string
  rag: boolean
}

const INITIAL_FORM_DATA: FormData = { name: '', description: '', rag: false }
const INITIAL_ERRORS: FormErrors = { name: '', description: '', rag: false }

/**
 * Hook for the Create Chat Type form.
 *
 * Manages form state, field-level validation via Zod schemas,
 * submission via the useCreateChatType mutation, and error handling.
 *
 * @example
 * ```typescript
 * const { formData, errors, handleChange, handleSubmit, isSubmitting } = useCreateChatTypeForm()
 * ```
 */
export function useCreateChatTypeForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS)
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutation = useCreateChatType()
  const router = useRouter()

  const handleChange =
    (field: 'name' | 'description') => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
      setGeneralError('')
      setSuccessMessage('')
    }

  const handleRagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, rag: event.target.checked }))
    setGeneralError('')
    setSuccessMessage('')
  }

  const validateForm = (): boolean => {
    const result = CreateChatTypeSchema.safeParse(formData)

    if (result.success) {
      setErrors(INITIAL_ERRORS)
      return true
    }

    const fieldErrors = result.error.flatten().fieldErrors
    setErrors({
      name: fieldErrors.name?.[0] ?? '',
      description: fieldErrors.description?.[0] ?? '',
      rag: false,
    })
    return false
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setGeneralError('')
    setSuccessMessage('')

    try {
      const result = await mutation.mutateAsync(formData)

      if (result.success) {
        setSuccessMessage(`Chat type "${result.data.name}" created successfully!`)
        setFormData(INITIAL_FORM_DATA)
        // Navigate back to chat types list after a short delay
        setTimeout(() => {
          router.push('/chat-types')
        }, 1500)
      }
    } catch (e) {
      const status = (e as { status?: number } | null | undefined)?.status

      // Handle 409 conflict (duplicate name) using structured status code
      if (status === 409) {
        setErrors((prev) => ({
          ...prev,
          name: 'A chat type with this name already exists. Please choose a different name.',
        }))
        return
      }

      if (e instanceof Error) {
        setGeneralError(e.message)
      } else {
        setGeneralError('An unexpected error occurred. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    router.push('/chat-types')
  }

  return {
    formData,
    errors,
    generalError,
    successMessage,
    isSubmitting: mutation.isPending,
    handleChange,
    handleRagChange,
    handleSubmit,
    handleCancel,
  }
}
