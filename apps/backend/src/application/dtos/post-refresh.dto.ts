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
