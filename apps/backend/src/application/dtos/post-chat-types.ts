import { isString, isDefined } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class PostChatType {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) {}

  static validate(data: any): PostChatType {
    if (!isDefined(data) || typeof data !== 'object') {
      throw new TypeException('Invalid data: expected an object')
    }
    if (!isString(data.name) || !data.name.trim()) {
      throw new ValidationException('Invalid name: must be a non-empty string')
    }
    if (!isString(data.description) || !data.description.trim()) {
      throw new ValidationException('Invalid description: must be a non-empty string')
    }
    if (data.name.trim().length > 200) {
      throw new ValidationException('Invalid name: must be less than 200 characters')
    }
    if (data.description.trim().length > 500) {
      throw new ValidationException('Invalid description: must be less than 500 characters')
    }
    return new PostChatType(data.name.trim(), data.description.trim())
  }
}
