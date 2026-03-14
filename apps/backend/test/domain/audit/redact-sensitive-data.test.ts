import { describe, expect, it } from 'vitest'

import type { CreateAuditLogDTO } from '../../../src/application/ports/audit-log.port.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import {
  redactAuditLogEntry,
  redactCreateAuditLogDTO,
} from '../../../src/domain/audit/redact-sensitive-data.js'

describe('redactAuditLogEntry', () => {
  it('should redact changes field in audit log entry', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'update',
      changes: {
        before: { email: 'old@example.com', password: 'oldpass' },
        after: { email: 'new@example.com', password: 'newpass' },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    const result = redactAuditLogEntry(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe('user')
    expect(result.action).toBe('update')
    expect(result.ipAddress).toBe('192.168.1.1')

    const changes = result.changes as any
    expect(changes.before.email).toBe('[REDACTED]')
    expect(changes.before.password).toBe('[REDACTED]')
    expect(changes.after.email).toBe('[REDACTED]')
    expect(changes.after.password).toBe('[REDACTED]')
  })

  it('should handle entry without changes field', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'delete',
    }

    const result = redactAuditLogEntry(entry)

    expect(result).toEqual(entry)
  })

  it('should handle entry with null changes', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'delete',
      changes: null,
    }

    const result = redactAuditLogEntry(entry)

    expect(result.changes).toBe(null)
  })

  it('should preserve all non-changes fields', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'login',
      changes: { success: true, password: 'secret' },
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome',
      customField: 'preserved',
    }

    const result = redactAuditLogEntry(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe('user')
    expect(result.entityId).toBe('user-456')
    expect(result.action).toBe('login')
    expect(result.ipAddress).toBe('10.0.0.1')
    expect(result.userAgent).toBe('Chrome')
    expect(result.customField).toBe('preserved')

    const changes = result.changes as any
    expect(changes.success).toBe(true)
    expect(changes.password).toBe('[REDACTED]')
  })

  it('should handle login failure with email in changes', () => {
    const entry = {
      userId: null,
      entityType: 'user',
      entityId: 'unknown',
      action: 'login_failed',
      changes: {
        email: 'user@example.com',
        password: 'wrongpass',
        reason: 'invalid_password',
      },
    }

    const result = redactAuditLogEntry(entry)

    const changes = result.changes as any
    expect(changes.email).toBe('[REDACTED]')
    expect(changes.password).toBe('[REDACTED]')
    expect(changes.reason).toBe('invalid_password')
  })

  it('should redact tokens in changes', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'token_refresh',
      changes: {
        oldToken: 'eyJhbGciOi...',
        newToken: 'eyJhbGciOj...',
        expiresIn: 3600,
      },
    }

    const result = redactAuditLogEntry(entry)

    const changes = result.changes as any
    expect(changes.oldToken).toBe('[REDACTED]')
    expect(changes.newToken).toBe('[REDACTED]')
    expect(changes.expiresIn).toBe(3600)
  })
})

describe('redactCreateAuditLogDTO', () => {
  it('should redact changes field in CreateAuditLogDTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.UPDATE,
      changes: {
        before: { email: 'old@example.com', password: 'oldpass' },
        after: { email: 'new@example.com', password: 'newpass' },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
    expect(result.action).toBe(AuditAction.UPDATE)
    expect(result.ipAddress).toBe('192.168.1.1')

    const changes = result.changes as Record<string, unknown>
    const before = changes.before as Record<string, unknown>
    const after = changes.after as Record<string, unknown>
    expect(before.email).toBe('[REDACTED]')
    expect(before.password).toBe('[REDACTED]')
    expect(after.email).toBe('[REDACTED]')
    expect(after.password).toBe('[REDACTED]')
  })

  it('should handle DTO without changes field', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.DELETE,
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result).toEqual(entry)
  })

  it('should handle DTO with undefined changes', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.DELETE,
      changes: undefined,
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.changes).toBe(undefined)
  })

  it('should preserve all non-changes fields in DTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.LOGIN,
      changes: { success: true, password: 'secret' },
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome',
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
    expect(result.entityId).toBe('user-456')
    expect(result.action).toBe(AuditAction.LOGIN)
    expect(result.ipAddress).toBe('10.0.0.1')
    expect(result.userAgent).toBe('Chrome')

    const changes = result.changes as Record<string, unknown>
    expect(changes.success).toBe(true)
    expect(changes.password).toBe('[REDACTED]')
  })

  it('should handle login failure with sensitive data in changes', () => {
    const entry: CreateAuditLogDTO = {
      userId: null,
      entityType: EntityType.USER,
      entityId: 'unknown',
      action: AuditAction.LOGIN_FAILED,
      changes: {
        reason: 'invalid_password',
        token: 'secret-token',
        apiKey: 'secret-key',
      },
    }

    const result = redactCreateAuditLogDTO(entry)

    const changes = result.changes as Record<string, unknown>
    expect(changes.reason).toBe('invalid_password')
    expect(changes.token).toBe('[REDACTED]')
    expect(changes.apiKey).toBe('[REDACTED]')
  })

  it('should maintain type safety with CreateAuditLogDTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.UPDATE,
      changes: {
        before: { name: 'Old', password: 'old' },
        after: { name: 'New', password: 'new' },
      },
    }

    // This should compile without type errors
    const result: CreateAuditLogDTO = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
  })
})
