import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class TypeException extends BaseException {
  constructor(message: string, details?: Record<string, any>, cause?: unknown) {
    super(message, ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, details, cause)
  }
}
