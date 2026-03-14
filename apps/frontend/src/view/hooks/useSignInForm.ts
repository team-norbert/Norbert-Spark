import type { LoginDTO } from '@norberts-spark/shared'
import { LoginSchema } from '@norberts-spark/shared'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { loginUserAction } from '@/infrastructure/serverActions/loginUser.server.js'

const logger = createLogger({ prefix: '[useSignInForm]' })

type FormData = LoginDTO

interface FormErrors {
  email: string
  password: string
  general: string
}

export function useSignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    general: '',
  })

  // Show a banner when redirected here after session expiry
  useEffect(() => {
    if (searchParams.get('error') === 'session_expired') {
      setErrors((prev) => ({
        ...prev,
        general: 'Your session has expired. Please sign in again.',
      }))
    }
  }, [searchParams])

  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      password: '',
      general: '',
    }

    const parsed = LoginSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
      newErrors.email = fieldErrors.email?.[0] ?? ''
      newErrors.password = fieldErrors.password?.[0] ?? ''
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === '')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Prevent race condition: return early if already processing
    if (isLoading) {
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors((prev) => ({ ...prev, general: '' }))

    try {
      logger.info('[useSignInForm] Calling Server Action for authentication', {
        event: 'signin.submitted',
      })

      // Step 1: Authenticate via Server Action (secure server-side call to backend)
      const authResult = await loginUserAction({
        email: formData.email,
        password: formData.password,
      })

      logger.info('[useSignInForm] Server Action result:', {
        event: 'signin.submitted',
        success: authResult.success,
        status: authResult.status,
      })

      if (!authResult.success) {
        logger.error(
          '[useSignInForm] Authentication failed',
          authResult.error ? new Error(authResult.error) : undefined,
          { event: 'signin.failed' }
        )
        setErrors((prev) => ({
          ...prev,
          general: authResult.error || 'Invalid email or password',
        }))
        return
      }

      // Step 2: Establish NextAuth session after successful authentication
      // Note: This makes a second call to the backend through NextAuth's authorize function.
      // This is a known trade-off to maintain NextAuth's session management while keeping
      // authentication logic explicit in the infrastructure layer (Server Action).
      // Alternative approaches (custom session management or modifying NextAuth's flow)
      // would be more complex and outside the scope of this security architecture improvement.
      logger.info('[useSignInForm] Authentication successful, establishing session', {
        event: 'signin.submitted',
      })

      // Derive a safe same-origin callback URL by parsing with the current origin as base.
      // This rejects protocol-relative, external, and encoded-bypass URLs automatically.
      const rawCallback = searchParams.get('callbackUrl')
      const callbackUrl = (() => {
        if (!rawCallback) return '/dashboard'
        try {
          const parsed = new URL(rawCallback, window.location.origin)
          if (parsed.origin !== window.location.origin) return '/dashboard'
          // Return the normalized path so fragments/query strings are preserved
          // but the URL is fully resolved and free of encoding tricks.
          return parsed.pathname + parsed.search + parsed.hash
        } catch {
          return '/dashboard'
        }
      })()

      const sessionResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      })

      logger.info('[useSignInForm] NextAuth signIn result:', {
        event: 'signin.submitted',
        ok: sessionResult?.ok,
        error: sessionResult?.error,
        status: sessionResult?.status,
        url: sessionResult?.url,
      })

      if (sessionResult?.error) {
        logger.error(
          '[useSignInForm] Session establishment failed',
          new Error(sessionResult.error),
          {
            event: 'signin.failed',
          }
        )
        setErrors((prev) => ({
          ...prev,
          general: 'Authentication succeeded but session creation failed. Please try again.',
        }))
        return
      }

      // Redirect on successful session establishment
      // NextAuth's signIn returns { ok, error, status, url } or undefined in some edge cases
      if (sessionResult?.ok) {
        logger.info('[useSignInForm] Success (ok=true) - redirecting', {
          event: 'signin.submitted',
        })
        router.push(callbackUrl)
        router.refresh()
      } else if (!sessionResult?.error) {
        // If there's no explicit error but ok is falsy, this might be a timing/state issue
        // Log the full result and try redirect anyway since Step 1 authentication succeeded
        logger.warn(
          '[useSignInForm] Unexpected session result (no ok, no error), attempting redirect anyway',
          {
            event: 'signin.submitted',
            ok: sessionResult?.ok,
            error: sessionResult?.error,
            status: sessionResult?.status,
          }
        )
        router.push(callbackUrl)
        router.refresh()
      } else {
        logger.error('[useSignInForm] Session establishment explicitly failed', undefined, {
          event: 'signin.failed',
        })
        setErrors((prev) => ({
          ...prev,
          general: 'An unexpected error occurred during sign in. Please try again.',
        }))
      }
    } catch (error) {
      logger.error(
        '[useSignInForm] Exception',
        error instanceof Error ? error : new Error(String(error)),
        { event: 'signin.failed' }
      )
      setErrors((prev) => ({
        ...prev,
        general: 'An unexpected error occurred. Please try again.',
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // NextAuth handles redirect via callbacks.redirect in auth-config
    // No need for manual router.push or router.refresh
    return signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }

  const handleSignUp = () => {
    router.push('/registration')
  }

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    handleForgotPassword,
    handleSignUp,
    showPassword,
    togglePasswordVisibility,
    isLoading,
  }
}
