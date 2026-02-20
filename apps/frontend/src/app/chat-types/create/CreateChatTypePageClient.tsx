'use client'

import { useRouter } from 'next/navigation.js'

import { CreateChatTypeForm } from '@/view/client-components/CreateChatTypeForm.js'
import { useCreateChatTypeForm } from '@/view/hooks/useCreateChatTypeForm.js'

/**
 * Client wrapper for the Create Chat Type page.
 * Connects the form hook to the presentational component.
 */
export function CreateChatTypePageClient() {
  const router = useRouter()
  const {
    errors,
    formData,
    generalError,
    handleCancel,
    handleChange,
    handleRagChange,
    handleSubmit,
    isSubmitting,
    successMessage,
  } = useCreateChatTypeForm()

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  return (
    <CreateChatTypeForm
      formData={formData}
      errors={errors}
      generalError={generalError}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      onFieldChange={handleChange}
      onRagChange={handleRagChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
    />
  )
}
