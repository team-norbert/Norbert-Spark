import { is64CharHexString, isDefined, isObject } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Data Transfer Object representing a token-refresh request.
 *
 * Instances are always created through the {@link PostRefreshDTO.validate}
 * factory, which enforces that the refresh token is present, is a string, and
 * conforms to the 64-character hexadecimal format before constructing the DTO.
 * This ensures the application layer never operates on malformed refresh requests.
 *
 * @example
 * ```ts
 * const dto = PostRefreshDTO.validate(req.body)
 * const tokens = await refreshTokenUseCase.execute(dto.refreshToken)
 * ```
 */
export class PostRefreshDTO {
  /**
   * Creates a validated `PostRefreshDTO` instance.
   *
   * Prefer {@link PostRefreshDTO.validate} over calling this constructor
   * directly — it performs all runtime validation before construction.
   *
   * @param refreshToken - A trimmed, 64-character hexadecimal refresh token.
   */
  constructor(
    /**
     * The validated, trimmed 64-character hexadecimal refresh token.
     *
     * Guaranteed to match `/^[0-9a-f]{64}$/i` after construction via
     * {@link PostRefreshDTO.validate}.
     *
     * @example 'a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
     */
    public readonly refreshToken: string
  ) {}

  /**
   * Parses and validates a raw `RefreshTokenRequest` payload into a
   * {@link PostRefreshDTO}.
   *
   * Validation rules (applied in order):
   * 1. `data` must be a non-null object.
   * 2. `data.refreshToken` must be a defined, non-null string.
   * 3. The trimmed value of `data.refreshToken` must be a 64-character
   *    hexadecimal string (matched by `is64CharHexString`).
   *
   * Whitespace is stripped from the token before format validation so that
   * clients sending padded tokens are handled gracefully.
   *
   * @param data - The raw `RefreshTokenRequest` payload, typically a parsed
   *   request body from the `/auth/refresh` route handler.
   * @returns A new `PostRefreshDTO` with the trimmed, validated refresh token.
   * @throws {TypeException} When `data` is not an object.
   * @throws {TypeException} When `data.refreshToken` is missing or not a string.
   * @throws {ValidationException} When the trimmed token is not a 64-character
   *   hexadecimal string.
   *
   * @example
   * ```ts
   * // Happy path
   * const dto = PostRefreshDTO.validate({
   *   refreshToken: 'a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
   * })
   *
   * // Throws TypeException — not an object
   * PostRefreshDTO.validate(null)
   *
   * // Throws TypeException — refreshToken is not a string
   * PostRefreshDTO.validate({ refreshToken: 12345 })
   *
   * // Throws ValidationException — token is not 64 hex chars
   * PostRefreshDTO.validate({ refreshToken: 'tooshort' })
   * ```
   */
  static validate(data: components['schemas']['RefreshTokenRequest']): PostRefreshDTO {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Expected an object')
    }

    if (!isDefined((data as any).refreshToken) || typeof (data as any).refreshToken !== 'string') {
      throw new TypeException('Expected refreshToken to be a string')
    }

    const trimmedRefreshToken = (data as any).refreshToken.trim()

    if (!is64CharHexString(trimmedRefreshToken)) {
      throw new ValidationException(
        'Invalid refreshToken: must be a 64-character hexadecimal string'
      )
    }

    return new PostRefreshDTO(trimmedRefreshToken)
  }
}
