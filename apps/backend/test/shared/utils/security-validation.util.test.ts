import { describe, expect, it } from 'vitest'

import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'
import {
  sanitizeFilename,
  sanitizeForShell,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
  validatePathWithinBase,
  validateSafeIdentifier,
} from '../../../src/shared/utils/security-validation.util.js'

describe('Security Validation Utilities', () => {
  describe('validatePathWithinBase', () => {
    const baseDir = '/app/data'

    it('should allow valid paths within base directory', () => {
      expect(validatePathWithinBase('file.txt', baseDir)).toBe('/app/data/file.txt')
      expect(validatePathWithinBase('uploads/file.pdf', baseDir)).toBe('/app/data/uploads/file.pdf')
      expect(validatePathWithinBase('a/b/c/file.txt', baseDir)).toBe('/app/data/a/b/c/file.txt')
    })

    it('should normalize paths correctly', () => {
      expect(validatePathWithinBase('./file.txt', baseDir)).toBe('/app/data/file.txt')
      // Note: paths with .. are rejected even if they resolve within base dir
      // This is intentional for security - we reject suspicious patterns early
    })

    it('should reject paths containing .. even if they resolve within base', () => {
      // Stricter validation: reject any path with traversal patterns
      expect(() => validatePathWithinBase('uploads/../file.txt', baseDir)).toThrow(
        ValidationException
      )
    })

    it('should reject directory traversal with ../', () => {
      expect(() => validatePathWithinBase('../etc/passwd', baseDir)).toThrow(ValidationException)
      expect(() => validatePathWithinBase('../../root', baseDir)).toThrow(ValidationException)
    })

    it('should reject directory traversal in middle of path', () => {
      expect(() => validatePathWithinBase('uploads/../../etc/passwd', baseDir)).toThrow(
        ValidationException
      )
    })

    it('should reject absolute paths', () => {
      expect(() => validatePathWithinBase('/etc/passwd', baseDir)).toThrow(ValidationException)
      expect(() => validatePathWithinBase('/root/.ssh/id_rsa', baseDir)).toThrow(ValidationException)
    })

    it('should reject Windows-style paths', () => {
      expect(() => validatePathWithinBase('C:\\Windows\\System32', baseDir)).toThrow(
        ValidationException
      )
    })

    it('should reject home directory expansion', () => {
      expect(() => validatePathWithinBase('~/.bashrc', baseDir)).toThrow(ValidationException)
    })

    it('should reject URL-encoded traversal attempts', () => {
      expect(() => validatePathWithinBase('%2e%2e/etc/passwd', baseDir)).toThrow(ValidationException)
      expect(() => validatePathWithinBase('%2f..%2f..%2fetc/passwd', baseDir)).toThrow(
        ValidationException
      )
    })

    it('should reject null byte injection', () => {
      expect(() => validatePathWithinBase('file.txt\0.exe', baseDir)).toThrow(ValidationException)
    })
  })

  describe('sanitizeFilename', () => {
    it('should allow safe filenames unchanged', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf')
      expect(sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt')
    })

    it('should remove path separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt')
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt')
    })

    it('should remove shell metacharacters', () => {
      expect(sanitizeFilename('file`whoami`.txt')).toBe('filewhoami.txt')
      expect(sanitizeFilename('file$(id).txt')).toBe('fileid.txt')
      expect(sanitizeFilename('file;rm -rf.txt')).toBe('filerm_-rf.txt')
    })

    it('should remove HTML/script characters', () => {
      expect(sanitizeFilename('<script>alert.js')).toBe('scriptalert.js')
      expect(sanitizeFilename('file"quoted".txt')).toBe('filequoted.txt')
    })

    it('should handle leading/trailing dots', () => {
      expect(sanitizeFilename('.hidden')).toBe('hidden')
      expect(sanitizeFilename('..htaccess')).toBe('htaccess')
      expect(sanitizeFilename('file.')).toBe('file')
    })

    it('should collapse multiple dots', () => {
      expect(sanitizeFilename('file...txt')).toBe('file.txt')
    })

    it('should collapse multiple spaces/underscores', () => {
      expect(sanitizeFilename('my   file.txt')).toBe('my_file.txt')
      expect(sanitizeFilename('my___file.txt')).toBe('my_file.txt')
    })

    it('should truncate long filenames while preserving extension', () => {
      const longName = 'a'.repeat(300) + '.pdf'
      const result = sanitizeFilename(longName, 255)
      expect(result.length).toBeLessThanOrEqual(255)
      expect(result.endsWith('.pdf')).toBe(true)
    })

    it('should throw for empty filename', () => {
      expect(() => sanitizeFilename('')).toThrow(ValidationException)
    })

    it('should throw for filename that becomes empty after sanitization', () => {
      expect(() => sanitizeFilename('...')).toThrow(ValidationException)
      expect(() => sanitizeFilename('<>')).toThrow(ValidationException)
    })
  })

  describe('validateFileExtension', () => {
    it('should allow valid extensions', () => {
      expect(validateFileExtension('document.pdf', ['pdf', 'zip'])).toBe(true)
      expect(validateFileExtension('archive.ZIP', ['pdf', 'zip'])).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(validateFileExtension('file.PDF', ['pdf'])).toBe(true)
      expect(validateFileExtension('file.Pdf', ['PDF'])).toBe(true)
    })

    it('should handle extensions with or without dots in allowlist', () => {
      expect(validateFileExtension('file.pdf', ['.pdf'])).toBe(true)
      expect(validateFileExtension('file.pdf', ['pdf'])).toBe(true)
    })

    it('should reject disallowed extensions', () => {
      expect(() => validateFileExtension('script.exe', ['pdf', 'zip'])).toThrow(ValidationException)
      expect(() => validateFileExtension('payload.php', ['pdf', 'zip'])).toThrow(ValidationException)
    })

    it('should reject files without extension', () => {
      expect(() => validateFileExtension('noextension', ['pdf'])).toThrow(ValidationException)
    })
  })

  describe('validateMimeType', () => {
    it('should allow valid MIME types', () => {
      expect(validateMimeType('application/pdf', ['application/pdf', 'application/zip'])).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(validateMimeType('Application/PDF', ['application/pdf'])).toBe(true)
    })

    it('should trim whitespace', () => {
      expect(validateMimeType(' application/pdf ', ['application/pdf'])).toBe(true)
    })

    it('should reject disallowed MIME types', () => {
      expect(() =>
        validateMimeType('application/x-executable', ['application/pdf'])
      ).toThrow(ValidationException)
    })
  })

  describe('sanitizeForShell', () => {
    it('should remove backticks (command substitution)', () => {
      expect(sanitizeForShell('hello`whoami`world')).toBe('hellowhoamiworld')
    })

    it('should remove dollar signs (variable expansion)', () => {
      expect(sanitizeForShell('hello$PATH')).toBe('helloPATH')
      expect(sanitizeForShell('$(id)')).toBe('id')
    })

    it('should remove semicolons (command chaining)', () => {
      expect(sanitizeForShell('file; rm -rf /')).toBe('file rm -rf /')
    })

    it('should remove pipes and redirects', () => {
      expect(sanitizeForShell('file | cat > out')).toBe('file  cat  out')
    })

    it('should remove parentheses and braces', () => {
      expect(sanitizeForShell('$(cmd)')).toBe('cmd')
      expect(sanitizeForShell('{cmd}')).toBe('cmd')
    })

    it('should remove quotes', () => {
      expect(sanitizeForShell("it's")).toBe('its')
      expect(sanitizeForShell('"quoted"')).toBe('quoted')
    })

    it('should handle empty/null input', () => {
      expect(sanitizeForShell('')).toBe('')
      expect(sanitizeForShell(null as unknown as string)).toBe('')
      expect(sanitizeForShell(undefined as unknown as string)).toBe('')
    })
  })

  describe('validateSafeIdentifier', () => {
    it('should allow alphanumeric identifiers', () => {
      expect(validateSafeIdentifier('user123')).toBe(true)
      expect(validateSafeIdentifier('file-name')).toBe(true)
      expect(validateSafeIdentifier('file_name')).toBe(true)
      expect(validateSafeIdentifier('ABC-123_xyz')).toBe(true)
    })

    it('should reject identifiers with special characters', () => {
      expect(() => validateSafeIdentifier('user@domain')).toThrow(ValidationException)
      expect(() => validateSafeIdentifier('user.name')).toThrow(ValidationException)
      expect(() => validateSafeIdentifier('user name')).toThrow(ValidationException)
    })

    it('should reject identifiers with shell metacharacters', () => {
      expect(() => validateSafeIdentifier('user;id')).toThrow(ValidationException)
      expect(() => validateSafeIdentifier('user`id`')).toThrow(ValidationException)
    })

    it('should reject empty identifiers', () => {
      expect(() => validateSafeIdentifier('')).toThrow(ValidationException)
      expect(() => validateSafeIdentifier(null as unknown as string)).toThrow(ValidationException)
    })

    it('should accept custom pattern', () => {
      expect(validateSafeIdentifier('user@domain.com', /^[a-zA-Z0-9@.]+$/)).toBe(true)
    })
  })

  describe('validateFileSize', () => {
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

    it('should allow files within size limit', () => {
      expect(validateFileSize(1024, MAX_SIZE)).toBe(true)
      expect(validateFileSize(MAX_SIZE, MAX_SIZE)).toBe(true)
      expect(validateFileSize(0, MAX_SIZE)).toBe(true)
    })

    it('should reject files exceeding size limit', () => {
      expect(() => validateFileSize(MAX_SIZE + 1, MAX_SIZE)).toThrow(ValidationException)
      expect(() => validateFileSize(100 * 1024 * 1024, MAX_SIZE)).toThrow(ValidationException)
    })

    it('should include size info in error message', () => {
      expect(() => validateFileSize(20 * 1024 * 1024, MAX_SIZE)).toThrow(/20\.00 MB/)
      expect(() => validateFileSize(20 * 1024 * 1024, MAX_SIZE)).toThrow(/10\.00 MB/)
    })

    it('should reject negative file sizes', () => {
      expect(() => validateFileSize(-1, MAX_SIZE)).toThrow(ValidationException)
    })

    it('should reject non-numeric sizes', () => {
      expect(() => validateFileSize('1024' as unknown as number, MAX_SIZE)).toThrow(
        ValidationException
      )
    })
  })
})

