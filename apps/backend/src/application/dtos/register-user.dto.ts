import { isDefined, isNullOrUndefined, isObject, isString } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Helper function to check if a providerId value is valid (non-empty string)
 * @param value - The value to check
 * @returns true if value is a valid non-empty string, false otherwise
 */
function isValidProviderId(value: any): boolean {
  return isString(value) && value.trim() !== ''
}

/**
 * Helper function to check if a provider value is valid (non-empty string)
 * @param value - The value to check
 * @returns true if value is a valid non-empty string, false otherwise
 */
function isValidProvider(value: any): boolean {
  return isString(value) && value.trim() !== ''
}

export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly role: string = 'user',
    public readonly password?: string,
    public readonly provider?: string,
    public readonly providerId?: string
  ) {}

  static validate(
    data: components['schemas']['RegisterUserRequest'] | components['schemas']['OAuthSyncRequest']
  ): RegisterUserDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Data must be a valid object')
    }

    // Widen to Record after the object guard — all field access below is
    // protected by its own isDefined/isString runtime checks anyway.
    const d = data as Record<string, unknown>

    if (!isDefined(d.email) || !isString(d.email) || d.email === '') {
      throw new ValidationException('Email is required and must be a string')
    }

    // Password validation: required if provider is not present (treating null, undefined, and empty string as "not present")
    const hasProvider = !isNullOrUndefined(d.provider) && d.provider !== ''
    const hasPassword = !isNullOrUndefined(d.password) && d.password !== ''

    if (!hasProvider) {
      if (!hasPassword || !isString(d.password)) {
        throw new ValidationException('Password must be a string when provider is not provided')
      }
    }
    // Password type validation: when a provider is present and a password is supplied, it must be a string
    if (hasProvider && d.password !== undefined && d.password !== null && !isString(d.password)) {
      throw new ValidationException('Password must be a string when provided')
    }
    if (!isDefined(d.name) || !isString(d.name) || d.name === '') {
      throw new ValidationException('Name is required and must be a string')
    }
    if (d.role !== undefined) {
      if (!isString(d.role)) {
        throw new ValidationException('Role must be a string')
      }
      // Security: Only allow 'user' role during registration to prevent privilege escalation
      if (d.role !== 'user') {
        throw new ValidationException('Only "user" role is allowed during registration')
      }
    }
    // Provider validation: if provided, must be a non-empty string
    if (!isNullOrUndefined(d.provider)) {
      if (!isString(d.provider)) {
        throw new ValidationException('Provider must be a string when provided')
      }
      if (!isValidProvider(d.provider)) {
        throw new ValidationException('Provider must be a non-empty string when provided')
      }
    }

    // ProviderId validation: if provided, must be a non-empty string
    if (!isNullOrUndefined(d.providerId)) {
      if (!isString(d.providerId)) {
        throw new ValidationException('ProviderId must be a string when provided')
      }
      if (!isValidProviderId(d.providerId)) {
        throw new ValidationException('ProviderId must be a non-empty string when provided')
      }
    }

    // If provider is set (and valid) and no password, providerId should also be set and valid
    if (isValidProvider(d.provider) && !hasPassword) {
      if (!isValidProviderId(d.providerId)) {
        throw new ValidationException(
          'ProviderId is required when using OAuth provider without password'
        )
      }
    }

    return new RegisterUserDto(
      d.email as string,
      d.name as string,
      d.role as string,
      d.password as string | undefined,
      d.provider as string | undefined,
      d.providerId as string | undefined
    )
  }
}
