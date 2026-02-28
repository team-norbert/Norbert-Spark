import crypto from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { RefreshToken } from '../../../src/domain/value-objects/refresh-token..js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('RefreshToken', () => {
  describe('generate', () => {
    it('should generate a new refresh token', () => {
      const token = RefreshToken.generate()

      expect(token).toBeInstanceOf(RefreshToken)
    })

    it('should generate a token with 64 character raw token', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()

      expect(rawToken).toHaveLength(64)
    })

    it('should generate a token with hexadecimal characters only', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()

      expect(rawToken).toMatch(/^[0-9a-f]{64}$/i)
    })

    it('should generate a token with 64 character hash', () => {
      const token = RefreshToken.generate()
      const hash = token.getHash()

      expect(hash).toHaveLength(64)
    })

    it('should generate hash that is different from raw token', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()
      const hash = token.getHash()

      expect(hash).not.toBe(rawToken)
    })

    it('should generate unique tokens on each call', () => {
      const token1 = RefreshToken.generate()
      const token2 = RefreshToken.generate()

      expect(token1.getRawToken()).not.toBe(token2.getRawToken())
      expect(token1.getHash()).not.toBe(token2.getHash())
    })

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set<string>()

      // Generate 100 tokens - collision probability should be negligible
      for (let i = 0; i < 100; i++) {
        tokens.add(RefreshToken.generate().getRawToken())
      }

      expect(tokens.size).toBe(100)
    })

    it('should generate hash using SHA-256', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()
      const hash = token.getHash()

      // Manually compute SHA-256 hash
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex')

      expect(hash).toBe(expectedHash)
    })
  })

  describe('fromRaw', () => {
    it('should create a token from valid raw token', () => {
      const rawToken = 'a'.repeat(64)
      const token = RefreshToken.fromRaw(rawToken)

      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.getRawToken()).toBe(rawToken)
    })

    it('should compute correct hash from raw token', () => {
      const rawToken = '0123456789abcdef'.repeat(4) // 64 chars
      const token = RefreshToken.fromRaw(rawToken)

      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex')

      expect(token.getHash()).toBe(expectedHash)
    })

    it('should accept lowercase hexadecimal characters', () => {
      const rawToken = 'abcdef0123456789'.repeat(4) // 64 chars lowercase

      expect(() => RefreshToken.fromRaw(rawToken)).not.toThrow()
    })

    it('should accept uppercase hexadecimal characters', () => {
      const rawToken = 'ABCDEF0123456789'.repeat(4) // 64 chars uppercase

      expect(() => RefreshToken.fromRaw(rawToken)).not.toThrow()
    })

    it('should accept mixed case hexadecimal characters', () => {
      const rawToken = 'AbCdEf0123456789'.repeat(4) // 64 chars mixed case

      expect(() => RefreshToken.fromRaw(rawToken)).not.toThrow()
    })

    it('should preserve original casing in raw token', () => {
      const rawToken = 'ABCDEF0123456789'.repeat(4)
      const token = RefreshToken.fromRaw(rawToken)

      expect(token.getRawToken()).toBe(rawToken)
    })

    it('should throw ValidationException for non-string input', () => {
      expect(() => RefreshToken.fromRaw(123 as any)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(123 as any)).toThrow('Refresh token must be a string')
    })

    it('should throw ValidationException for null input', () => {
      expect(() => RefreshToken.fromRaw(null as any)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(null as any)).toThrow('Refresh token must be a string')
    })

    it('should throw ValidationException for undefined input', () => {
      expect(() => RefreshToken.fromRaw(undefined as any)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(undefined as any)).toThrow('Refresh token must be a string')
    })

    it('should throw ValidationException for empty string', () => {
      expect(() => RefreshToken.fromRaw('')).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw('')).toThrow('Refresh token must be 64 characters')
    })

    it('should throw ValidationException for token too short', () => {
      const rawToken = 'a'.repeat(63)

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(rawToken)).toThrow('Refresh token must be 64 characters')
    })

    it('should throw ValidationException for token too long', () => {
      const rawToken = 'a'.repeat(65)

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(rawToken)).toThrow('Refresh token must be 64 characters')
    })

    it('should throw ValidationException for non-hexadecimal characters', () => {
      const rawToken = 'g'.repeat(64) // 'g' is not a hex character

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(
        'Refresh token must contain only hexadecimal characters'
      )
    })

    it('should throw ValidationException for token with special characters', () => {
      const rawToken = '@'.repeat(64)

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(
        'Refresh token must contain only hexadecimal characters'
      )
    })

    it('should throw ValidationException for token with spaces', () => {
      const rawToken = 'a'.repeat(63) + ' '

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
    })

    it('should throw ValidationException for token with newlines', () => {
      const rawToken = 'a'.repeat(63) + '\n'

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
    })

    it('should throw ValidationException for token with unicode characters', () => {
      const rawToken = 'a'.repeat(63) + '€'

      expect(() => RefreshToken.fromRaw(rawToken)).toThrow(ValidationException)
    })
  })

  describe('getRawToken', () => {
    it('should return the raw token string', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()

      expect(typeof rawToken).toBe('string')
      expect(rawToken).toHaveLength(64)
    })

    it('should return consistent value on multiple calls', () => {
      const token = RefreshToken.generate()
      const rawToken1 = token.getRawToken()
      const rawToken2 = token.getRawToken()

      expect(rawToken1).toBe(rawToken2)
    })

    it('should return the same value as provided to fromRaw', () => {
      const originalRaw = 'a'.repeat(64)
      const token = RefreshToken.fromRaw(originalRaw)

      expect(token.getRawToken()).toBe(originalRaw)
    })
  })

  describe('getHash', () => {
    it('should return the hash string', () => {
      const token = RefreshToken.generate()
      const hash = token.getHash()

      expect(typeof hash).toBe('string')
      expect(hash).toHaveLength(64)
    })

    it('should return SHA-256 hash', () => {
      const token = RefreshToken.generate()
      const hash = token.getHash()

      // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[0-9a-f]{64}$/i)
    })

    it('should return consistent value on multiple calls', () => {
      const token = RefreshToken.generate()
      const hash1 = token.getHash()
      const hash2 = token.getHash()

      expect(hash1).toBe(hash2)
    })

    it('should return computed hash from raw token', () => {
      const rawToken = 'a'.repeat(64)
      const token = RefreshToken.fromRaw(rawToken)
      const hash = token.getHash()

      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex')

      expect(hash).toBe(expectedHash)
    })

    it('should return same hash for same raw token', () => {
      const rawToken = '0123456789abcdef'.repeat(4)
      const token1 = RefreshToken.fromRaw(rawToken)
      const token2 = RefreshToken.fromRaw(rawToken)

      expect(token1.getHash()).toBe(token2.getHash())
    })

    it('should return different hash for different raw tokens', () => {
      const rawToken1 = 'a'.repeat(64)
      const rawToken2 = 'b'.repeat(64)
      const token1 = RefreshToken.fromRaw(rawToken1)
      const token2 = RefreshToken.fromRaw(rawToken2)

      expect(token1.getHash()).not.toBe(token2.getHash())
    })
  })

  describe('Security properties', () => {
    it('should not expose raw token in hash', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()
      const hash = token.getHash()

      expect(hash).not.toContain(rawToken)
      expect(hash).not.toBe(rawToken)
    })

    it('should generate tokens that are not predictable', () => {
      const token1 = RefreshToken.generate()
      const token2 = RefreshToken.generate()
      const token3 = RefreshToken.generate()

      // Check that consecutive tokens don't have obvious patterns
      expect(token1.getRawToken().substring(0, 10)).not.toBe(token2.getRawToken().substring(0, 10))
      expect(token2.getRawToken().substring(0, 10)).not.toBe(token3.getRawToken().substring(0, 10))
    })

    it('should make it computationally infeasible to reverse hash to raw token', () => {
      const token = RefreshToken.generate()
      const hash = token.getHash()

      // We can only verify the hash was created correctly, not reverse it
      const expectedHash = crypto.createHash('sha256').update(token.getRawToken()).digest('hex')

      expect(hash).toBe(expectedHash)
      expect(hash).toHaveLength(64)
    })
  })

  describe('Integration scenarios', () => {
    it('should support token generation and validation flow', () => {
      // Login: Generate new token
      const token = RefreshToken.generate()
      const rawTokenForClient = token.getRawToken()
      const hashForDatabase = token.getHash()

      // Store hash in database (simulation)
      const storedHash = hashForDatabase

      // Client sends token back
      const tokenFromClient = RefreshToken.fromRaw(rawTokenForClient)

      // Verify hash matches stored hash
      expect(tokenFromClient.getHash()).toBe(storedHash)
    })

    it('should detect tampered tokens', () => {
      const token = RefreshToken.generate()
      const rawToken = token.getRawToken()
      const originalHash = token.getHash()

      // Attacker modifies one character (change first char to 'a' if not 'a', otherwise to 'b')
      const firstChar = rawToken[0].toLowerCase()
      const newFirstChar = firstChar === 'a' ? 'b' : 'a'
      const tamperedToken = newFirstChar + rawToken.substring(1)
      const tokenFromTamperedRaw = RefreshToken.fromRaw(tamperedToken)

      // Hash should be completely different
      expect(tokenFromTamperedRaw.getHash()).not.toBe(originalHash)
    })

    it('should treat hex strings as case-sensitive for hashing', () => {
      const token1 = RefreshToken.fromRaw('abcdef0123456789'.repeat(4))
      const token2 = RefreshToken.fromRaw('ABCDEF0123456789'.repeat(4))

      // Raw tokens are different (different casing)
      expect(token1.getRawToken()).not.toBe(token2.getRawToken())

      // Hashes are also different (SHA-256 is case-sensitive)
      expect(token1.getHash()).not.toBe(token2.getHash())
    })
  })
})
