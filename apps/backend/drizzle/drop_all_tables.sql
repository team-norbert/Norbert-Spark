-- ============================================================
-- Drop everything in the public schema
-- ============================================================
-- This script removes ALL objects created by norberts_schema.sql
-- (the source of truth) plus any legacy tables left by Drizzle
-- migrations so that db:create always starts from a clean slate.
-- ============================================================

-- Drop pg_stat_statements extension if it exists to avoid conflicts
DROP EXTENSION IF EXISTS pg_stat_statements CASCADE;

-- ────────────────────────────────────────────────────────────
-- 1. Dynamic: drop every table in the public schema.
--    This guarantees nothing is missed, even if the list below
--    gets out of date or Drizzle created extra tables.
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. Explicit drops (belt-and-suspenders for clarity and for
--    indexes / types / functions that survive table drops).
-- ────────────────────────────────────────────────────────────

-- AI Chat System tables
DROP TABLE IF EXISTS "parts" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "chat_ai_options" CASCADE;
DROP TABLE IF EXISTS "audit_log" CASCADE;
DROP TABLE IF EXISTS "data_retrieval_message_parts" CASCADE;
DROP TABLE IF EXISTS "data_retrieval_messages" CASCADE;
DROP TABLE IF EXISTS "chats" CASCADE;
DROP TABLE IF EXISTS "chat_types" CASCADE;

-- CRM tables
DROP TABLE IF EXISTS "company_people" CASCADE;
DROP TABLE IF EXISTS "key_person" CASCADE;
DROP TABLE IF EXISTS "company" CASCADE;

-- Vector / RAG tables (source of truth: norberts_schema.sql)
DROP TABLE IF EXISTS "data" CASCADE;

-- Vector / RAG tables (explicit for clarity)
DROP TABLE IF EXISTS "vector_embeddings_3072" CASCADE;
DROP TABLE IF EXISTS "vector_embeddings_1024" CASCADE;

-- Legacy tables (created by Drizzle, no longer in the SQL schema)
DROP TABLE IF EXISTS "vector_embeddings_1536" CASCADE;
DROP TABLE IF EXISTS "vector_embeddings_768" CASCADE;
DROP TABLE IF EXISTS "vector_embeddings_384" CASCADE;
DROP TABLE IF EXISTS "ai_options" CASCADE;

-- Users table (referenced by chats)
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop any remaining indexes (if they weren't cascaded)
DROP INDEX IF EXISTS "data_embedding_cosine_idx";
DROP INDEX IF EXISTS "parts_message_id_order_idx";
DROP INDEX IF EXISTS "parts_message_id_idx";
DROP INDEX IF EXISTS "messages_chat_id_created_at_idx";
DROP INDEX IF EXISTS "messages_chat_id_idx";
DROP INDEX IF EXISTS "chats_user_id_updated_at_idx";
DROP INDEX IF EXISTS "chats_user_id_idx";
DROP INDEX IF EXISTS "chats_chat_type_id_idx";
DROP INDEX IF EXISTS "chat_types_name_idx";
DROP INDEX IF EXISTS "chat_ai_options_chat_type_id_idx";
DROP INDEX IF EXISTS "audit_log_action_idx";
DROP INDEX IF EXISTS "audit_log_created_at_idx";
DROP INDEX IF EXISTS "audit_log_entity_type_entity_id_idx";
DROP INDEX IF EXISTS "audit_log_user_id_idx";
DROP INDEX IF EXISTS "one_primary_contact_per_company";
DROP INDEX IF EXISTS "one_primary_contact_per_customer";
DROP INDEX IF EXISTS "only_one_key_person";
DROP INDEX IF EXISTS "data_retrieval_message_parts_message_id_idx";
DROP INDEX IF EXISTS "data_retrieval_message_parts_text_json_idx";

-- Drop ENUM types
DROP TYPE IF EXISTS "contact_role" CASCADE;
DROP TYPE IF EXISTS "customer_status" CASCADE;
DROP TYPE IF EXISTS "embedding_dimension" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS "touch_updated_at"() CASCADE;

-- Verify all tables are dropped
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';
