import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { isString, isDefined, isObject, isNullOrUndefined } from '@norberts-spark/shared'

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

  static validate(data: any): RegisterUserDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Data must be a valid object')
    }
    if (!isDefined(data.email) || !isString(data.email) || data.email === '') {
      throw new ValidationException('Email is required and must be a string')
    }

    // Password validation: required if provider is not present (treating null, undefined, and empty string as "not present")
    const hasProvider = !isNullOrUndefined(data.provider) && data.provider !== ''
    const hasPassword = !isNullOrUndefined(data.password) && data.password !== ''

    if (!hasProvider) {
      if (!hasPassword || !isString(data.password)) {
        throw new ValidationException('Password must be a string when provider is not provided')
      }
    }
    // Password type validation: when a provider is present and a password is supplied, it must be a string
    if (
      hasProvider &&
      data.password !== undefined &&
      data.password !== null &&
      !isString(data.password)
    ) {
      throw new ValidationException('Password must be a string when provided')
    }
    if (!isDefined(data.name) || !isString(data.name) || data.name === '') {
      throw new ValidationException('Name is required and must be a string')
    }
    if (data.role !== undefined) {
      if (!isString(data.role)) {
        throw new ValidationException('Role must be a string')
      }
      // Security: Only allow 'user' role during registration to prevent privilege escalation
      if (data.role !== 'user') {
        throw new ValidationException('Only "user" role is allowed during registration')
      }
    }
    // Provider validation: if provided, must be a non-empty string
    if (!isNullOrUndefined(data.provider)) {
      if (!isString(data.provider)) {
        throw new ValidationException('Provider must be a string when provided')
      }
      if (!isValidProvider(data.provider)) {
        throw new ValidationException('Provider must be a non-empty string when provided')
      }
    }

    // ProviderId validation: if provided, must be a non-empty string
    if (!isNullOrUndefined(data.providerId)) {
      if (!isString(data.providerId)) {
        throw new ValidationException('ProviderId must be a string when provided')
      }
      if (!isValidProviderId(data.providerId)) {
        throw new ValidationException('ProviderId must be a non-empty string when provided')
      }
    }

    // If provider is set (and valid) and no password, providerId should also be set and valid
    if (isValidProvider(data.provider) && !hasPassword) {
      if (!isValidProviderId(data.providerId)) {
        throw new ValidationException(
          'ProviderId is required when using OAuth provider without password'
        )
      }
    }

    return new RegisterUserDto(
      data.email as string,
      data.name as string,
      data.role as string,
      data.password == null ? undefined : (data.password as string),
      data.provider == null ? undefined : (data.provider as string),
      data.providerId == null ? undefined : (data.providerId as string)
    )
  }
}
