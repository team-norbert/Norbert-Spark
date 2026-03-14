import { describe, expect, it } from 'vitest'

import { redactSensitiveData } from '../../src/redact/redact-sensitive-data.js'

describe('redactSensitiveData', () => {
  describe('primitive values', () => {
    it('should return null as is', () => {
      expect(redactSensitiveData(null)).toBe(null)
    })

    it('should return undefined as is', () => {
      expect(redactSensitiveData(undefined)).toBe(undefined)
    })

    it('should return string as is', () => {
      expect(redactSensitiveData('test')).toBe('test')
    })

    it('should return number as is', () => {
      expect(redactSensitiveData(123)).toBe(123)
    })

    it('should return boolean as is', () => {
      expect(redactSensitiveData(true)).toBe(true)
    })
  })

  describe('objects with sensitive fields', () => {
    it('should redact password field', () => {
      const data = {
        email: 'user@example.com',
        password: 'secret123',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.email).toBe('[REDACTED]')
      expect(result.password).toBe('[REDACTED]')
    })

    it('should redact multiple sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        token: 'abc123xyz',
        apiKey: 'key-123',
        name: 'John Doe',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.username).toBe('john')
      expect(result.name).toBe('John Doe')
      expect(result.password).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
      expect(result.apiKey).toBe('[REDACTED]')
    })

    it('should be case-insensitive for field names', () => {
      const data = {
        Password: 'secret',
        PASSWORD: 'another',
        PaSsWoRd: 'mixed',
      }

      const result = redactSensitiveData(data) as Record<string, string>

      expect(result.Password).toBe('[REDACTED]')
      expect(result.PASSWORD).toBe('[REDACTED]')
      expect(result.PaSsWoRd).toBe('[REDACTED]')
    })

    it('should redact financial information', () => {
      const data = {
        name: 'John Doe',
        creditCard: '4111-1111-1111-1111',
        cvv: '123',
        bankAccount: '123456789',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John Doe')
      expect(result.creditCard).toBe('[REDACTED]')
      expect(result.cvv).toBe('[REDACTED]')
      expect(result.bankAccount).toBe('[REDACTED]')
    })

    it('should redact PII fields', () => {
      const data = {
        name: 'John Doe',
        ssn: '123-45-6789',
        passport: 'AB123456',
        dob: '1990-01-01',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John Doe')
      expect(result.ssn).toBe('[REDACTED]')
      expect(result.passport).toBe('[REDACTED]')
      expect(result.dob).toBe('[REDACTED]')
    })
  })

  describe('nested objects', () => {
    it('should redact sensitive fields in nested objects', () => {
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
          password: 'secret123',
        },
        profile: {
          bio: 'Developer',
          ssn: '123-45-6789',
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.user.name).toBe('John')
      expect(result.user.email).toBe('[REDACTED]')
      expect(result.user.password).toBe('[REDACTED]')
      expect(result.profile.bio).toBe('Developer')
      expect(result.profile.ssn).toBe('[REDACTED]')
    })

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'secret',
              data: 'safe',
            },
          },
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.level1.level2.level3.data).toBe('safe')
      expect(result.level1.level2.level3.password).toBe('[REDACTED]')
    })

    it('should prevent infinite recursion with max depth', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              tooDeep: 'value',
            },
          },
        },
      }

      const result = redactSensitiveData(data, 0, 2) as any

      // At max depth (2), it returns the object but doesn't recurse deeper
      expect(result.level1.level2.level3).toBe('[MAX_DEPTH_EXCEEDED]')
    })
  })

  describe('arrays', () => {
    it('should redact sensitive fields in array items', () => {
      const data = [
        { name: 'User 1', password: 'pass1' },
        { name: 'User 2', password: 'pass2' },
      ]

      const result = redactSensitiveData(data) as typeof data

      expect(result[0]!.name).toBe('User 1')
      expect(result[0]!.password).toBe('[REDACTED]')
      expect(result[1]!.name).toBe('User 2')
      expect(result[1]!.password).toBe('[REDACTED]')
    })

    it('should handle arrays within objects', () => {
      const data = {
        users: [
          { username: 'john', token: 'token1' },
          { username: 'jane', token: 'token2' },
        ],
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.users[0]!.username).toBe('john')
      expect(result.users[0]!.token).toBe('[REDACTED]')
      expect(result.users[1]!.username).toBe('jane')
      expect(result.users[1]!.token).toBe('[REDACTED]')
    })
  })

  describe('special object types', () => {
    it('should preserve Date objects', () => {
      const date = new Date('2024-01-01')
      const data = {
        createdAt: date,
        password: 'secret',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt.getTime()).toBe(date.getTime())
      expect(result.password).toBe('[REDACTED]')
    })
  })

  describe('before/after structure', () => {
    it('should redact sensitive fields in before/after structure', () => {
      const data = {
        before: {
          name: 'Old Name',
          email: 'old@example.com',
          password: 'oldpass',
        },
        after: {
          name: 'New Name',
          email: 'new@example.com',
          password: 'newpass',
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.before.name).toBe('Old Name')
      expect(result.before.email).toBe('[REDACTED]')
      expect(result.before.password).toBe('[REDACTED]')
      expect(result.after.name).toBe('New Name')
      expect(result.after.email).toBe('[REDACTED]')
      expect(result.after.password).toBe('[REDACTED]')
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = redactSensitiveData({})
      expect(result).toEqual({})
    })

    it('should handle empty arrays', () => {
      const result = redactSensitiveData([])
      expect(result).toEqual([])
    })

    it('should handle objects with null values', () => {
      const data = {
        name: 'John',
        password: null,
        token: undefined,
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John')
      expect(result.password).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
    })

    it('should skip dangerous prototype-polluting keys', () => {
      // Simulate an object that has been parsed from untrusted JSON and
      // contains keys that could mutate the prototype chain.
      const malicious = JSON.parse('{"__proto__": {"polluted": true}, "safe": "value"}')

      const result = redactSensitiveData(malicious) as Record<string, unknown>

      // The dangerous key must not appear in the result
      expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false)
      // Normal keys must still be preserved
      expect(result.safe).toBe('value')
      // The global Object prototype must NOT have been mutated
      expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined()
    })

    it('should skip constructor and prototype dangerous keys', () => {
      const malicious = JSON.parse(
        '{"constructor": {"polluted": true}, "prototype": {"polluted": true}, "safe": "value"}'
      )

      const result = redactSensitiveData(malicious) as Record<string, unknown>

      expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
      expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false)
      expect(result.safe).toBe('value')
    })
  })
})
