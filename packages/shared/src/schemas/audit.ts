import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, varchar, timestamp, jsonb, inet, index } from 'drizzle-orm/pg-core'

import { user } from './user.js'

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid('user_id').references(() => user.userId, {
      onDelete: 'set null',
    }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: text('entity_id'),
    action: varchar('action', { length: 50 }).notNull(),
    changes: jsonb('changes'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('audit_log_user_id_idx').on(table.userId),
    entityTypeEntityIdIdx: index('audit_log_entity_type_entity_id_idx').on(
      table.entityType,
      table.entityId
    ),
    createdAtIdx: index('audit_log_created_at_idx').on(sql`${table.createdAt} DESC`),
    actionIdx: index('audit_log_action_idx').on(table.action),
  })
)

export type DBAuditLogSelect = typeof auditLog.$inferSelect
