# Database Migration: From Drizzle-Kit to SQL Schema

## Changes Made

### 1. Updated Schema File

- **File**: `apps/backend/sql/norberts_schema.sql`
- **Action**: Merged AI chat system tables with CRM tables into a single comprehensive schema
- **Tables included**:
  - **User Management**: `users`
  - **CRM**: `customers`, `people`, `customer_people`
  - **AI Chat**: `chats`, `messages`, `ai_options`, `parts`
  - **Audit**: `audit_log`

### 2. Updated Drop Script

- **File**: `apps/backend/drizzle/drop_all_tables.sql`
- **Action**: Added CRM tables, ENUM types, and functions to the drop script
- **Drops**: All tables, indexes, ENUM types, and functions for complete cleanup

### 3. Updated Package.json Scripts

- **File**: `apps/backend/package.json`
- **Changes**:
  - ✅ **New**: `db:create` - Creates database from SQL schema file
  - ❌ **Removed**: `db:generate` - No longer uses drizzle-kit generate
  - ❌ **Removed**: `db:migrate` - No longer uses drizzle-kit migrate
  - ❌ **Removed**: `db:push` - No longer uses drizzle-kit push
  - ✅ **Updated**: `db:reset` - Now runs `db:drop` then `db:create` (SQL-based)

## New Workflow

### Database Reset (Development)

```bash
cd apps/backend
pnpm db:reset
```

This will:

1. Drop all tables, indexes, ENUM types, and functions
2. Create fresh database structure from `sql/norberts_schema.sql`

### Individual Commands

**Drop all tables:**

```bash
pnpm db:drop
```

**Create tables from SQL schema:**

```bash
pnpm db:create
```

## Architecture

```
SQL Schema (norberts_schema.sql)
        ↓
  Source of Truth
        ↓
    PostgreSQL Database
        ↓
Drizzle ORM Schema (for TypeScript types)
```

### Key Benefits

1. **SQL as Source of Truth**: Database structure defined in standard PostgreSQL SQL
2. **Version Control**: Easy to track schema changes in git
3. **PostgreSQL Features**: Full access to PostgreSQL-specific features (ENUM types, CHECK constraints, triggers)
4. **Type Safety**: Drizzle ORM schema provides TypeScript types for database access
5. **No Magic**: Clear, explicit SQL that any PostgreSQL DBA can understand

## Migration Strategy

For future schema changes:

1. **Edit SQL Schema**: Update `apps/backend/sql/norberts_schema.sql`
2. **Update Drop Script**: Update `apps/backend/drizzle/drop_all_tables.sql` if needed
3. **Update Drizzle Schema**: Update Drizzle schema files to match for TypeScript types
4. **Test**: Run `pnpm db:reset` to verify

## Drizzle-Kit Studio Command

While we no longer use drizzle-kit for schema creation or migrations, this command remains useful:

- `pnpm db:studio` - Visual database browser
## Verification

After running `pnpm db:reset`, verify tables were created:

```bash
docker exec -i norbertsSpark-postgres psql -U postgres -d norbertsSpark -c "\dt"
```

Expected output: 9 tables

- ai_options
- audit_log
- chats
- customer_people
- customers
- messages
- parts
- people
- users
