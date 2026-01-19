import { customType } from 'drizzle-orm/pg-core'

/**
 * CITEXT custom type for case-insensitive text in PostgreSQL
 * This type can be imported and reused across all schema files
 */
export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})
