import { is64CharHexString, isDefined, isObject } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class PostRefreshDTO {
  constructor(public readonly refreshToken: string) {}

  static validate(data: components['schemas']['RefreshTokenRequest']): PostRefreshDTO {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Expected an object')
    }
    if (!is64CharHexString(data.refreshToken.trim())) {
      throw new ValidationException(
        'Invalid refreshToken: must be a 64-character hexadecimal string'
      )
    }

    return new PostRefreshDTO(data.refreshToken.trim())
  }
}
