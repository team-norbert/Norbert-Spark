import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ZipSecurityMaxDecompressedException extends BaseException {
  constructor(message: string, details?: Record<string, any>, options?: ErrorOptions) {
    super(
      message,
      ErrorCode.MAX_DECOMPRESSED_SIZE_EXCEEDED,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      options
    )
  }
}
