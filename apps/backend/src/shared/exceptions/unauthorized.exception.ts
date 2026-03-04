import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class UnauthorizedException extends BaseException {
  constructor(message: string, code?: ErrorCode, details?: Record<string, any>, options?: ErrorOptions) {
    super(message, code ?? ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, details, options)
  }
}
