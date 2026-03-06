import { uuidv7 } from 'uuidv7'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../src/application/ports/refresh-token.repository.port.js'
import { LogOutUseCase } from '../../../src/application/use-cases/log-out.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

describe('LogOutUseCase', () => {
  let useCase: LogOutUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockRefreshTokenRepo: RefreshTokenRepositoryPort

  // Standard audit context for tests
  const auditContext: AuditContext = {
    userId: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Test Browser)',
  }

  // Helper function to create a branded UserId
  const createUserId = (id?: string): UserIdType => {
    return new UserId(id || uuidv7()).getValue()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = createMockLogger()

    // Create mock audit log
    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
    }

    // Create mock refresh token repository
    mockRefreshTokenRepo = {
      create: vi.fn().mockResolvedValue(undefined),
      findByHash: vi.fn(),
      revokeByHash: vi.fn().mockResolvedValue(undefined),
      revokeFamily: vi.fn().mockResolvedValue(undefined),
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
      deleteExpiredBefore: vi.fn().mockResolvedValue(0),
    }

    // Create use case instance
    useCase = new LogOutUseCase(mockLogger, mockAuditLog, mockRefreshTokenRepo)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('execute', () => {
    describe('successful logout', () => {
      it('should revoke all refresh tokens for the user', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(userId)
        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledTimes(1)
      })

      it('should log info message when starting logout', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockLogger.info).toHaveBeenCalledWith('Executing LogOutUseCase', {
          event: 'user.logout.attempt',
          userId,
        })
      })

      it('should create audit log entry with correct action', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: userId,
            entityType: EntityType.USER,
            action: AuditAction.USER_LOGOUT,
            changes: {
              reason: 'refresh_token_revoke_successful',
            },
            ipAddress: contextWithUser.ipAddress,
            userAgent: contextWithUser.userAgent,
          })
        )
      })

      it('should include audit context IP address in audit log', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId, ipAddress: '10.0.0.1' }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '10.0.0.1',
          })
        )
      })

      it('should include audit context user agent in audit log', async () => {
        const userId = createUserId()
        const contextWithUser = {
          ...auditContext,
          userId,
          userAgent: 'Custom User Agent/1.0',
        }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: 'Custom User Agent/1.0',
          })
        )
      })

      it('should handle undefined user agent in audit context', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId, userAgent: null }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: undefined,
          })
        )
      })

      it('should use userId as entityId in audit log', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityId: userId,
          })
        )
      })

      it('should call audit log exactly once on success', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      })

      it('should complete successfully when all operations succeed', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await expect(useCase.execute(userId, contextWithUser)).resolves.toBeUndefined()
      })
    })

    describe('error handling', () => {
      it('should log error when revokeAllForUser fails', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }
        const error = new Error('Database connection failed')

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(error)

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          InternalErrorException
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to revoke all refresh tokens for user during logout',
          error,
          { event: 'user.logout.failed', targetUserId: userId, actorUserId: contextWithUser.userId }
        )
      })

      it('should still create audit log entry when revokeAllForUser fails', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(
          new Error('Database error')
        )

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow()

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)

        // Audit call on failure (catch): refresh_token_revoke_failed
        const catchAudit = vi.mocked(mockAuditLog.log).mock.calls[0][0]
        expect(catchAudit.userId).toBe(userId)
        expect(catchAudit.entityType).toBe(EntityType.USER)
        expect(catchAudit.action).toBe(AuditAction.USER_LOGOUT)
        expect(catchAudit.changes).toEqual({ reason: 'refresh_token_revoke_failed' })
      })

      it('should handle Error instance correctly', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }
        const error = new Error('Specific error message')

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(error)

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          InternalErrorException
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to revoke all refresh tokens for user during logout',
          error,
          { event: 'user.logout.failed', targetUserId: userId, actorUserId: contextWithUser.userId }
        )
      })

      it('should convert non-Error objects to Error instances', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue('string error')

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          InternalErrorException
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to revoke all refresh tokens for user during logout',
          expect.objectContaining({ message: 'string error' }),
          { event: 'user.logout.failed', targetUserId: userId, actorUserId: contextWithUser.userId }
        )
      })

      it('should handle null error values', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(null)

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          InternalErrorException
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to revoke all refresh tokens for user during logout',
          expect.objectContaining({ message: 'null' }),
          { event: 'user.logout.failed', targetUserId: userId, actorUserId: contextWithUser.userId }
        )
      })

      it('should handle undefined error values', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(undefined)

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          InternalErrorException
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to revoke all refresh tokens for user during logout',
          expect.objectContaining({ message: 'undefined' }),
          { event: 'user.logout.failed', targetUserId: userId, actorUserId: contextWithUser.userId }
        )
      })

      it('should call audit log even after error', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(new Error('Test error'))

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          'Failed to revoke refresh tokens for user during logout'
        )

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      })

      it('should re-throw error when revoke fails', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }
        const error = new Error('Revoke failed')

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockRejectedValue(error)

        await expect(useCase.execute(userId, contextWithUser)).rejects.toThrow(
          'Failed to revoke refresh tokens for user during logout'
        )
      })
    })

    describe('audit log contract', () => {
      it('should include all required audit fields', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        const auditCall = vi.mocked(mockAuditLog.log).mock.calls[0][0]
        expect(auditCall).toHaveProperty('userId')
        expect(auditCall).toHaveProperty('entityType')
        expect(auditCall).toHaveProperty('entityId')
        expect(auditCall).toHaveProperty('action')
        expect(auditCall).toHaveProperty('changes')
        expect(auditCall).toHaveProperty('ipAddress')
      })

      it('should use EntityType.USER for entity type', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityType: EntityType.USER,
          })
        )
      })

      it('should use AuditAction.USER_LOGOUT for action', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AuditAction.USER_LOGOUT,
          })
        )
      })
    })

    describe('edge cases', () => {
      it('should handle very long user IDs', async () => {
        const longUserId = createUserId()
        const contextWithUser = { ...auditContext, userId: longUserId }

        await expect(useCase.execute(longUserId, contextWithUser)).resolves.toBeUndefined()
        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(longUserId)
      })

      it('should handle missing IP address in audit context', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId, ipAddress: '' }

        await useCase.execute(userId, contextWithUser)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '',
          })
        )
      })

      it('should use userId parameter for revocation', async () => {
        const userIdParam = createUserId()
        const userIdInContext = createUserId()
        const contextWithUser = { ...auditContext, userId: userIdInContext }

        await useCase.execute(userIdParam, contextWithUser)

        // Should use the userId parameter for revocation
        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(userIdParam)
      })

      it('should handle rapid sequential logout calls', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await Promise.all([
          useCase.execute(userId, contextWithUser),
          useCase.execute(userId, contextWithUser),
          useCase.execute(userId, contextWithUser),
        ])

        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledTimes(3)
        expect(mockAuditLog.log).toHaveBeenCalledTimes(3)
      })
    })

    describe('integration with repository', () => {
      it('should pass exact userId to repository without modification', async () => {
        // Use a valid UUIDv7 format
        const validUuidV7 = '019cab34-994e-7685-850b-760295d5fad4'
        const userId = createUserId(validUuidV7)
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(userId)
      })

      it('should not call any other repository methods', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }

        await useCase.execute(userId, contextWithUser)

        expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.findByHash).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.revokeFamily).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.deleteExpiredBefore).not.toHaveBeenCalled()
      })

      it('should wait for repository operation to complete before audit log', async () => {
        const userId = createUserId()
        const contextWithUser = { ...auditContext, userId }
        const operationOrder: string[] = []

        vi.mocked(mockRefreshTokenRepo.revokeAllForUser).mockImplementation(async () => {
          operationOrder.push('revoke')
        })

        vi.mocked(mockAuditLog.log).mockImplementation(async () => {
          operationOrder.push('audit')
        })

        await useCase.execute(userId, contextWithUser)

        expect(operationOrder).toEqual(['revoke', 'audit'])
      })
    })
  })
})
