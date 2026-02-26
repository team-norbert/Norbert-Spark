import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'
import { BaseException } from './base.exception.js'

export class ExternalServiceException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.EXTERNAL_SERVICE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, details)
  }
}
