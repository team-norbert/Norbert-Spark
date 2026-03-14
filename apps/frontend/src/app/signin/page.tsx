'use client'

import { Suspense } from 'react'

import { SignInForm } from '@/view/client-components/SignInForm.js'
import { useSignInForm } from '@/view/hooks/useSignInForm.js'

function SignInFormContainer() {
  const {
    errors,
    formData,
    handleChange,
    handleForgotPassword,
    handleGoogleSignIn,
    handleSignUp,
    handleSubmit,
    isLoading,
    showPassword,
    togglePasswordVisibility,
  } = useSignInForm()

  return (
    <SignInForm
      formData={formData}
      errors={errors}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onForgotPassword={handleForgotPassword}
      onSignUp={handleSignUp}
      showPassword={showPassword}
      togglePasswordVisibility={togglePasswordVisibility}
      isLoading={isLoading}
    />
  )
}

/**
 * Sign-in page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 *
 * Wrapped in Suspense because useSignInForm uses useSearchParams() which requires
 * a Suspense boundary to avoid SSR/hydration mismatches.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInFormContainer />
    </Suspense>
  )
}
