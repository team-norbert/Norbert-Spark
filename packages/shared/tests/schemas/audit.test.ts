import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { auditLog, type DBAuditLogSelect } from '../../src/schemas/audit.js'

describe('Audit Schemas', () => {
  describe('auditLog table', () => {
    it('should export auditLog table constant', () => {
      expect(auditLog).toBeDefined()
      expect(typeof auditLog).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(auditLog)).toBe('audit_log')
    })

    describe('columns', () => {
      it('should have id column', () => {
        expect(auditLog.id).toBeDefined()
        expect(auditLog.id.name).toBe('id')
      })

      it('should have userId column', () => {
        expect(auditLog.userId).toBeDefined()
        expect(auditLog.userId.name).toBe('user_id')
      })

      it('should have entityType column', () => {
        expect(auditLog.entityType).toBeDefined()
        expect(auditLog.entityType.name).toBe('entity_type')
      })

      it('should have entityId column', () => {
        expect(auditLog.entityId).toBeDefined()
        expect(auditLog.entityId.name).toBe('entity_id')
      })

      it('should have action column', () => {
        expect(auditLog.action).toBeDefined()
        expect(auditLog.action.name).toBe('action')
      })

      it('should have changes column', () => {
        expect(auditLog.changes).toBeDefined()
        expect(auditLog.changes.name).toBe('changes')
      })

      it('should have ipAddress column', () => {
        expect(auditLog.ipAddress).toBeDefined()
        expect(auditLog.ipAddress.name).toBe('ip_address')
      })

      it('should have userAgent column', () => {
        expect(auditLog.userAgent).toBeDefined()
        expect(auditLog.userAgent.name).toBe('user_agent')
      })

      it('should have createdAt column', () => {
        expect(auditLog.createdAt).toBeDefined()
        expect(auditLog.createdAt.name).toBe('created_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(auditLog.id.primary).toBe(true)
      })

      it('should have not null constraint on entityType', () => {
        expect(auditLog.entityType.notNull).toBe(true)
      })

      it('should have not null constraint on action', () => {
        expect(auditLog.action.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(auditLog.createdAt.notNull).toBe(true)
      })

      it('should have nullable userId for system actions', () => {
        expect(auditLog.userId.notNull).toBe(false)
      })

      it('should have nullable entityId', () => {
        expect(auditLog.entityId.notNull).toBe(false)
      })

      it('should have nullable changes', () => {
        expect(auditLog.changes.notNull).toBe(false)
      })

      it('should have nullable ipAddress', () => {
        expect(auditLog.ipAddress.notNull).toBe(false)
      })

      it('should have nullable userAgent', () => {
        expect(auditLog.userAgent.notNull).toBe(false)
      })
    })
  })

  describe('DBAuditLogSelect type', () => {
    it('should be a valid type', () => {
      const mockAuditLog: DBAuditLogSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        entityType: 'user',
        entityId: 'entity-123',
        action: 'create',
        changes: { field: 'value' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      }

      expect(mockAuditLog).toBeDefined()
      expect(mockAuditLog.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockAuditLog.userId).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
      expect(mockAuditLog.entityType).toBe('user')
      expect(mockAuditLog.action).toBe('create')
    })

    it('should allow null userId for system actions', () => {
      const mockAuditLog: DBAuditLogSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        entityType: 'system',
        entityId: null,
        action: 'startup',
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      }

      expect(mockAuditLog.userId).toBeNull()
      expect(mockAuditLog.entityId).toBeNull()
    })

    it('should allow optional fields to be null', () => {
      const mockAuditLog: DBAuditLogSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        entityType: 'test',
        entityId: null,
        action: 'test_action',
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      }

      expect(mockAuditLog.changes).toBeNull()
      expect(mockAuditLog.ipAddress).toBeNull()
      expect(mockAuditLog.userAgent).toBeNull()
    })

    it('should support complex changes object', () => {
      const mockAuditLog: DBAuditLogSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        entityType: 'user',
        entityId: 'user-123',
        action: 'update',
        changes: {
          reason: 'user_updated',
          oldValue: { name: 'John' },
          newValue: { name: 'Jane' },
          metadata: { timestamp: '2024-01-01' },
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0.0.0',
        createdAt: new Date(),
      }

      expect(mockAuditLog.changes).toEqual({
        reason: 'user_updated',
        oldValue: { name: 'John' },
        newValue: { name: 'Jane' },
        metadata: { timestamp: '2024-01-01' },
      })
    })
  })

  describe('table structure validation', () => {
    it('should have all required columns defined', () => {
      const requiredColumns = [
        'id',
        'userId',
        'entityType',
        'entityId',
        'action',
        'changes',
        'ipAddress',
        'userAgent',
        'createdAt',
      ]

      requiredColumns.forEach((columnName) => {
        expect(auditLog[columnName as keyof typeof auditLog]).toBeDefined()
      })
    })

    it('should have proper column naming convention', () => {
      expect(auditLog.userId.name).toBe('user_id')
      expect(auditLog.entityType.name).toBe('entity_type')
      expect(auditLog.entityId.name).toBe('entity_id')
      expect(auditLog.ipAddress.name).toBe('ip_address')
      expect(auditLog.userAgent.name).toBe('user_agent')
      expect(auditLog.createdAt.name).toBe('created_at')
    })

    it('should have consistent naming for timestamp columns', () => {
      expect(auditLog.createdAt.name).toBe('created_at')
    })
  })
})
