import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from '../../../src/shared/utils/encryption.util.js'

describe('Encryption Utility', () => {
  const originalEnv = process.env.ENCRYPTION_KEY

  beforeEach(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-only'
  })

  afterEach(() => {
    // Restore original environment
    process.env.ENCRYPTION_KEY = originalEnv
  })

  describe('encryptTwoFactorSecret', () => {
    it('should encrypt a 2FA secret', () => {
      const secret = 'JBSWY3DPEHPK3PXP'
      const encrypted = encryptTwoFactorSecret(secret)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(secret)
      expect(encrypted).toContain(':') // Should contain delimiters
      expect(encrypted.split(':').length).toBe(4) // Should have 4 parts
    })

    it('should produce different ciphertext for the same plaintext', () => {
      const secret = 'JBSWY3DPEHPK3PXP'
      const encrypted1 = encryptTwoFactorSecret(secret)
      const encrypted2 = encryptTwoFactorSecret(secret)

      expect(encrypted1).not.toBe(encrypted2) // Different due to random IV
    })

    it('should throw error for empty string', () => {
      expect(() => encryptTwoFactorSecret('')).toThrow('Cannot encrypt empty string')
    })
  })

  describe('decryptTwoFactorSecret', () => {
    it('should decrypt an encrypted 2FA secret', () => {
      const original = 'JBSWY3DPEHPK3PXP'
      const encrypted = encryptTwoFactorSecret(original)
      const decrypted = decryptTwoFactorSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('should handle various secret formats', () => {
      const secrets = [
        'JBSWY3DPEHPK3PXP',
        'A1B2C3D4E5F6G7H8',
        'secret-with-dashes',
        '1234567890abcdef',
      ]

      for (const secret of secrets) {
        const encrypted = encryptTwoFactorSecret(secret)
        const decrypted = decryptTwoFactorSecret(encrypted)
        expect(decrypted).toBe(secret)
      }
    })

    it('should throw error for empty string', () => {
      expect(() => decryptTwoFactorSecret('')).toThrow('Cannot decrypt empty string')
    })

    it('should throw error for invalid format', () => {
      expect(() => decryptTwoFactorSecret('invalid-format')).toThrow(
        'Invalid encrypted data format'
      )
    })

    it('should throw error for malformed encrypted data', () => {
      expect(() => decryptTwoFactorSecret('part1:part2:part3')).toThrow(
        'Invalid encrypted data format'
      )
    })
  })

  describe('encryption/decryption round trip', () => {
    it('should successfully round-trip multiple times', () => {
      const original = 'JBSWY3DPEHPK3PXP'

      // Encrypt and decrypt multiple times
      for (let i = 0; i < 5; i++) {
        const encrypted = encryptTwoFactorSecret(original)
        const decrypted = decryptTwoFactorSecret(encrypted)
        expect(decrypted).toBe(original)
      }
    })

    it('should handle unicode characters', () => {
      const original = 'Secret🔐WithEmoji😀'
      const encrypted = encryptTwoFactorSecret(original)
      const decrypted = decryptTwoFactorSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('should handle long strings', () => {
      const original = 'A'.repeat(1000)
      const encrypted = encryptTwoFactorSecret(original)
      const decrypted = decryptTwoFactorSecret(encrypted)

      expect(decrypted).toBe(original)
    })
  })
})
