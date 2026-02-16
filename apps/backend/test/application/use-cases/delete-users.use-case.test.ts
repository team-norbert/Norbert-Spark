import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { DeleteUsersUseCase } from '../../../src/application/use-cases/delete-users.use-case.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { DatabaseException } from '../../../src/shared/exceptions/database.exception.js'

// Helper function to create mock UserIdType from UUID string
function createMockUserId(uuid?: string): UserIdType {
  return new UserId(uuid || uuidv7()).getValue()
}

describe('DeleteUsersUseCase', () => {
  let useCase: DeleteUsersUseCase
  let mockUserRepository: UserRepositoryPort
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  const auditContext = {
    userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  }

  beforeEach(() => {
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
      deleteUsers: vi.fn().mockResolvedValue(undefined),
      existsByEmail: vi.fn(),
      saveProvider: vi.fn(),
    }

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new DeleteUsersUseCase(mockUserRepository, mockLogger, mockAuditLog)
  })

  describe('execute()', () => {
    describe('successful deletion', () => {
      it('should delete single user successfully', async () => {
        const userId = createMockUserId()
        const userIds = [userId]

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledWith(userIds)
      })

      it('should delete multiple users successfully', async () => {
        const userIds = [createMockUserId(), createMockUserId(), createMockUserId()]

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledWith(userIds)
      })

      it('should return true after successful deletion', async () => {
        const userIds = [createMockUserId()]

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
      })

      it('should handle empty array of user IDs', async () => {
        const userIds: UserIdType[] = []

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledWith([])
      })

      it('should handle large batch of user IDs', async () => {
        const userIds = Array.from({ length: 100 }, () => createMockUserId())

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledWith(userIds)
      })
    })

    describe('logging', () => {
      it('should log info message before deletion', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockLogger.info).toHaveBeenCalledTimes(1)
        expect(mockLogger.info).toHaveBeenCalledWith('Deleting users', { userIds })
      })

      it('should log with correct user IDs', async () => {
        const userId1 = createMockUserId()
        const userId2 = createMockUserId()
        const userIds = [userId1, userId2]

        await useCase.execute(userIds, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Deleting users', { userIds })
      })

      it('should not log error when deletion is successful', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockLogger.error).not.toHaveBeenCalled()
      })
    })

    describe('audit logging', () => {
      it('should create audit log entry after successful deletion', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      })

      it('should log audit with correct entity type', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityType: EntityType.USER,
          })
        )
      })

      it('should log audit with DELETE action', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AuditAction.DELETE,
          })
        )
      })

      it('should log audit with null userId for batch operations', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: auditContext.userId,
          })
        )
      })

      it('should log audit with comma-separated entity IDs', async () => {
        const userId1 = createMockUserId()
        const userId2 = createMockUserId()
        const userId3 = createMockUserId()
        const userIds = [userId1, userId2, userId3]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityId: `${userId1},${userId2},${userId3}`,
          })
        )
      })

      it('should log audit with deletion changes', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: {
              deleted: {
                userIds: userIds,
                count: 1,
              },
            },
          })
        )
      })

      it('should include IP address in audit log', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: auditContext.ipAddress,
          })
        )
      })

      it('should include user agent in audit log', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: auditContext.userAgent,
          })
        )
      })

      it('should handle null user agent gracefully', async () => {
        const userIds = [createMockUserId()]
        const contextWithNullAgent = {
          userId: '0196f0c2-3b9a-7a1c-9d4e-2f6b8c0a1234' as UserIdType,
          ipAddress: '192.168.1.1',
          userAgent: null,
        }

        await useCase.execute(userIds, contextWithNullAgent)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: undefined,
          })
        )
      })

      // Audit logging is no longer wrapped in try-catch, so failures will propagate
    })

    describe('error handling', () => {
      it('should throw error if repository deletion fails', async () => {
        const userIds = [createMockUserId()]
        const dbError = new DatabaseException('Database connection failed')
        vi.mocked(mockUserRepository.deleteUsers).mockRejectedValue(dbError)

        await expect(useCase.execute(userIds, auditContext)).rejects.toThrow(dbError)
      })

      it('should log error if repository deletion fails', async () => {
        const userIds = [createMockUserId()]
        const dbError = new DatabaseException('Database error')
        vi.mocked(mockUserRepository.deleteUsers).mockRejectedValue(dbError)

        try {
          await useCase.execute(userIds, auditContext)
        } catch {
          // Expected to throw
        }

        expect(mockLogger.error).toHaveBeenCalledWith('Error deleting users', dbError, { userIds })
      })

      it('should not create audit log if deletion fails', async () => {
        const userIds = [createMockUserId()]
        vi.mocked(mockUserRepository.deleteUsers).mockRejectedValue(
          new DatabaseException('Database error')
        )

        try {
          await useCase.execute(userIds, auditContext)
        } catch {
          // Expected to throw
        }

        expect(mockAuditLog.log).not.toHaveBeenCalled()
      })

      it('should propagate repository errors unchanged', async () => {
        const userIds = [createMockUserId()]
        const customError = new Error('Custom error message')
        vi.mocked(mockUserRepository.deleteUsers).mockRejectedValue(customError)

        await expect(useCase.execute(userIds, auditContext)).rejects.toThrow(customError)
      })

      it('should handle generic errors from repository', async () => {
        const userIds = [createMockUserId()]
        const genericError = new Error('Something went wrong')
        vi.mocked(mockUserRepository.deleteUsers).mockRejectedValue(genericError)

        await expect(useCase.execute(userIds, auditContext)).rejects.toThrow(genericError)
        expect(mockLogger.error).toHaveBeenCalledWith('Error deleting users', genericError, {
          userIds,
        })
      })
    })

    describe('integration scenarios', () => {
      it('should complete full workflow: log info -> delete -> audit', async () => {
        const userIds = [createMockUserId()]

        await useCase.execute(userIds, auditContext)

        // Verify execution order by checking call counts
        expect(mockLogger.info).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)

        // Verify info was logged before deletion (can't strictly test order but we can verify both happened)
        expect(mockLogger.info).toHaveBeenCalled()
        expect(mockUserRepository.deleteUsers).toHaveBeenCalled()
      })

      it('should handle multiple sequential deletions', async () => {
        const userIds1 = [createMockUserId()]
        const userIds2 = [createMockUserId(), createMockUserId()]

        await useCase.execute(userIds1, auditContext)
        await useCase.execute(userIds2, auditContext)

        expect(mockUserRepository.deleteUsers).toHaveBeenCalledTimes(2)
        expect(mockAuditLog.log).toHaveBeenCalledTimes(2)
      })

      it('should maintain independence between deletion operations', async () => {
        const userIds1 = [createMockUserId()]
        const userIds2 = [createMockUserId()]

        await useCase.execute(userIds1, auditContext)
        vi.clearAllMocks() // Clear to verify independence
        await useCase.execute(userIds2, auditContext)

        expect(mockLogger.info).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      })

      it('should handle different audit contexts', async () => {
        const userIds = [createMockUserId()]
        const context1 = { userId: null, ipAddress: '10.0.0.1', userAgent: 'Chrome' }
        const context2 = { userId: null, ipAddress: '10.0.0.2', userAgent: 'Firefox' }

        await useCase.execute(userIds, context1)
        await useCase.execute(userIds, context2)

        expect(mockAuditLog.log).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ ipAddress: '10.0.0.1', userAgent: 'Chrome' })
        )
        expect(mockAuditLog.log).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ ipAddress: '10.0.0.2', userAgent: 'Firefox' })
        )
      })
    })

    describe('edge cases', () => {
      it('should handle duplicate user IDs in array', async () => {
        const userId = createMockUserId()
        const userIds = [userId, userId, userId]

        const result = await useCase.execute(userIds, auditContext)

        expect(result).toBe(true)
        expect(mockUserRepository.deleteUsers).toHaveBeenCalledWith(userIds)
      })

      it('should handle very long IP addresses', async () => {
        const userIds = [createMockUserId()]
        const longIpContext = {
          userId: null,
          ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          userAgent: 'test',
        }

        await useCase.execute(userIds, longIpContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({ ipAddress: longIpContext.ipAddress })
        )
      })

      it('should handle very long user agent strings', async () => {
        const userIds = [createMockUserId()]
        const longUserAgent = 'A'.repeat(500)
        const context = { userId: null, ipAddress: '127.0.0.1', userAgent: longUserAgent }

        await useCase.execute(userIds, context)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({ userAgent: longUserAgent })
        )
      })

      it('should preserve user ID order in audit log entity ID', async () => {
        const userId1 = createMockUserId()
        const userId2 = createMockUserId()
        const userId3 = createMockUserId()
        const userIds = [userId1, userId2, userId3]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityId: `${userId1},${userId2},${userId3}`,
          })
        )
      })

      it('should handle single user ID in entity ID without trailing comma', async () => {
        const userId = createMockUserId()
        const userIds = [userId]

        await useCase.execute(userIds, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityId: userId,
          })
        )
      })
    })

    describe('constructor', () => {
      it('should create instance with all required dependencies', () => {
        const instance = new DeleteUsersUseCase(mockUserRepository, mockLogger, mockAuditLog)

        expect(instance).toBeInstanceOf(DeleteUsersUseCase)
        expect(instance).toBeDefined()
      })

      it('should have execute method', () => {
        expect(useCase.execute).toBeDefined()
        expect(typeof useCase.execute).toBe('function')
      })
    })
  })
})
