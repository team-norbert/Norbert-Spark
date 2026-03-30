import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ZipSecuritySuspiciousException extends BaseException {
  constructor(message: string, details?: Record<string, any>, options?: ErrorOptions) {
    super(
      message,
      ErrorCode.SUSPICIOUS_COMPRESSION_RATIO,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      options
    )
  }
}
