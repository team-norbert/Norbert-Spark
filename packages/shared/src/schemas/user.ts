import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, check, customType } from 'drizzle-orm/pg-core'
import { z } from 'zod'
// Define CITEXT custom type for case-insensitive text
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  createdAt: z.coerce.date(),
})

export const PublicUserSchema = UserSchema.pick({ id: true, name: true, email: true })

export const user = pgTable(
  'users',
  {
    userId: uuid('user_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text('name').notNull(),
    password: text('password'),
    email: citext('email').notNull().unique(),
    role: text('role').notNull().default('user'),
    provider: text('provider'),
    providerId: text('provider_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    providerCheck: check('provider_check', sql`${table.provider} IN ('google')`),
    passwordLengthCheck: check(
      'password_length_check',
      sql`${table.password} IS NULL OR length(${table.password}) = 60`
    ),
    roleCheck: check('role_check', sql`${table.role} IN ('user', 'admin', 'moderator')`),
    nameLengthCheck: check(
      'name_length_check',
      sql`length(${table.name}) >= 2 AND length(${table.name}) <= 100`
    ),
  })
)

/**
 * The DBUser type uses $inferInsert which is meant for insert operations.
 * Since this repository also performs read operations (findById, findByEmail),
 * you should also export a type for select operations using $inferSelect.
 * This would be: export type DBUserSelect = typeof user.$inferSelect
 *
 * The select type will include generated/default fields with their proper types,
 * while the insert type represents the input shape for inserts.
 */
export type DBUser = typeof user.$inferInsert
export type DBUserSelect = typeof user.$inferSelect
