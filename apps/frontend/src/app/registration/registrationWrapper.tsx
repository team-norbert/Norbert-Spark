'use server'

/**
 * UNUSED: This file is not currently used by the registration flow.
 *
 * The actual registration logic is in:
 * - Application layer: src/application/actions/registerUser.ts
 * - Hook: src/view/hooks/useRegistrationForm.ts
 * - Component: src/view/client-components/RegistrationForm.tsx
 *
 * This placeholder server action exists to maintain the file structure
 * but is not invoked. Consider removing this file if not needed.
 */
export async function registrationWrapper(..._args: unknown[]): Promise<never> {
  throw new Error(
    'registrationWrapper is not implemented - use registerUser from application/actions instead.'
  )
}
