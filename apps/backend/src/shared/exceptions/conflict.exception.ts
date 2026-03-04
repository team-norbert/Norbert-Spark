import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ConflictException extends BaseException {
  constructor(message: string, details?: Record<string, any>, options?: ErrorOptions) {
    super(message, ErrorCode.ALREADY_EXISTS, HttpStatus.CONFLICT, details, options)
  }
}
