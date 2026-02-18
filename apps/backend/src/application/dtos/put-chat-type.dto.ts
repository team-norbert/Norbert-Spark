import { isObject, isDefined, isString } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { Uuid } from '../../domain/value-objects/uuid.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { PutChatDetailsType } from '../../shared/types/index.js'

/**
 * Data Transfer Object for updating chat type details.
 *
 * This DTO encapsulates the data required to update a chat type's configuration,
 * including its name, SEO-friendly identifier, and description. The ID is required
 * to identify which chat type to update, while all other fields are optional,
 * allowing for partial updates.
 *
 * @remarks
 * Validation rules:
 * - id: Required, must be a valid UUID v7 string
 * - name: Optional, 1-200 characters when provided
 * - seoFriendlyId: Optional, must be kebab-case format (lowercase letters, numbers, and hyphens only)
 * - description: Optional, 1-500 characters when provided
 * - Null values are automatically converted to undefined for cleaner handling
 *
 * @example
 * ```typescript
 * // Update all fields
 * const dto = new PutChatTypeDto(
 *   chatTypeId,
 *   'Updated Chat Type Name',
 *   'updated-seo-friendly-id',
 *   'Updated description for the chat type'
 * )
 *
 * // Update only name
 * const dto = new PutChatTypeDto(chatTypeId, 'New Name')
 * ```
 */
export class PutChatTypeDto {
  /**
   * Creates an instance of PutChatTypeDto.
   *
   * @param id - The UUID v7 identifier of the chat type to update (required)
   * @param name - The display name for the chat type (optional, 1-200 characters)
   * @param seoFriendlyId - URL-friendly identifier in kebab-case format (optional)
   * @param description - Detailed description of the chat type (optional, 1-500 characters)
   */
  constructor(
    public readonly id: UUIDType,
    public readonly name?: string,
    public readonly seoFriendlyId?: string,
    public readonly description?: string
  ) {}

  /**
   * Validates and constructs a PutChatTypeDto from raw data.
   *
   * Performs comprehensive validation of all chat type update fields,
   * ensuring they meet the requirements for updating a chat type record.
   * The method validates the required ID field and optional update fields,
   * converting null values to undefined for consistent handling.
   *
   * @param data - Raw data object to validate (typically from HTTP request body)
   * @returns A validated PutChatTypeDto instance with null values converted to undefined
   * @throws {TypeException} If data is not an object (returns 500 status code)
   * @throws {ValidationException} If any field fails validation rules (returns 400 status code):
   * - id: Must be provided, must be a string, must be a valid UUID v7 format
   * - name: Must be a string between 1-200 characters when provided
   * - seoFriendlyId: Must be a string in kebab-case format (lowercase letters, numbers, hyphens only)
   * - description: Must be a string between 1-500 characters when provided
   *
   * @example
   * ```typescript
   * try {
   *   const dto = PutChatTypeDto.validate(requestBody)
   *   // Use dto for chat type update operation
   * } catch (error) {
   *   if (error instanceof ValidationException) {
   *     console.error('Validation failed:', error.message)
   *   }
   * }
   * ```
   */
  static validate(data: PutChatDetailsType): PutChatTypeDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Invalid data: expected an object')
    }

    const { id, name, seoFriendlyId, description } = data

    // Validate id (required)
    if (!isDefined(id)) {
      throw new ValidationException('Invalid request body: id is required')
    }

    if (!isString(id)) {
      throw new ValidationException('Invalid id: must be a string')
    }

    let uuidTypeId: UUIDType
    try {
      uuidTypeId = new Uuid(id).getValue()
    } catch {
      throw new ValidationException('Invalid id format: incorrect ChatId format')
    }

    // Validate name (optional)
    if (isDefined(name)) {
      if (!isString(name)) {
        throw new ValidationException('Invalid name: must be a string')
      }
      if (name.trim().length < 1 || name.trim().length > 200) {
        throw new ValidationException('Invalid name: must be a string between 1 and 200 characters')
      }
    }

    // Validate seoFriendlyId (optional)
    if (isDefined(seoFriendlyId)) {
      if (!isString(seoFriendlyId)) {
        throw new ValidationException('Invalid seoFriendlyId: must be a string')
      }
      if (seoFriendlyId.trim().length < 1 || seoFriendlyId.trim().length > 200) {
        throw new ValidationException(
          'Invalid seoFriendlyId: must be a string between 1 and 200 characters'
        )
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seoFriendlyId)) {
        throw new ValidationException(
          'Invalid seoFriendlyId: must contain only lowercase letters, numbers, and hyphens in kebab-case format'
        )
      }
    }

    // Validate description (optional)
    if (isDefined(description)) {
      if (!isString(description)) {
        throw new ValidationException('Invalid description: must be a string')
      }
      if (description.trim().length < 1 || description.trim().length > 500) {
        throw new ValidationException(
          'Invalid description: must be a string between 1 and 500 characters'
        )
      }
    }

    return new PutChatTypeDto(
      uuidTypeId,
      name === null ? undefined : (name?.trim() as string | undefined),
      seoFriendlyId === null ? undefined : (seoFriendlyId?.trim() as string | undefined),
      description === null ? undefined : (description?.trim() as string | undefined)
    )
  }
}
