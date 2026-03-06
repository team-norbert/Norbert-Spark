import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

import { obscured } from 'obscured'

import { EnvConfig } from '../../infrastructure/config/env.config.js'

/**
 * Encryption utility for sensitive data like 2FA secrets.
 * Uses AES-256-GCM encryption with key derivation from environment variable.
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Random IV for each encryption operation
 * - Key derivation using scrypt
 * - Authentication tag verification
 *
 * @example
 * ```typescript
 * const secret = 'JBSWY3DPEHPK3PXP'
 * const encrypted = encryptTwoFactorSecret(secret)
 * const decrypted = decryptTwoFactorSecret(encrypted) // Returns 'JBSWY3DPEHPK3PXP'
 * ```
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32
const KEY_LENGTH = 32 // 256 bits

/**
 * Derives an encryption key from the master key using scrypt.
 *
 * @param masterKey - The master encryption key from environment
 * @param salt - Salt for key derivation
 * @returns Derived encryption key
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH)
}

/**
 * Gets the master encryption key from environment variables.
 * Falls back to a warning message if not set (for development).
 *
 * @returns Master encryption key
 * @throws {Error} If ENCRYPTION_KEY is not set in production
 */
function getMasterKey(): string | undefined {
  const key = EnvConfig.ENCRYPTION_KEY
  if (!key) {
    if (EnvConfig.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment')
    }
    // Development fallback - log warning
    console.warn('WARNING: ENCRYPTION_KEY not set. Using default key. DO NOT use in production!')
    return 'dev-key-change-in-production-please-use-secure-random-key'
  }
  return obscured.value(key)
}

/**
 * Encrypts a two-factor authentication secret.
 *
 * The encrypted format is: salt:iv:authTag:encryptedData (all base64 encoded)
 *
 * @param plaintext - The plaintext 2FA secret to encrypt
 * @returns Base64-encoded encrypted string with format: salt:iv:authTag:encryptedData
 * @throws {Error} If encryption fails
 *
 * @example
 * ```typescript
 * const secret = 'JBSWY3DPEHPK3PXP'
 * const encrypted = encryptTwoFactorSecret(secret)
 * // Returns: 'salt:iv:tag:data' (base64 encoded)
 * ```
 */
export function encryptTwoFactorSecret(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string')
  }

  const masterKey = getMasterKey()
  if (!masterKey) {
    throw new Error('Master key is required for encryption')
  }
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(masterKey, salt)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Format: salt:iv:authTag:encryptedData (all base64 encoded)
  return `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypts a two-factor authentication secret.
 *
 * @param encrypted - The encrypted string in format: salt:iv:authTag:encryptedData
 * @returns Decrypted plaintext 2FA secret
 * @throws {Error} If decryption fails or authentication tag verification fails
 *
 * @example
 * ```typescript
 * const encrypted = 'salt:iv:tag:data' // base64 encoded
 * const decrypted = decryptTwoFactorSecret(encrypted)
 * // Returns: 'JBSWY3DPEHPK3PXP'
 * ```
 */
export function decryptTwoFactorSecret(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Cannot decrypt empty string')
  }

  const parts = encrypted.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }

  const saltB64 = parts[0]
  const ivB64 = parts[1]
  const authTagB64 = parts[2]
  const encryptedData = parts[3]

  if (!saltB64 || !ivB64 || !authTagB64 || !encryptedData) {
    throw new Error('Invalid encrypted data: missing components')
  }

  const masterKey = getMasterKey()
  if (!masterKey) {
    throw new Error('Master key is required for decryption')
  }
  const salt = Buffer.from(saltB64, 'base64')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const key = deriveKey(masterKey, salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
