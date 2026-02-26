import { isDefined, isObject, isString } from '@norberts-spark/shared'

export class ExtractDataDto {
  constructor(
    public readonly bucketName: string,
    public readonly fileKey: string
  ) {}
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
