import { describe, expect, it } from 'vitest'

import { ExtractDataDto } from '../../../src/application/dtos/extract-data.dto.js'

describe('ExtractDataDto', () => {
  describe('constructor', () => {
    it('should create an ExtractDataDto with valid data', () => {
      const bucketName = 'my-bucket'
      const fileKey = 'path/to/file.pdf'

      const dto = new ExtractDataDto(bucketName, fileKey)

      expect(dto.bucketName).toBe(bucketName)
      expect(dto.fileKey).toBe(fileKey)
    })

    it('should have readonly properties at compile time', () => {
      const dto = new ExtractDataDto('test-bucket', 'test/file.pdf')

      expect(dto.bucketName).toBeDefined()
      expect(dto.fileKey).toBeDefined()

      const bucketNameDescriptor = Object.getOwnPropertyDescriptor(dto, 'bucketName')
      const fileKeyDescriptor = Object.getOwnPropertyDescriptor(dto, 'fileKey')

      expect(bucketNameDescriptor?.enumerable).toBe(true)
      expect(fileKeyDescriptor?.enumerable).toBe(true)
    })

    it('should be instance of ExtractDataDto', () => {
      const dto = new ExtractDataDto('test-bucket', 'test/file.pdf')

      expect(dto).toBeInstanceOf(ExtractDataDto)
    })

    it('should accept any string value for bucketName', () => {
      const dto = new ExtractDataDto('any-bucket-name', 'file.pdf')

      expect(dto.bucketName).toBe('any-bucket-name')
    })

    it('should accept any string value for fileKey', () => {
      const dto = new ExtractDataDto('bucket', 'any/path/to/file.pdf')

      expect(dto.fileKey).toBe('any/path/to/file.pdf')
    })

    it('should handle empty strings without validation', () => {
      const dto = new ExtractDataDto('', '')

      expect(dto.bucketName).toBe('')
      expect(dto.fileKey).toBe('')
    })

    it('should preserve bucketName exactly as provided', () => {
      const bucketName = 'My-Bucket_123'
      const dto = new ExtractDataDto(bucketName, 'file.pdf')

      expect(dto.bucketName).toBe(bucketName)
    })

    it('should preserve fileKey exactly as provided', () => {
      const fileKey = 'data-extraction/uuid/my file (1).pdf'
      const dto = new ExtractDataDto('bucket', fileKey)

      expect(dto.fileKey).toBe(fileKey)
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create ExtractDataDto with valid data', () => {
        const data = {
          bucketName: 'my-bucket',
          fileKey: 'path/to/file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto).toBeInstanceOf(ExtractDataDto)
        expect(dto.bucketName).toBe(data.bucketName)
        expect(dto.fileKey).toBe(data.fileKey)
      })

      it('should validate with bucketName containing hyphens', () => {
        const data = {
          bucketName: 'my-test-bucket-123',
          fileKey: 'file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe(data.bucketName)
      })

      it('should validate with fileKey containing nested paths', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'data-extraction/uuid/subfolder/document.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(data.fileKey)
      })

      it('should validate with fileKey containing special characters', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'path/my file (1).pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(data.fileKey)
      })

      it('should validate with fileKey containing unicode characters', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'path/документ.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(data.fileKey)
      })

      it('should validate with long bucketName', () => {
        const longBucketName = 'a'.repeat(63) // S3 bucket name max length
        const data = {
          bucketName: longBucketName,
          fileKey: 'file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe(longBucketName)
      })

      it('should validate with long fileKey', () => {
        const longFileKey = 'path/' + 'a'.repeat(500) + '.pdf'
        const data = {
          bucketName: 'bucket',
          fileKey: longFileKey,
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(longFileKey)
      })

      it('should validate with fileKey containing dots', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'path/file.name.with.dots.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(data.fileKey)
      })

      it('should validate with bucketName in lowercase', () => {
        const data = {
          bucketName: 'my-bucket',
          fileKey: 'file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe(data.bucketName)
      })

      it('should validate with fileKey starting with slash', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: '/path/to/file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe(data.fileKey)
      })
    })

    describe('validation errors - data parameter', () => {
      it('should throw TypeError when data is undefined', () => {
        expect(() => ExtractDataDto.validate(undefined)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(undefined)).toThrow('Data must be a valid object')
      })

      it('should throw TypeError when data is null', () => {
        expect(() => ExtractDataDto.validate(null)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(null)).toThrow('Data must be a valid object')
      })

      it('should throw TypeError when data is not an object', () => {
        expect(() => ExtractDataDto.validate('string')).toThrow(TypeError)
        expect(() => ExtractDataDto.validate('string')).toThrow('Data must be a valid object')
      })

      it('should throw TypeError when data is a number', () => {
        expect(() => ExtractDataDto.validate(123)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(123)).toThrow('Data must be a valid object')
      })

      it('should throw TypeError when data is a boolean', () => {
        expect(() => ExtractDataDto.validate(true)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(true)).toThrow('Data must be a valid object')
      })

      it('should throw TypeError when data is an array', () => {
        expect(() => ExtractDataDto.validate(['bucket', 'key'])).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(['bucket', 'key'])).toThrow(
          'Data must be a valid object'
        )
      })
    })

    describe('validation errors - bucketName field', () => {
      it('should throw TypeError when bucketName is undefined', () => {
        const data = {
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when bucketName is null', () => {
        const data = {
          bucketName: null,
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when bucketName is not a string', () => {
        const data = {
          bucketName: 123,
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when bucketName is an object', () => {
        const data = {
          bucketName: { name: 'bucket' },
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when bucketName is an array', () => {
        const data = {
          bucketName: ['bucket'],
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when bucketName is a boolean', () => {
        const data = {
          bucketName: true,
          fileKey: 'file.pdf',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })
    })

    describe('validation errors - fileKey field', () => {
      it('should throw TypeError when fileKey is undefined', () => {
        const data = {
          bucketName: 'bucket',
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })

      it('should throw TypeError when fileKey is null', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: null,
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })

      it('should throw TypeError when fileKey is not a string', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 123,
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })

      it('should throw TypeError when fileKey is an object', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: { path: 'file.pdf' },
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })

      it('should throw TypeError when fileKey is an array', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: ['file.pdf'],
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })

      it('should throw TypeError when fileKey is a boolean', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: false,
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'fileKeys is required and must be a string'
        )
      })
    })

    describe('validation errors - multiple fields', () => {
      it('should throw TypeError when both bucketName and fileKey are missing', () => {
        const data = {}

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when both fields are null', () => {
        const data = {
          bucketName: null,
          fileKey: null,
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })

      it('should throw TypeError when both fields are wrong types', () => {
        const data = {
          bucketName: 123,
          fileKey: true,
        }

        expect(() => ExtractDataDto.validate(data)).toThrow(TypeError)
        expect(() => ExtractDataDto.validate(data)).toThrow(
          'bucketName is required and must be a string'
        )
      })
    })

    describe('edge cases', () => {
      it('should accept empty string for bucketName', () => {
        const data = {
          bucketName: '',
          fileKey: 'file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe('')
      })

      it('should accept empty string for fileKey', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: '',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe('')
      })

      it('should accept both fields as empty strings', () => {
        const data = {
          bucketName: '',
          fileKey: '',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe('')
        expect(dto.fileKey).toBe('')
      })

      it('should ignore extra properties in data object', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'file.pdf',
          extra: 'ignored',
          another: 123,
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe('bucket')
        expect(dto.fileKey).toBe('file.pdf')
        expect(dto).not.toHaveProperty('extra')
        expect(dto).not.toHaveProperty('another')
      })

      it('should handle fileKey with only slashes', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: '///',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe('///')
      })

      it('should handle bucketName with numbers', () => {
        const data = {
          bucketName: 'bucket-123-456',
          fileKey: 'file.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.bucketName).toBe('bucket-123-456')
      })

      it('should handle fileKey with spaces', () => {
        const data = {
          bucketName: 'bucket',
          fileKey: 'path/my file with spaces.pdf',
        }

        const dto = ExtractDataDto.validate(data)

        expect(dto.fileKey).toBe('path/my file with spaces.pdf')
      })
    })
  })
})
