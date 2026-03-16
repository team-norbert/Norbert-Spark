import * as path from 'node:path'

import { fileTypeFromBuffer } from 'file-type'

import { ValidationException } from '../exceptions/validation.exception.js'

/**
 * Security utilities for validating and sanitizing user input
 * that may be used in file paths or command execution.
 *
 * SECURITY BEST PRACTICES:
 * 1. NEVER execute shell commands with user input
 * 2. Always validate file paths against a whitelist of allowed directories
 * 3. Use path.normalize() and path.resolve() to prevent traversal attacks
 * 4. Sanitize filenames to remove dangerous characters
 * 5. Validate file extensions against an allowlist
 */

/**
 * Characters that are dangerous in filenames across different OS
 * Includes shell metacharacters and path separators
 * Note: control character range (ASCII 0–31) is built at runtime to satisfy
 * the no-control-regex lint rule while preserving the intended match.
 */
const ctrlCharsRange = `${String.fromCharCode(0)}-${String.fromCharCode(31)}`
const DANGEROUS_FILENAME_CHARS = new RegExp(
  `[<>:"/\\\\|?*${ctrlCharsRange}\`$&;(){}[\\]!#%^~']`,
  'g'
)

/**
 * Patterns that indicate directory traversal attempts
 */
const TRAVERSAL_PATTERNS = [
  /\.\./, // Parent directory
  /^\/|^\\/, // Absolute paths (Unix/Windows)
  /^[a-zA-Z]:/, // Windows drive letters
  /^~\//, // Home directory expansion
  /%2e%2e/i, // URL encoded ..
  /%2f/i, // URL encoded /
  /%5c/i, // URL encoded \
  /\0/, // Null byte injection
]

/**
 * Shell metacharacters that could lead to command injection
 */
