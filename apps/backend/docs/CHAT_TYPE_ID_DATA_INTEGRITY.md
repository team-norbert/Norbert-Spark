# Chat Type ID Data Integrity Documentation

## Overview

This document addresses data integrity concerns regarding the `chatTypeId` field in the `chats` table, specifically regarding the INNER JOIN operation in `getChatsByUserId`.

## Database Constraints

### 1. Foreign Key Constraint

**Location**: `apps/backend/src/infrastructure/database/schema.ts:693-695`

```typescript
chatTypeId: uuid('chat_type_id')
  .notNull()
  .references(() => chatTypes.id, { onDelete: 'restrict' })
```

**Guarantees**:

- Every `chatTypeId` in the `chats` table MUST reference a valid `id` in the `chat_types` table
- The database will reject any INSERT or UPDATE that violates this constraint
- `onDelete: 'restrict'` prevents deletion of a chat type while chats reference it
- No orphaned chats with invalid `chatTypeId` values can exist

### 2. NOT NULL Constraint

**Location**: Line 694 in `apps/backend/src/infrastructure/database/schema.ts` (same field definition as constraint #1)

```typescript
chatTypeId: uuid('chat_type_id')
  .notNull() // ← This constraint (line 694 in schema.ts)
  .references(() => chatTypes.id, { onDelete: 'restrict' })
```

**Guarantees**:

- The `chatTypeId` field cannot be NULL
- Every chat MUST have a valid chat type
- The INNER JOIN in `getChatsByUserId` will never exclude chats due to NULL values

### 3. Database Index

**Location**: `apps/backend/src/infrastructure/database/schema.ts:705`

```typescript
chatTypeIdIdx: index('chats_chat_type_id_idx').on(table.chatTypeId)
```

**Guarantees**:

- Efficient lookups when joining `chats` with `chat_types`
- Optimized query performance for the INNER JOIN operation
- Fast filtering by `chatTypeId`

### 4. Primary Key on chat_types.id

**Location**: `apps/backend/src/infrastructure/database/schema.ts:649`

```typescript
id: uuid('id')
  .primaryKey()
  .default(sql`uuidv7()`)
```

**Guarantees**:

- Automatic index on `chat_types.id` (primary keys are always indexed)
- Unique constraint ensures no duplicate chat type IDs
- Efficient join performance from the chat_types side

## INNER JOIN Safety

### Why INNER JOIN is Safe

The `getChatsByUserId` method in `apps/backend/src/adapters/secondary/repositories/ai.repository.ts` uses an INNER JOIN:

```typescript
const result = await db
  .select({
    id: chats.id,
    chatTypeId: chats.chatTypeId,
    seoFriendlyId: chatTypes.seoFriendlyId,
  })
  .from(chats)
  .innerJoin(chatTypes, eq(chats.chatTypeId, chatTypes.id))
  .where(eq(chats.userId, userId))
  .orderBy(desc(chats.updatedAt))
```

**This INNER JOIN is safe because**:

1. **No NULL values**: The NOT NULL constraint ensures `chatTypeId` is always populated
2. **No invalid references**: The foreign key constraint ensures every `chatTypeId` points to a valid `chat_types.id`
3. **No orphaned chats**: The `onDelete: 'restrict'` prevents deletion of referenced chat types
4. **Performance optimized**: Both sides of the join have indexes

### Scenarios That Cannot Occur

❌ **Chat with NULL chatTypeId**

- Prevented by NOT NULL constraint
- Database will reject INSERT/UPDATE attempts

❌ **Chat with invalid chatTypeId**

- Prevented by foreign key constraint
- Database will reject INSERT/UPDATE attempts

❌ **Orphaned chat (chatTypeId points to deleted chat_type)**

- Prevented by `onDelete: 'restrict'`
- Database will reject DELETE attempts on chat_types

❌ **Chat not appearing in results due to join failure**

- Cannot occur due to referential integrity guarantees

## Migration Plan for Existing Data

### Current State

As documented in `CHAT_TYPE_ID_IMPLEMENTATION_PLAN.md` (line 252):

> "Any existing chats in the database will have `NULL` or the placeholder `chatTypeId`. A migration script may be needed to backfill these with the correct `chatTypeId`."

### Migration Strategy

If migrating from a system where `chatTypeId` was nullable or unconstrained:

1. **Before applying schema changes**:

   ```sql
   -- Identify chats with NULL or invalid chatTypeId
   SELECT id, user_id, chat_type_id
   FROM chats
   WHERE chat_type_id IS NULL
      OR chat_type_id NOT IN (SELECT id FROM chat_types);
   ```

2. **Backfill strategy**:
   - Option A: Assign a default chat type to orphaned chats
   - Option B: Delete orphaned chats (with user notification)
   - Option C: Create placeholder chat types for invalid references

3. **Apply constraints in order**:

   ```sql
   -- Step 0: Ensure a default chat type exists
   INSERT INTO chat_types (id, name, seo_friendly_id, seo_friendly_base64_id, description)
   VALUES (
     gen_random_uuid(),
     'General Assistant',
     'general-assistant',
     encode(gen_random_bytes(16), 'base64'),
     'General purpose AI assistant'
   )
   ON CONFLICT (name) DO NOTHING;  -- Skip if already exists

   -- Step 1: Backfill NULL values with default chat type
   -- Verify this affects at least 0 rows before proceeding
   WITH default_type AS (
     SELECT id FROM chat_types WHERE name = 'General Assistant' LIMIT 1
   )
   UPDATE chats
   SET chat_type_id = (SELECT id FROM default_type)
   WHERE chat_type_id IS NULL;

   -- Step 1b: Verify no NULL values remain
   SELECT COUNT(*) FROM chats WHERE chat_type_id IS NULL;
   -- Should return 0, otherwise investigate before adding NOT NULL constraint

   -- Step 2: Add NOT NULL constraint
   ALTER TABLE chats ALTER COLUMN chat_type_id SET NOT NULL;

   -- Step 3: Add foreign key constraint
   ALTER TABLE chats ADD CONSTRAINT chats_chat_type_id_fkey
   FOREIGN KEY (chat_type_id) REFERENCES chat_types(id) ON DELETE RESTRICT;

   -- Step 4: Add index
   CREATE INDEX chats_chat_type_id_idx ON chats(chat_type_id);
   ```

### Current Schema Status

✅ The schema in `apps/backend/src/infrastructure/database/schema.ts` already includes all necessary constraints:

- NOT NULL constraint on `chatTypeId`
- Foreign key constraint with `onDelete: 'restrict'`
- Database index on `chatTypeId`

**If deploying to a fresh database**: Drizzle will create the table with all constraints in place, preventing any data integrity issues.

**If migrating an existing database**: Follow the migration strategy above before applying the schema changes.

## Verification Queries

### Check for constraint existence:

```sql
-- Verify foreign key constraint
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'chats'
  AND kcu.column_name = 'chat_type_id';

-- Verify NOT NULL constraint
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'chats'
  AND column_name = 'chat_type_id';

-- Verify index exists
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'chats'
  AND indexname = 'chats_chat_type_id_idx';
```

### Check data integrity:

```sql
-- Should return 0 rows (no orphaned chats)
SELECT COUNT(*)
FROM chats
WHERE chat_type_id NOT IN (SELECT id FROM chat_types);

-- Should return 0 rows (no NULL values)
SELECT COUNT(*)
FROM chats
WHERE chat_type_id IS NULL;
```

## References

- Database schema: `apps/backend/src/infrastructure/database/schema.ts`
- Repository implementation: `apps/backend/src/adapters/secondary/repositories/ai.repository.ts`
- Implementation plan: `CHAT_TYPE_ID_IMPLEMENTATION_PLAN.md`
- PostgreSQL Foreign Key Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK
