-- Drop all tables in reverse order of dependencies
-- This script safely removes all tables created by the migration

-- Drop pg_stat_statements extension if it exists to avoid conflicts
DROP EXTENSION IF EXISTS pg_stat_statements CASCADE;

-- Drop foreign key constraints first by dropping dependent tables
-- AI Chat System tables
DROP TABLE IF EXISTS "ai_options" CASCADE;
DROP TABLE IF EXISTS "parts" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "audit_log" CASCADE;
DROP TABLE IF EXISTS "chats" CASCADE;

-- CRM tables
DROP TABLE IF EXISTS "customer_people" CASCADE;
DROP TABLE IF EXISTS "people" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;

-- Users table (referenced by chats)
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop any remaining indexes (if they weren't cascaded)
DROP INDEX IF EXISTS "parts_message_id_order_idx";
DROP INDEX IF EXISTS "parts_message_id_idx";
DROP INDEX IF EXISTS "messages_chat_id_created_at_idx";
DROP INDEX IF EXISTS "messages_chat_id_idx";
DROP INDEX IF EXISTS "chats_user_id_updated_at_idx";
DROP INDEX IF EXISTS "chats_user_id_idx";
DROP INDEX IF EXISTS "ai_options_message_id_idx";
DROP INDEX IF EXISTS "audit_log_action_idx";
DROP INDEX IF EXISTS "audit_log_created_at_idx";
DROP INDEX IF EXISTS "audit_log_entity_type_entity_id_idx";
DROP INDEX IF EXISTS "audit_log_user_id_idx";
DROP INDEX IF EXISTS "one_primary_contact_per_customer";

-- Drop ENUM types
DROP TYPE IF EXISTS "contact_role" CASCADE;
DROP TYPE IF EXISTS "customer_status" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS "touch_updated_at"() CASCADE;

-- Verify all tables are dropped
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'chats', 'messages', 'ai_options', 'parts', 'audit_log', 'customers', 'people', 'customer_people');
