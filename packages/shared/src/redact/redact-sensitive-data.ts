/**
 * List of sensitive field names that should be redacted in audit logs
 * to comply with security and privacy requirements (GDPR, PCI-DSS, etc.).
 *
 * This list is also used by the Pino logger's `redact` option so that
 * sensitive values are automatically censored in every structured log line.
 */
export const SENSITIVE_FIELDS = [
  // Authentication & Authorization
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'resetToken',
  'oldToken',
  'newToken',
  'apiKey',
  'secret',
  'privateKey',
  'publicKey',
  'jwt',
  'sessionId',
  'authToken',

  // Financial Information
  'creditCard',
  'cardNumber',
  'cvv',
  'cvc',
  'expiryDate',
  'cardholderName',
  'bankAccount',
  'routingNumber',
  'iban',
  'swift',

  // Personal Identifiable Information (PII)
  'email',
  'ip',
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'nationalId',
  'passport',
  'driversLicense',
  'dob',
  'dateOfBirth',

  // Healthcare
  'medicalRecord',
  'healthRecord',
  'diagnosis',
  'prescription',

  // Biometric
  'fingerprint',
  'faceId',
  'retinaScan',
  'biometric',
] as const

/**
 * Placeholder text for redacted sensitive fields
 */
const REDACTED_PLACEHOLDER = '[REDACTED]'

/**
 * Keys that must never be written to a plain object to prevent prototype pollution
 */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Recursively redacts sensitive fields from an object
 *
 * This function deeply traverses nested objects and arrays to ensure
 * sensitive data is removed at all levels before being stored in audit logs.
 *
 * @param data - The data object to redact (can be any type)
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @returns A new object with sensitive fields redacted
 *
 * @example
 * ```typescript
 * const data = {
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   profile: {
 *     name: 'John',
 *     ssn: '123-45-6789'
 *   }
 * }
 *
 * const redacted = redactSensitiveData(data)
 * // Result:
 * // {
 * //   email: '[REDACTED]',
 * //   password: '[REDACTED]',
 * //   profile: {
 * //     name: 'John',
 * //     ssn: '[REDACTED]'
 * //   }
 * // }
 * ```
 */
export function redactSensitiveData(
  data: unknown,
  depth: number = 0,
  maxDepth: number = 10
): unknown {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]'
  }

  // Handle null and undefined
  if (data == null) {
    return data
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1, maxDepth))
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data
  }

  // Handle regular objects
  // Use a null-prototype object so that keys like __proto__ cannot mutate
  // the prototype chain (defense-in-depth alongside the DANGEROUS_KEYS guard).
  const redacted: Record<string, unknown> = Object.create(null) as Record<string, unknown>

  for (const [key, value] of Object.entries(data)) {
    // Skip keys that could lead to prototype pollution
    if (DANGEROUS_KEYS.has(key)) {
      continue
    }

    // Check if the field name matches any sensitive field (case-insensitive)
    const isFieldSensitive = SENSITIVE_FIELDS.some(
      (sensitiveField) => key.toLowerCase() === sensitiveField.toLowerCase()
    )

    if (isFieldSensitive) {
      // Redact the entire field
      Reflect.set(redacted, key, REDACTED_PLACEHOLDER)
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      Reflect.set(redacted, key, redactSensitiveData(value, depth + 1, maxDepth))
    } else {
      // Keep non-sensitive primitive values
      Reflect.set(redacted, key, value)
    }
  }

  return redacted
}

/**
 * Type guard to check if changes object needs redaction
 */
export function hasChangesObject(
  entry: unknown
): entry is { changes: Record<string, unknown> | null } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'changes' in entry &&
    (entry.changes === null || typeof entry.changes === 'object')
  )
}
