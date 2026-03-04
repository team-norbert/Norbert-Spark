import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ValidationException extends BaseException {
  constructor(message: string, details?: Record<string, any>, cause?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details, cause)
  }
}
