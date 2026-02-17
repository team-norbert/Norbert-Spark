import { isObject, isDefined, isString } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { Uuid } from '../../domain/value-objects/uuid.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import type { PutChatDetailsType } from '../../shared/types/index.js'

export class PutChatTypeDto {
  constructor(
    public readonly id: UUIDType,
    public readonly name?: string,
    public readonly seoFriendlyId?: string,
    public readonly description?: string
  ) {}

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
      if (name.length < 1 || name.length > 200) {
        throw new ValidationException('Invalid name: must be a string between 1 and 200 characters')
      }
    }

    // Validate seoFriendlyId (optional)
    if (isDefined(seoFriendlyId) && !isString(seoFriendlyId)) {
      throw new ValidationException('Invalid seoFriendlyId: must be a string')
    }

    // Validate description (optional)
    if (isDefined(description)) {
      if (!isString(description)) {
        throw new ValidationException('Invalid description: must be a string')
      }
      if (description.length < 1 || description.length > 500) {
        throw new ValidationException(
          'Invalid description: must be a string between 1 and 500 characters'
        )
      }
    }

    return new PutChatTypeDto(
      uuidTypeId,
      name === null ? undefined : (name as string | undefined),
      seoFriendlyId === null ? undefined : (seoFriendlyId as string | undefined),
      description === null ? undefined : (description as string | undefined)
    )
  }
}
