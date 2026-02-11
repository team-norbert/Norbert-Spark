import { beforeEach, describe, expect, it } from 'vitest'

import { User } from '../../../src/domain/entities/user.js'
import type { EmailType } from '../../../src/domain/value-objects/email.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('User Entity - Two-Factor Authentication', () => {
  let email: EmailType
  let role: Role
  let password: Password

  beforeEach(async () => {
    email = new Email('test@example.com').getValue()
    role = new Role('user')
    password = await Password.create('TestPassword123')
  })

  describe('Two-Factor Authentication Status', () => {
    it('should have 2FA disabled by default', () => {
      const user = new User(undefined, email, 'Test User', role, password)

      expect(user.isTwoFactorEnabled()).toBe(false)
      expect(user.getTwoFactorSecret()).toBeUndefined()
    })

    it('should allow creating user with 2FA enabled', () => {
      const encryptedSecret = 'encrypted:secret:data:here'
      const user = new User(
        undefined,
        email,
        'Test User',
        role,
        password,
        new Date(),
        undefined,
        undefined,
        true,
        encryptedSecret
      )

      expect(user.isTwoFactorEnabled()).toBe(true)
      expect(user.getTwoFactorSecret()).toBe(encryptedSecret)
    })
  })

  describe('enableTwoFactor', () => {
    it('should enable 2FA with a valid encrypted secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)
      const encryptedSecret = 'encrypted:secret:data:here'

      user.enableTwoFactor(encryptedSecret)

      expect(user.isTwoFactorEnabled()).toBe(true)
      expect(user.getTwoFactorSecret()).toBe(encryptedSecret)
    })

    it('should throw error when enabling 2FA with empty secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)

      expect(() => user.enableTwoFactor('')).toThrow(ValidationException)
      expect(() => user.enableTwoFactor('')).toThrow(
        'Encrypted 2FA secret is required to enable two-factor authentication'
      )
    })

    it('should throw error when enabling 2FA with whitespace-only secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)

      expect(() => user.enableTwoFactor('   ')).toThrow(ValidationException)
    })
  })

  describe('disableTwoFactor', () => {
    it('should disable 2FA and remove the secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)
      const encryptedSecret = 'encrypted:secret:data:here'

      user.enableTwoFactor(encryptedSecret)
      expect(user.isTwoFactorEnabled()).toBe(true)
      expect(user.getTwoFactorSecret()).toBe(encryptedSecret)

      user.disableTwoFactor()
      expect(user.isTwoFactorEnabled()).toBe(false)
      expect(user.getTwoFactorSecret()).toBeUndefined()
    })

    it('should work even if 2FA was never enabled', () => {
      const user = new User(undefined, email, 'Test User', role, password)

      expect(() => user.disableTwoFactor()).not.toThrow()
      expect(user.isTwoFactorEnabled()).toBe(false)
      expect(user.getTwoFactorSecret()).toBeUndefined()
    })
  })

  describe('updateTwoFactorSecret', () => {
    it('should update the 2FA secret when 2FA is enabled', () => {
      const user = new User(undefined, email, 'Test User', role, password)
      const oldSecret = 'encrypted:old:secret:here'
      const newSecret = 'encrypted:new:secret:here'

      user.enableTwoFactor(oldSecret)
      expect(user.getTwoFactorSecret()).toBe(oldSecret)

      user.updateTwoFactorSecret(newSecret)
      expect(user.getTwoFactorSecret()).toBe(newSecret)
      expect(user.isTwoFactorEnabled()).toBe(true)
    })

    it('should throw error when updating secret with 2FA disabled', () => {
      const user = new User(undefined, email, 'Test User', role, password)

      expect(() => user.updateTwoFactorSecret('new:secret')).toThrow(ValidationException)
      expect(() => user.updateTwoFactorSecret('new:secret')).toThrow(
        'Cannot update 2FA secret when two-factor authentication is not enabled'
      )
    })

    it('should throw error when updating with empty secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)
      user.enableTwoFactor('encrypted:secret:data:here')

      expect(() => user.updateTwoFactorSecret('')).toThrow(ValidationException)
      expect(() => user.updateTwoFactorSecret('')).toThrow('Encrypted 2FA secret cannot be empty')
    })

    it('should throw error when updating with whitespace-only secret', () => {
      const user = new User(undefined, email, 'Test User', role, password)
      user.enableTwoFactor('encrypted:secret:data:here')

      expect(() => user.updateTwoFactorSecret('   ')).toThrow(ValidationException)
    })
  })
})
