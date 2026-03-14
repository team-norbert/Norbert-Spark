import { isDefined, isObject, isString } from '@norberts-spark/shared'

/**
 * Data Transfer Object representing a request to extract data from a file
 * stored in object storage (S3-compatible bucket).
 *
 * Instances are always created through the {@link ExtractDataDto.validate}
 * factory, which enforces that both required fields are present strings before
 * constructing the DTO. This ensures the application layer never operates on
 * malformed extraction requests.
 *
 * @example
 * ```ts
 * const dto = ExtractDataDto.validate(req.body)
 * await extractDataUseCase.execute(dto)
 * ```
 */
export class ExtractDataDto {
  /**
   * Creates a validated `ExtractDataDto` instance.
   *
   * Prefer {@link ExtractDataDto.validate} over calling this constructor
   * directly — it performs runtime validation before construction.
   *
   * @param bucketName - The name of the S3-compatible bucket containing the file.
   * @param fileKey - The object key (path) of the file within the bucket.
   */
  constructor(
    /**
     * The name of the S3-compatible bucket containing the file to extract data from.
     *
     * @example 'norberts-spark-uploads'
     */
    public readonly bucketName: string,
    /**
     * The object key (path) of the file within the bucket.
     *
     * @example 'rag/550e8400-e29b-41d4-a716-446655440000/document.pdf'
     */
    public readonly fileKey: string
  ) {}

  /**
   * Parses and validates a raw unknown value into a {@link ExtractDataDto}.
   *
   * Validation rules:
   * - `data` must be a non-null object.
   * - `data.bucketName` must be a defined, non-null string.
   * - `data.fileKey` must be a defined, non-null string.
   *
   * @param data - The raw input to validate, typically a parsed request body.
   * @returns A new `ExtractDataDto` constructed from the validated fields.
   * @throws {TypeError} When `data` is not an object.
   * @throws {TypeError} When `data.bucketName` is missing or not a string.
   * @throws {TypeError} When `data.fileKey` is missing or not a string.
   *
   * @example
   * ```ts
   * // Happy path
   * const dto = ExtractDataDto.validate({ bucketName: 'my-bucket', fileKey: 'uploads/doc.pdf' })
   *
   * // Throws TypeError
   * ExtractDataDto.validate({ bucketName: 'my-bucket' }) // missing fileKey
   * ExtractDataDto.validate(null)                        // not an object
   * ```
   */
  static validate(data: any): ExtractDataDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeError('Data must be a valid object')
    }
    if (!isDefined(data.bucketName) || !isString(data.bucketName)) {
      throw new TypeError('bucketName is required and must be a string')
    }
    if (!isDefined(data.fileKey) || !isString(data.fileKey)) {
      throw new TypeError('fileKeys is required and must be a string')
    }

    return new ExtractDataDto(data.bucketName, data.fileKey)
  }
}
