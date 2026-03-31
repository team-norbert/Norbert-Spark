import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ZipSecurityMaxFileException extends BaseException {
  constructor(message: string, details?: Record<string, any>, options?: ErrorOptions) {
    super(message, ErrorCode.MAX_FILE_COUNT_EXCEEDED, HttpStatus.BAD_REQUEST, details, options)
  }
}
