import { BaseException } from './base.exception.js'
import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'

export class UnprocessableEntityException extends BaseException {
  constructor(message: string, code?: ErrorCode, details?: Record<string, any>) {
    super(message, code ?? ErrorCode.UNPROCESSABLE_ENTITY, HttpStatus.UNPROCESSABLE_ENTITY, details)
  }
}
