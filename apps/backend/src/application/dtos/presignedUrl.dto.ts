import { isArray, isDefined, isObject, isString } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { UnprocessableEntityException } from '../../shared/exceptions/unprocessable-entity.exception.js'

/**
 * Represents a single file's metadata for requesting a presigned upload URL.
 */
export interface PresignedUrlFileMetadata {
  filename: string
  mimetype: string
  flow?: string
}

/**
 * Data Transfer Object for the POST /ai/presigned-urls request body.
 *
 * Validates and encapsulates the list of files to generate presigned upload
 * URLs for, plus an optional chatTypeId to associate the uploads with a
 * specific chat type.
 *
 * @example
 * ```typescript
 * const dto = PresignedUrlDto.validate({
 *   files: [
 *     { filename: 'document.pdf', mimetype: 'application/pdf' },
 *     { filename: 'archive.zip', mimetype: 'application/zip' },
 *   ],
 *   chatTypeId: '01HXYZ123',
 * })
 * ```
 */
export class PresignedUrlDto {
  constructor(
    public readonly files: PresignedUrlFileMetadata[],
    public readonly chatTypeId?: string
  ) {}

  /**
   * Validates and constructs a PresignedUrlDto from the raw request body.
   *
   * @param data - Raw request body, expected to match {@link components['schemas']['AIPreSignedRequest']}
   * @returns A validated PresignedUrlDto instance
   * @throws {TypeException} When the payload shape is invalid
   */
  static validate(data: components['schemas']['AIPreSignedRequest']): PresignedUrlDto {
    const d = data as Record<string, unknown>

    if (!isDefined(d) || !isObject(d)) {
      throw new TypeException('Request body must be a valid object')
    }

    if (!isDefined(d['files']) || !isArray(d['files'])) {
      throw new TypeException('files is required and must be an array')
    }

    if (!d['files'] || !Array.isArray(d['files']) || d['files'].length === 0) {
      throw new UnprocessableEntityException('No files provided. Expected { files: [...] }')
    }

    const rawFiles = d['files'] as unknown[]

    if (rawFiles.length === 0) {
      throw new TypeException('files must contain at least one entry')
    }

    const files: PresignedUrlFileMetadata[] = rawFiles.map((item, index) => {
      if (!isDefined(item) || !isObject(item)) {
        throw new TypeException(`files[${index}] must be a valid object`)
      }

      const file = item as Record<string, unknown>

      if (!isDefined(file['filename']) || !isString(file['filename'])) {
        throw new TypeException(`files[${index}].filename is required and must be a string`)
      }

      if (!isDefined(file['mimetype']) || !isString(file['mimetype'])) {
        throw new TypeException(`files[${index}].mimetype is required and must be a string`)
      }

      const flow =
        isDefined(file['flow']) && isString(file['flow']) ? (file['flow'] as string) : undefined

      return {
        filename: file['filename'] as string,
        mimetype: file['mimetype'] as string,
        flow,
      }
    })

    const chatTypeId =
      isDefined(d['chatTypeId']) && isString(d['chatTypeId'])
        ? (d['chatTypeId'] as string)
        : undefined

    return new PresignedUrlDto(files, chatTypeId)
  }
}
