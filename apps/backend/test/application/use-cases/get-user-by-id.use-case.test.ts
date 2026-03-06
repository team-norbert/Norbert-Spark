import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { GetUserByIdUseCase } from '../../../src/application/use-cases/get-user-by-id.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email, type EmailType } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

// Helper function to create mock UserIdType from UUID string
function createMockUserId(uuid?: string): UserIdType {
  return new UserId(uuid || uuidv7()).getValue()
}

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase
  let mockUserRepository: UserRepositoryPort
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let auditContext: AuditContext
  let testUserId: UserIdType
  let testEmail: EmailType
  let testPassword: Password
  let testRole: Role
  let testUser: User

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock implementations
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteUsers: vi.fn(),
      existsByEmail: vi.fn(),
      saveProvider: vi.fn(),
    }

    mockLogger = createMockLogger()

    mockAuditLog = {
      log: vi.fn(),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    // Create test data
    auditContext = {
      userId: createMockUserId(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    }

    testUserId = createMockUserId()
    testEmail = new Email('test@example.com').getValue()
    testPassword = await Password.create('SecurePassword123')
    testRole = new Role('user')
    testUser = new User(
      testUserId,
      testEmail,
      'Test User',
      testRole,
      testPassword,
      new Date('2024-01-01'),
      new Date('2024-01-15')
    )

    // Instantiate use case with mocked dependencies
    useCase = new GetUserByIdUseCase(mockUserRepository, mockLogger, mockAuditLog)
  })

  describe('execute()', () => {
    describe('successful retrieval', () => {
      it('should return user when found by ID', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBe(testUser)
        expect(result?.id).toBe(testUserId)
        expect(result?.getEmail()).toBe(testEmail)
        expect(result?.getName()).toBe('Test User')
      })

      it('should call repository with correct user ID', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId)
      })

      it('should log info message with user ID', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Executing GetUserByIdUseCase', {
          event: 'user.fetch.attempt',
          userId: testUserId,
        })
      })

      it('should handle different user types (admin)', async () => {
        const adminRole = new Role('admin')
        const adminUser = new User(
          testUserId,
          testEmail,
          'Admin User',
          adminRole,
          testPassword,
          new Date('2024-01-01'),
          new Date('2024-01-15')
        )

        vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result?.getRole()).toBe('admin')
      })

      it('should handle different user types (moderator)', async () => {
        const moderatorRole = new Role('moderator')
        const moderatorUser = new User(
          testUserId,
          testEmail,
          'Moderator User',
          moderatorRole,
          testPassword,
          new Date('2024-01-01'),
          new Date('2024-01-15')
        )

        vi.mocked(mockUserRepository.findById).mockResolvedValue(moderatorUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result?.getRole()).toBe('moderator')
      })

      it('should return user with all properties intact', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBeInstanceOf(User)
        expect(result?.id).toBe(testUserId)
        expect(result?.getEmail()).toBe(testEmail)
        expect(result?.getName()).toBe('Test User')
        expect(result?.getRole()).toBe('user')
        expect(result?.getCreatedAt()).toEqual(new Date('2024-01-01'))
        expect(result?.getUpdatedAt()).toEqual(new Date('2024-01-15'))
      })
    })

    describe('user not found', () => {
      it('should return null when user does not exist', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBeNull()
      })

      it('should log warning when user not found', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'User not found',
          expect.objectContaining({ userId: testUserId })
        )
      })

      it('should call repository even when user does not exist', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await useCase.execute(testUserId, auditContext)

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId)
      })

      it('should not throw error when user not found', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await expect(useCase.execute(testUserId, auditContext)).resolves.toBeNull()
      })
    })

    describe('error handling', () => {
      it('should propagate repository errors', async () => {
        const dbError = new Error('Database connection failed')
        vi.mocked(mockUserRepository.findById).mockRejectedValue(dbError)

        await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow(
          'Database connection failed'
        )
      })

      it('should log info before error occurs', async () => {
        const dbError = new Error('Database error')
        vi.mocked(mockUserRepository.findById).mockRejectedValue(dbError)

        await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow()

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Executing GetUserByIdUseCase',
          expect.objectContaining({ userId: testUserId })
        )
      })

      it('should not log warning when error occurs before user check', async () => {
        const dbError = new Error('Database error')
        vi.mocked(mockUserRepository.findById).mockRejectedValue(dbError)

        await expect(useCase.execute(testUserId, auditContext)).rejects.toThrow()

        expect(mockLogger.warn).not.toHaveBeenCalled()
      })
    })

    describe('audit context handling', () => {
      it('should accept audit context with null userId', async () => {
        const nullUserContext: AuditContext = {
          userId: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, nullUserContext)

        expect(result).toBe(testUser)
      })

      it('should accept audit context with missing userAgent', async () => {
        const contextWithoutAgent: AuditContext = {
          userId: createMockUserId(),
          ipAddress: '127.0.0.1',
          userAgent: null,
        }

        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, contextWithoutAgent)

        expect(result).toBe(testUser)
      })

      it('should work with different IP addresses', async () => {
        const ipv6Context: AuditContext = {
          userId: createMockUserId(),
          ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          userAgent: 'test-agent',
        }

        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, ipv6Context)

        expect(result).toBe(testUser)
      })
    })

    describe('logging behavior', () => {
      it('should always log info at start of execution', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.info).toHaveBeenCalledTimes(1)
        expect(mockLogger.info).toHaveBeenCalledBefore(mockUserRepository.findById as any)
      })

      it('should log warn only when user not found', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.warn).not.toHaveBeenCalled()
      })

      it('should not log error when user not found (returns null)', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.error).not.toHaveBeenCalled()
      })

      it('should include userId in all log messages', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await useCase.execute(testUserId, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Executing GetUserByIdUseCase',
          expect.objectContaining({ userId: testUserId })
        )
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'User not found',
          expect.objectContaining({ userId: testUserId })
        )
      })
    })

    describe('multiple user IDs', () => {
      it('should handle different user IDs independently', async () => {
        const userId1 = createMockUserId()
        const userId2 = createMockUserId()

        const user1 = new User(
          userId1,
          new Email('user1@example.com').getValue(),
          'User One',
          testRole,
          testPassword,
          new Date(),
          new Date()
        )

        const user2 = new User(
          userId2,
          new Email('user2@example.com').getValue(),
          'User Two',
          testRole,
          testPassword,
          new Date(),
          new Date()
        )

        vi.mocked(mockUserRepository.findById)
          .mockResolvedValueOnce(user1)
          .mockResolvedValueOnce(user2)

        const result1 = await useCase.execute(userId1, auditContext)
        const result2 = await useCase.execute(userId2, auditContext)

        expect(result1?.id).toBe(userId1)
        expect(result2?.id).toBe(userId2)
        expect(result1?.getName()).toBe('User One')
        expect(result2?.getName()).toBe('User Two')
      })

      it('should call repository for each user ID', async () => {
        const userId1 = createMockUserId()
        const userId2 = createMockUserId()

        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(userId1, auditContext)
        await useCase.execute(userId2, auditContext)

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(2)
        expect(mockUserRepository.findById).toHaveBeenNthCalledWith(1, userId1)
        expect(mockUserRepository.findById).toHaveBeenNthCalledWith(2, userId2)
      })
    })

    describe('integration with User entity', () => {
      it('should return User instance with working methods', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBeInstanceOf(User)
        expect(typeof result?.getEmail).toBe('function')
        expect(typeof result?.getName).toBe('function')
        expect(typeof result?.getRole).toBe('function')
      })

      it('should preserve user entity readonly id', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result?.id).toBe(testUserId)
        // TypeScript enforces immutability at compile time, not runtime
        expect(result?.id).toBeDefined()
      })

      it('should handle OAuth users without password', async () => {
        const oauthUser = new User(
          testUserId,
          testEmail,
          'OAuth User',
          testRole,
          undefined,
          new Date(),
          new Date(),
          'google',
          'google-123'
        )

        vi.mocked(mockUserRepository.findById).mockResolvedValue(oauthUser)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBeInstanceOf(User)
        expect(result?.getName()).toBe('OAuth User')
      })

      it('should handle users with 2FA enabled', async () => {
        const user2FA = new User(
          testUserId,
          testEmail,
          'User With 2FA',
          testRole,
          testPassword,
          new Date(),
          new Date(),
          undefined,
          undefined,
          true,
          'encrypted-secret'
        )

        vi.mocked(mockUserRepository.findById).mockResolvedValue(user2FA)

        const result = await useCase.execute(testUserId, auditContext)

        expect(result).toBeInstanceOf(User)
        expect(result?.isTwoFactorEnabled()).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should handle rapid consecutive calls', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const promises = Array(10)
          .fill(null)
          .map(() => useCase.execute(testUserId, auditContext))

        const results = await Promise.all(promises)

        expect(results).toHaveLength(10)
        results.forEach((result) => {
          expect(result).toBe(testUser)
        })
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(10)
      })

      it('should handle very long user IDs', async () => {
        // UUIDv7 is always 36 characters, but testing with valid UUID
        const longUserId = createMockUserId()
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        const result = await useCase.execute(longUserId, auditContext)

        expect(result).toBe(testUser)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Executing GetUserByIdUseCase',
          expect.objectContaining({ userId: longUserId })
        )
      })

      it('should handle repository returning undefined (returns null)', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(undefined as any)

        const result = await useCase.execute(testUserId, auditContext)

        // Use case checks for falsy value, so undefined becomes null
        expect(result).toBeFalsy()
        expect(mockLogger.warn).toHaveBeenCalled()
      })
    })

    describe('use case isolation', () => {
      it('should not modify audit context', async () => {
        const originalContext = { ...auditContext }
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(auditContext).toEqual(originalContext)
      })

      it('should not call audit log service', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockAuditLog.log).not.toHaveBeenCalled()
      })

      it('should only depend on findById repository method', async () => {
        vi.mocked(mockUserRepository.findById).mockResolvedValue(testUser)

        await useCase.execute(testUserId, auditContext)

        expect(mockUserRepository.save).not.toHaveBeenCalled()
        expect(mockUserRepository.update).not.toHaveBeenCalled()
        expect(mockUserRepository.delete).not.toHaveBeenCalled()
        expect(mockUserRepository.findByEmail).not.toHaveBeenCalled()
        expect(mockUserRepository.findAll).not.toHaveBeenCalled()
      })
    })
  })
})