const SHELL_METACHARACTERS = /[`$&|;<>(){}[\]!#*?~'"\\]/g

/**
 * Validates that a path is safe and within an allowed base directory.
 * Prevents directory traversal attacks (CWE-22).
 *
 * @param userPath - The path provided by user input
 * @param baseDir - The allowed base directory
 * @returns The resolved safe path
 * @throws ValidationException if path is outside allowed directory
 *
 * @example
 * ```typescript
 * const safePath = validatePathWithinBase('uploads/file.pdf', '/app/data')
 * // Returns: '/app/data/uploads/file.pdf'
 *
 * validatePathWithinBase('../etc/passwd', '/app/data')
 * // Throws: ValidationException
 * ```
 */
export function validatePathWithinBase(userPath: string, baseDir: string): string {
  // Check for obvious traversal patterns before normalization
  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(userPath)) {
      throw new ValidationException(`Access denied: Path "${userPath}" contains prohibited pattern`)
    }
  }

  const normalizedPath = path.normalize(userPath)
  const fullPath = path.resolve(baseDir, normalizedPath)
  const baseDirResolved = path.resolve(baseDir)

  // Ensure the resolved path starts with the base directory
  const relativePath = path.relative(baseDirResolved, fullPath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new ValidationException(
      `Access denied: Path "${userPath}" is outside the allowed directory`
    )
  }

  return fullPath
}

/**
 * Sanitizes a filename by removing dangerous characters.
 * Use this for user-provided filenames before saving to disk.
 *
 * @param filename - The filename to sanitize
 * @param maxLength - Maximum allowed filename length (default: 255)
 * @returns Sanitized filename
 * @throws ValidationException if filename is empty after sanitization
 *
 * @example
 * ```typescript
 * sanitizeFilename('my file (1).pdf')     // Returns: 'my file 1.pdf'
 * sanitizeFilename('../../etc/passwd')    // Returns: 'etcpasswd'
 * sanitizeFilename('<script>.js')         // Returns: 'script.js'
 * ```
 */
export function sanitizeFilename(filename: string, maxLength = 255): string {
  if (!filename || typeof filename !== 'string') {
    throw new ValidationException('Filename is required')
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\\/]/g, '') // Remove path separators first
    .replace(DANGEROUS_FILENAME_CHARS, '')
    .trim()

  // Remove leading/trailing dots (hidden files, extension manipulation)
  sanitized = sanitized.replace(/^\.+|\.+$/g, '')

  // Collapse multiple dots to single dot
  sanitized = sanitized.replace(/\.{2,}/g, '.')

  // Collapse multiple spaces/underscores
  sanitized = sanitized.replace(/[\s_]+/g, '_')

  // Truncate to max length while preserving extension
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized)
    const nameWithoutExt = sanitized.slice(0, maxLength - ext.length)
    sanitized = nameWithoutExt + ext
  }

  if (!sanitized) {
    throw new ValidationException('Filename is invalid after sanitization')
  }

  return sanitized
}

/**
 * Validates a file extension against an allowlist.
 * Use this to restrict uploaded file types.
 *
 * @param filename - The filename to check
 * @param allowedExtensions - Array of allowed extensions (without dots)
 * @returns true if extension is allowed
 * @throws ValidationException if extension is not allowed
 *
 * @example
 * ```typescript
 * validateFileExtension('document.pdf', ['pdf', 'zip'])  // Returns: true
 * validateFileExtension('script.exe', ['pdf', 'zip'])    // Throws
 * ```
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filename).toLowerCase().replace('.', '')

  if (!ext) {
    throw new ValidationException('File must have an extension')
  }

  const normalizedAllowed = allowedExtensions.map((e) => e.toLowerCase().replace('.', ''))

  if (!normalizedAllowed.includes(ext)) {
    throw new ValidationException(
      `Invalid file extension: .${ext}. Allowed: ${normalizedAllowed.map((e) => `.${e}`).join(', ')}`
    )
  }

  return true
}

/**
 * Validates MIME type against an allowlist.
 * IMPORTANT: MIME types from Content-Type headers can be spoofed.
 * Always validate actual file content when security is critical.
 *
 * @param mimeType - The MIME type to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns true if MIME type is allowed
 * @throws ValidationException if MIME type is not allowed
 */
export function validateMimeType(mimeType: string, allowedMimeTypes: string[]): boolean {
  const normalizedMime = mimeType.toLowerCase().trim()
  const normalizedAllowed = allowedMimeTypes.map((m) => m.toLowerCase().trim())

  if (!normalizedAllowed.includes(normalizedMime)) {
    throw new ValidationException(
      `Invalid MIME type: ${mimeType}. Allowed: ${normalizedAllowed.join(', ')}`
    )
  }

  return true
}

/**
 * Sanitizes a string to be safe for use in shell commands.
 * WARNING: It is STRONGLY recommended to avoid shell commands entirely.
 * Use Node.js built-in APIs (fs, path, etc.) instead.
 *
 * If you MUST use shell commands (not recommended):
 * 1. Use child_process.spawn() with array arguments, NOT shell: true
 * 2. Never interpolate user input into command strings
 * 3. Use this function only as an additional safety layer
 *
 * @param input - The string to sanitize
 * @returns Sanitized string with shell metacharacters removed
 *
 * @example
 * ```typescript
 * // PREFERRED: Use spawn with array arguments
 * spawn('ls', ['-la', sanitizedPath], { shell: false })
 *
 * // AVOID: Shell string interpolation (vulnerable even with sanitization)
 * exec(`ls -la ${userInput}`) // NEVER DO THIS
 * ```
 */
export function sanitizeForShell(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input.replace(SHELL_METACHARACTERS, '').trim()
}

/**
 * Validates that a string contains only alphanumeric characters and safe symbols.
 * Use for IDs, keys, and other identifiers.
 *
 * @param input - The string to validate
 * @param allowedPattern - Regex pattern for allowed characters (default: alphanumeric + hyphen + underscore)
 * @returns true if valid
 * @throws ValidationException if invalid
 */
export function validateSafeIdentifier(
  input: string,
  allowedPattern = /^[a-zA-Z0-9_-]+$/
): boolean {
  if (!input || typeof input !== 'string') {
    throw new ValidationException('Identifier is required')
  }

  if (!allowedPattern.test(input)) {
    throw new ValidationException(
      `Invalid identifier: "${input}". Only alphanumeric characters, hyphens, and underscores are allowed.`
    )
  }

  return true
}

/**
 * Validates file size against a maximum limit.
 *
 * @param sizeBytes - File size in bytes
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns true if size is within limit
 * @throws ValidationException if size exceeds limit
 */
export function validateFileSize(sizeBytes: number, maxSizeBytes: number): boolean {
  if (typeof sizeBytes !== 'number' || sizeBytes < 0) {
    throw new ValidationException('Invalid file size')
  }

  if (sizeBytes > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(2)
    const actualMB = (sizeBytes / (1024 * 1024)).toFixed(2)
    throw new ValidationException(
      `File size (${actualMB} MB) exceeds maximum allowed size (${maxMB} MB)`
    )
  }

  return true
}

/**
 * Validates that file bytes represent a genuine PDF by inspecting magic bytes.
 *
 * Uses `file-type` to analyse the actual content rather than relying on a
 * caller-supplied MIME type or filename extension, both of which can be
 * spoofed. The check fails closed: if the signature is unrecognised a
 * `ValidationException` is thrown.
 *
 * @param buffer - Raw file bytes to inspect (Buffer or Uint8Array).
 * @returns A promise that resolves to `true` when the bytes represent a PDF.
 * @throws {ValidationException} When the bytes are not recognised as PDF.
 *
 * @example
 * ```typescript
 * await validatePDF(pdfBuffer) // resolves true
 * await validatePDF(exeBuffer) // throws ValidationException
 * ```
 */
export async function validatePDF(buffer: Buffer | Uint8Array): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer)
  if (!fileType || fileType.ext !== 'pdf') {
    const detected = fileType ? fileType.ext : 'unknown'
    throw new ValidationException(`Invalid file type: ${detected}. Only PDF files are allowed.`)
  }
  return true
}

export function hasZIPSignature(buf: Uint8Array): boolean {
  if (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    ((buf[2] === 0x03 && buf[3] === 0x04) ||
      (buf[2] === 0x05 && buf[3] === 0x06) ||
      (buf[2] === 0x07 && buf[3] === 0x08))
  ) {
    return true
  }
  throw new ValidationException(`Invalid file type: ZIP file signature not found.`)
}
