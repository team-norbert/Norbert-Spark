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

/**
 * Data Transfer Object representing a validated user-registration request.
 *
 * Supports two registration flows:
 * - **Credential registration** (`RegisterUserRequest`): `email`, `name`, and
 *   `password` are required; no `provider`/`providerId` is expected.
 * - **OAuth sync** (`OAuthSyncRequest`): `email`, `name`, `provider`, and
 *   `providerId` are required; `password` is optional and may be omitted.
 *
 * Always construct instances via the {@link RegisterUserDto.validate} factory —
 * it enforces all cross-field rules before returning a fully valid object.
 *
 * @example
 * ```ts
 * // Credential registration
 * const dto = RegisterUserDto.validate({
 *   email: 'alice@example.com',
 *   name: 'Alice',
 *   password: 's3cr3t!',
 * })
 *
 * // OAuth sync
 * const dto = RegisterUserDto.validate({
 *   email: 'alice@example.com',
 *   name: 'Alice',
 *   provider: 'google',
 *   providerId: 'google-uid-123',
 * })
 * ```
 */
export class RegisterUserDto {
  /**
   * Creates a `RegisterUserDto` instance.
   *
   * Prefer {@link RegisterUserDto.validate} over calling this constructor
   * directly — it validates all fields and enforces cross-field rules.
   *
   * @param email - The user's email address.
   * @param name - The user's display name.
   * @param role - The assigned role. Defaults to `'user'`; no other value is
   *   permitted during registration (privilege-escalation guard).
   * @param password - The user's plain-text password. Required when no
   *   `provider` is supplied; optional for OAuth registrations.
   * @param provider - The OAuth provider identifier (e.g. `'google'`,
   *   `'github'`). Required for OAuth sync registrations.
   * @param providerId - The unique user ID issued by the OAuth provider.
   *   Required when `provider` is set and no `password` is supplied.
   */
  constructor(
    /**
     * The user's email address.
     *
     * @example 'alice@example.com'
     */
    public readonly email: string,
    /**
     * The user's display name.
     *
     * @example 'Alice'
     */
    public readonly name: string,
    /**
     * The role assigned to the user. Always `'user'` for self-registrations;
     * any other value is rejected by {@link RegisterUserDto.validate} to
     * prevent privilege escalation.
     *
     * @default 'user'
     */
    public readonly role: string = 'user',
    /**
     * The user's plain-text password.
     *
     * Required when registering with credentials (no `provider`). Optional
     * when registering via OAuth sync.
     */
    public readonly password?: string,
    /**
     * The OAuth provider identifier.
     *
     * Must be a non-empty string when present (e.g. `'google'`, `'github'`).
     */
    public readonly provider?: string,
    /**
     * The unique user ID issued by the OAuth provider.
     *
     * Required when `provider` is set and `password` is not supplied.
     *
     * @example 'google-uid-1234567890'
     */
    public readonly providerId?: string
  ) {}

  /**
   * Parses and validates a raw registration payload into a
   * {@link RegisterUserDto}.
   *
   * Validation rules (applied in order):
   * 1. `data` must be a non-null object.
   * 2. `email` must be a non-empty string.
   * 3. `password` is required (non-empty string) when no `provider` is given.
   * 4. When `provider` is present and `password` is also supplied, `password`
   *    must be a string.
   * 5. `name` must be a non-empty string.
   * 6. `role`, when present, must be the string `'user'` — any other value is
   *    rejected to prevent privilege escalation.
   * 7. `provider`, when present, must be a non-empty string.
   * 8. `providerId`, when present, must be a non-empty string.
   * 9. When `provider` is valid and no `password` is supplied, `providerId`
   *    must also be a valid non-empty string.
   *
   * @param data - The raw request payload conforming to either
   *   `RegisterUserRequest` (credential registration) or `OAuthSyncRequest`
   *   (OAuth sync) from the OpenAPI schema.
   * @returns A new `RegisterUserDto` with all fields validated and trimmed
   *   where applicable.
   * @throws {TypeException} When `data` is not an object.
   * @throws {ValidationException} When `email` is missing or not a string.
   * @throws {ValidationException} When `password` is missing or not a string
   *   in credential-only mode (no `provider`).
   * @throws {ValidationException} When `password` is present alongside a
   *   `provider` but is not a string.
   * @throws {ValidationException} When `name` is missing or not a string.
   * @throws {ValidationException} When `role` is present but is not `'user'`.
   * @throws {ValidationException} When `provider` is present but is not a
   *   non-empty string.
   * @throws {ValidationException} When `providerId` is present but is not a
   *   non-empty string.
   * @throws {ValidationException} When `provider` is set without `password`
   *   and `providerId` is missing or empty.
   *
   * @example
   * ```ts
   * // Happy path — credential registration
   * const dto = RegisterUserDto.validate({
   *   email: 'alice@example.com',
   *   name: 'Alice',
   *   password: 's3cr3t!',
   * })
   *
   * // Happy path — OAuth sync
   * const dto = RegisterUserDto.validate({
   *   email: 'alice@example.com',
   *   name: 'Alice',
   *   provider: 'google',
   *   providerId: 'google-uid-123',
   * })
   *
   * // Throws TypeException — not an object
   * RegisterUserDto.validate(null)
   *
   * // Throws ValidationException — no password and no provider
   * RegisterUserDto.validate({ email: 'alice@example.com', name: 'Alice' })
   *
   * // Throws ValidationException — privilege escalation attempt
   * RegisterUserDto.validate({ email: 'a@b.com', name: 'A', password: 'pw', role: 'admin' })
   *
   * // Throws ValidationException — provider without providerId
   * RegisterUserDto.validate({ email: 'a@b.com', name: 'A', provider: 'google' })
   * ```
   */
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
