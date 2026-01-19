import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { type DBUser, type DBUserSelect, PublicUserSchema, user, UserSchema } from '../../src'

describe('User Schemas', () => {
  describe('UserSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'John Doe',
        createdAt: new Date(),
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should coerce string date to Date object', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z',
      }

      const result = UserSchema.safeParse(userData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should reject invalid email format', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
        name: 'John Doe',
        createdAt: new Date(),
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject missing id', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'John Doe',
        createdAt: new Date(),
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        createdAt: new Date(),
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: new Date(),
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should validate email with various formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
        'user123@test-domain.com',
      ]

      validEmails.forEach((email) => {
        const userData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email,
          name: 'John Doe',
          createdAt: new Date(),
        }

        const result = UserSchema.safeParse(userData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('PublicUserSchema', () => {
    it('should validate public user data with only allowed fields', () => {
      const publicUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
      }

      const result = PublicUserSchema.safeParse(publicUser)
      expect(result.success).toBe(true)
    })

    it('should not include createdAt field', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        createdAt: new Date(),
      }

      const result = PublicUserSchema.safeParse(userData)
      expect(result.success).toBe(true)
      if (result.success) {
        // @ts-expect-error - createdAt should not exist on PublicUserSchema
        expect(result.data.createdAt).toBeUndefined()
      }
    })

    it('should reject invalid email in public schema', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'not-an-email',
      }

      const result = PublicUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should require all three fields', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
      }

      const result = PublicUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('user table', () => {
    it('should export user table constant', () => {
      expect(user).toBeDefined()
      expect(typeof user).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(user)).toBe('users')
    })

    describe('columns', () => {
      it('should have userId column', () => {
        expect(user.userId).toBeDefined()
        expect(user.userId.name).toBe('user_id')
      })

      it('should have name column', () => {
        expect(user.name).toBeDefined()
        expect(user.name.name).toBe('name')
      })

      it('should have password column', () => {
        expect(user.password).toBeDefined()
        expect(user.password.name).toBe('password')
      })

      it('should have email column', () => {
        expect(user.email).toBeDefined()
        expect(user.email.name).toBe('email')
      })

      it('should have role column', () => {
        expect(user.role).toBeDefined()
        expect(user.role.name).toBe('role')
      })

      it('should have provider column', () => {
        expect(user.provider).toBeDefined()
        expect(user.provider.name).toBe('provider')
      })

      it('should have providerId column', () => {
        expect(user.providerId).toBeDefined()
        expect(user.providerId.name).toBe('provider_id')
      })

      it('should have createdAt column', () => {
        expect(user.createdAt).toBeDefined()
        expect(user.createdAt.name).toBe('created_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on userId', () => {
        expect(user.userId.primary).toBe(true)
      })

      it('should have not null constraint on name', () => {
        expect(user.name.notNull).toBe(true)
      })

      it('should have not null constraint on email', () => {
        expect(user.email.notNull).toBe(true)
      })

      it('should have not null constraint on role', () => {
        expect(user.role.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(user.createdAt.notNull).toBe(true)
      })

      it('should have nullable password', () => {
        expect(user.password.notNull).toBe(false)
      })

      it('should have nullable provider', () => {
        expect(user.provider.notNull).toBe(false)
      })

      it('should have nullable providerId', () => {
        expect(user.providerId.notNull).toBe(false)
      })

      it('should have default value for userId', () => {
        expect(user.userId.hasDefault).toBe(true)
      })

      it('should have default value for role', () => {
        expect(user.role.hasDefault).toBe(true)
      })

      it('should have default value for createdAt', () => {
        expect(user.createdAt.hasDefault).toBe(true)
      })
    })
  })

  describe('DBUser type', () => {
    it('should be a valid insert type', () => {
      const mockUser: DBUser = {
        name: 'John Doe',
        email: 'test@example.com',
      }

      expect(mockUser).toBeDefined()
      expect(mockUser.name).toBe('John Doe')
      expect(mockUser.email).toBe('test@example.com')
    })

    it('should allow optional userId for insert', () => {
      const mockUser: DBUser = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
      }

      expect(mockUser.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should allow optional password', () => {
      const mockUser: DBUser = {
        name: 'John Doe',
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
      }

      expect(mockUser.password).toBeDefined()
    })

    it('should allow optional role for insert', () => {
      const mockUser: DBUser = {
        name: 'John Doe',
        email: 'test@example.com',
        role: 'admin',
      }

      expect(mockUser.role).toBe('admin')
    })

    it('should allow optional provider fields', () => {
      const mockUser: DBUser = {
        name: 'John Doe',
        email: 'test@example.com',
        provider: 'google',
        providerId: 'google-123456',
      }

      expect(mockUser.provider).toBe('google')
      expect(mockUser.providerId).toBe('google-123456')
    })

    it('should allow optional createdAt for insert', () => {
      const mockUser: DBUser = {
        name: 'John Doe',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      }

      expect(mockUser.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('DBUserSelect type', () => {
    it('should be a valid select type', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
        role: 'user',
        provider: null,
        providerId: null,
        createdAt: new Date(),
      }

      expect(mockUser).toBeDefined()
      expect(mockUser.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockUser.name).toBe('John Doe')
      expect(mockUser.email).toBe('test@example.com')
    })

    it('should have all required fields', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
        role: 'user',
        provider: null,
        providerId: null,
        createdAt: new Date('2024-01-01'),
      }

      expect(mockUser.userId).toBeDefined()
      expect(mockUser.name).toBeDefined()
      expect(mockUser.email).toBeDefined()
      expect(mockUser.role).toBeDefined()
      expect(mockUser.createdAt).toBeDefined()
    })

    it('should allow null password', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
        role: 'user',
        provider: null,
        providerId: null,
        createdAt: new Date(),
      }

      expect(mockUser.password).toBeNull()
    })

    it('should allow hashed password', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
        role: 'user',
        provider: null,
        providerId: null,
        createdAt: new Date(),
      }

      expect(mockUser.password).toMatch(/^\$2b\$/)
    })

    it('should support different roles', () => {
      const roles = ['user', 'admin', 'moderator']

      roles.forEach((role) => {
        const mockUser: DBUserSelect = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'test@example.com',
          password: null,
          role,
          provider: null,
          providerId: null,
          createdAt: new Date(),
        }

        expect(mockUser.role).toBe(role)
      })
    })

    it('should allow null provider fields', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
        role: 'user',
        provider: null,
        providerId: null,
        createdAt: new Date(),
      }

      expect(mockUser.provider).toBeNull()
      expect(mockUser.providerId).toBeNull()
    })

    it('should allow google provider', () => {
      const mockUser: DBUserSelect = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
        role: 'user',
        provider: 'google',
        providerId: 'google-123456',
        createdAt: new Date(),
      }

      expect(mockUser.provider).toBe('google')
      expect(mockUser.providerId).toBe('google-123456')
    })
  })

  describe('table structure validation', () => {
    it('should have consistent primary key naming', () => {
      expect(user.userId.name).toBe('user_id')
      expect(user.userId.primary).toBe(true)
    })

    it('should have consistent timestamp column naming', () => {
      expect(user.createdAt.name).toBe('created_at')
    })

    it('should have consistent foreign key naming pattern for provider', () => {
      expect(user.providerId.name).toBe('provider_id')
    })

    it('should have email as unique field', () => {
      expect(user.email.isUnique).toBe(true)
    })
  })
})
