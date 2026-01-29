-- ============================================================
-- Norberts Spark Database Schema (PostgreSQL)
-- ============================================================
-- Combined schema including:
--   - CRM/Company management (customers, people, relationships)
--   - AI chat system (users, chats, messages, parts)
--   - Audit logging
-- 
-- Requirements:
--   - PostgreSQL 14+
--   - UUIDs via pgcrypto or uuidv7()
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------
-- ENUM types
-- ------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_status') THEN
    CREATE TYPE customer_status AS ENUM (
      'prospect',
      'active',
      'paused',
      'churned'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_role') THEN
    CREATE TYPE contact_role AS ENUM (
      'primary_contact',
      'decision_maker',
      'billing_contact',
      'technical_contact',
      'stakeholder'
    );
  END IF;
END $$;

-- ============================================================
-- USER MANAGEMENT
-- ============================================================

-- Users table: Authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    user_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    name        TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    password    TEXT CHECK (password IS NULL OR length(password) = 60), -- bcrypt hash
    email       CITEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    provider    TEXT CHECK (provider IN ('google')),
    provider_id TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- VECTOR DATA (RAG)
-- ============================================================

CREATE TABLE IF NOT EXISTS vector_embeddings (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vector_embeddings_embedding_cosine_idx
    ON data
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);


-- ============================================================
-- CRM / COMPANY MANAGEMENT
-- ============================================================

-- Customers (Accounts)
-- Note: This is a singleton table - only one company record is allowed
CREATE TABLE IF NOT EXISTS company (
    company_id UUID PRIMARY KEY DEFAULT uuidv7(),
    legal_name TEXT NOT NULL
        CHECK (length(trim(legal_name)) BETWEEN 2 AND 200),
    display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) BETWEEN 2 AND 200),
    status customer_status NOT NULL DEFAULT 'active',
    industry TEXT
        CHECK (industry IS NULL OR length(industry) <= 100),
    company_size INTEGER
        CHECK (company_size IS NULL OR company_size > 0),
    website_url TEXT
        CHECK (website_url IS NULL OR website_url ~* '^https?://'),
    billing_country CHAR(2)
        CHECK (billing_country IS NULL OR billing_country ~ '^[A-Z]{2}$'),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    singleton_check BOOLEAN NOT NULL DEFAULT true
        CHECK (singleton_check = true),
    UNIQUE (singleton_check)
);

-- Key Person (Contacts)
CREATE TABLE IF NOT EXISTS key_person (
    person_id UUID PRIMARY KEY DEFAULT uuidv7(),
    first_name TEXT NOT NULL CHECK (length(trim(first_name)) BETWEEN 1 AND 100),
    last_name TEXT NOT NULL CHECK (length(trim(last_name)) BETWEEN 1 AND 100),
    email CITEXT
        CHECK (
            email IS NULL
            OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        ),
    phone TEXT
        CHECK (phone IS NULL OR length(phone) <= 30),
    job_title TEXT
        CHECK (job_title IS NULL OR length(job_title) <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT people_unique_email UNIQUE (email)
);

-- Unique constraint to enforce only one key person record
CREATE UNIQUE INDEX IF NOT EXISTS only_one_key_person
    ON key_person ((true));

-- Customer ↔ Person Relationship (Key Contact Lives Here)
CREATE TABLE IF NOT EXISTS company_people (
    company_person_id UUID PRIMARY KEY DEFAULT uuidv7(),
    company_id UUID NOT NULL
        REFERENCES company(company_id)
        ON DELETE CASCADE,
    person_id UUID NOT NULL
        REFERENCES key_person(person_id)
        ON DELETE CASCADE,
    role contact_role,
    is_primary BOOLEAN DEFAULT false,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT customer_people_unique
        UNIQUE (company_id, person_id, role)
);

-- Enforce one primary contact per company
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_contact_per_company
    ON company_people (company_id)
    WHERE is_primary = true;

-- ============================================================
-- AI CHAT SYSTEM
-- ============================================================

-- Chat Types table: Stores reusable chat templates/configurations
CREATE TABLE IF NOT EXISTS chat_types (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name TEXT NOT NULL UNIQUE CHECK (length(name) >= 1 AND length(name) <= 200),
    seo_friendly_id CITEXT NOT NULL UNIQUE CHECK (length(seo_friendly_id) >= 1 AND length(seo_friendly_id) <= 200 AND seo_friendly_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    seo_friendly_base64_id TEXT NOT NULL UNIQUE CHECK (length(seo_friendly_base64_id) = 22),
    description TEXT NOT NULL CHECK (length(description) >= 1 AND length(description) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for chat types
CREATE INDEX IF NOT EXISTS chat_types_name_idx ON chat_types(name);

-- Chats table: Stores individual user chat sessions
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY, -- the UUID creation is managed by the application (frontend)
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chat_type_id UUID REFERENCES chat_types(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for chats table
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS chats_user_id_updated_at_idx ON chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS chats_chat_type_id_idx ON chats(chat_type_id);

-- Messages table: Stores individual messages within chats
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    role VARCHAR NOT NULL CONSTRAINT role_length_check CHECK (char_length(role) <= 15)
);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_created_at_idx ON messages(chat_id, created_at);

-- AI options table: Stores model configuration parameters for each chat type (one-to-one with chat_types)
CREATE TABLE IF NOT EXISTS chat_ai_options (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    chat_type_id UUID NOT NULL UNIQUE REFERENCES chat_types(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    max_tokens INTEGER CHECK (
                                 max_tokens IS NULL
                                 OR (max_tokens > 0 AND max_tokens <= 100000)
                             ),
    temperature NUMERIC CHECK (
                                 temperature IS NULL
                                 OR (temperature >= 0 AND temperature <= 2)
                             ),
    top_p NUMERIC CHECK (
                            top_p IS NULL
                            OR (top_p >= 0 AND top_p <= 1)
                        ),
    frequency_penalty NUMERIC CHECK (
                                        frequency_penalty IS NULL
                                        OR (frequency_penalty >= -2 AND frequency_penalty <= 2)
                                    ),
    presence_penalty NUMERIC CHECK (
                                        presence_penalty IS NULL
                                        OR (presence_penalty >= -2 AND presence_penalty <= 2)
                                    ),
    top_k INTEGER CHECK (
                                 top_k IS NULL
                                 OR (top_k > 0 AND top_k <= 100)
                             ),
    stop_sequences TEXT[],
    seed INTEGER CHECK (seed IS NULL OR (seed >= 0 AND seed <= 2147483647)),
    max_retries INTEGER CHECK (max_retries IS NULL OR (max_retries >= 0 AND max_retries <= 10)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookup
CREATE UNIQUE INDEX chat_ai_options_chat_type_id_idx ON chat_ai_options(chat_type_id);

-- Parts table: Stores message parts (text, files, tools, etc.)
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    "order" INTEGER NOT NULL DEFAULT 0,

    -- Text fields
    text_text TEXT,

    -- Reasoning fields
    reasoning_text TEXT,

    -- File fields
    file_media_type VARCHAR,
    file_filename VARCHAR,
    file_url VARCHAR,

    -- Source URL fields
    source_url_source_id VARCHAR,
    source_url_url VARCHAR,
    source_url_title VARCHAR,

    -- Source document fields
    source_document_source_id VARCHAR,
    source_document_media_type VARCHAR,
    source_document_title VARCHAR,
    source_document_filename VARCHAR,

    -- Shared tool call columns
    tool_tool_call_id VARCHAR,
    tool_state VARCHAR,
    tool_error_text VARCHAR,

    -- Data part fields (for custom data like darkness, weather, etc.)
    data_content JSONB,

    -- Provider metadata
    provider_metadata JSONB,

    -- tools-specific fields
    tool_heart_of_darkness_qa_input JSONB,
    /* the input will be a JSON object:
     * "input": {
     *     "question": "Summarize Heart of Darkness"
     * }
     */
    tool_heart_of_darkness_qa_output JSONB,
    /* the output will be a JSON object:
     * "output": {
     *     "question": "Summarize Heart of Darkness",
     *     "textLength": 232885,
     *     "context": "﻿The Project Gutenberg eBook of Heart of"
     * }
     */
    tool_heart_of_darkness_qa_error_text VARCHAR,

    -- Check constraints: Enforce required fields based on part type
    CONSTRAINT text_text_required_if_type_is_text 
        CHECK (CASE WHEN type = 'text' THEN text_text IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT reasoning_text_required_if_type_is_reasoning 
        CHECK (CASE WHEN type = 'reasoning' THEN reasoning_text IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT file_fields_required_if_type_is_file 
        CHECK (CASE WHEN type = 'file' THEN file_media_type IS NOT NULL AND file_url IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT source_url_fields_required_if_type_is_source_url 
        CHECK (CASE WHEN type = 'source_url' THEN source_url_source_id IS NOT NULL AND source_url_url IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT source_document_fields_required_if_type_is_source_document 
        CHECK (CASE WHEN type = 'source_document' THEN source_document_source_id IS NOT NULL AND source_document_media_type IS NOT NULL AND source_document_title IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT data_content_required_if_type_is_data 
        CHECK (CASE WHEN type = 'data' THEN data_content IS NOT NULL ELSE TRUE END)
);

-- Indexes for parts table
CREATE INDEX IF NOT EXISTS parts_message_id_idx ON parts(message_id);
CREATE INDEX IF NOT EXISTS parts_message_id_order_idx ON parts(message_id, "order");

-- ============================================================
-- DATA RETRIEVAL MESSAGE PARTS
-- ============================================================
-- Data Retrieval Messages table: Stores messages related to data retrieval operations
/*
Why NOT reuse messages / parts
Do not reuse messages/parts because:
Semantic mismatch:	Chat ≠ extraction job
Lifecycle:	Retrievals are immutable; chats are mutable
Query patterns:	Extraction data is analytical
Constraints	parts has many irrelevant columns
Performance	Narrow tables + JSONB GIN index
*/

CREATE TABLE IF NOT EXISTS data_retrieval_messages (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_retrieval_message_parts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    message_id UUID NOT NULL
    REFERENCES data_retrieval_messages(id)
    ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    text_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT text_json_required_if_type_is_text
    CHECK (
              CASE
              WHEN type = 'text' THEN text_json IS NOT NULL
              ELSE TRUE
              END
          )
    );

CREATE INDEX IF NOT EXISTS data_retrieval_message_parts_message_id_idx
    ON data_retrieval_message_parts (message_id);

CREATE INDEX IF NOT EXISTS data_retrieval_message_parts_text_json_idx
    ON data_retrieval_message_parts
    USING GIN (text_json);


-- ============================================================
-- AUDIT LOGGING
-- ============================================================

-- Audit log table: Tracks all significant actions and changes in the system
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id TEXT,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_log table
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_entity_type_entity_id_idx ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Updated_at auto-touch function
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS chats_updated_at ON chats;
CREATE TRIGGER chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS company_updated_at ON company;
CREATE TRIGGER company_updated_at
    BEFORE UPDATE ON company
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS key_person_updated_at ON key_person;
CREATE TRIGGER key_person_updated_at
    BEFORE UPDATE ON key_person
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

-- AI Chat System
COMMENT ON TABLE chats IS 'Stores chat sessions linked to users';
COMMENT ON TABLE messages IS 'Stores individual messages within chats';
COMMENT ON TABLE parts IS 'Stores message parts with polymorphic structure based on type field';

COMMENT ON TABLE chat_ai_options IS 'Stores default AI model configuration for each chat type';
COMMENT ON COLUMN chat_ai_options.chat_type_id IS 'One-to-one relationship with chat_types table';
COMMENT ON COLUMN chat_ai_options.prompt IS 'System prompt/context for this chat type';

COMMENT ON COLUMN chats.user_id IS 'Foreign key linking chat to the user who created it';
COMMENT ON COLUMN chats.chat_type_id IS 'Foreign key linking chat to a chat type configuration';
COMMENT ON COLUMN chats.updated_at IS 'Timestamp of last activity in this chat, useful for sorting chat history';
COMMENT ON COLUMN parts.type IS 'Discriminator field - values: text, reasoning, file, source_url, source_document, tool-getWeatherInformation, tool-getLocation, data-weather';
COMMENT ON COLUMN parts."order" IS 'Order of parts within a message for proper sequencing';

-- Audit Logging
COMMENT ON TABLE audit_log IS 'Tracks all significant actions and changes across the system for security and compliance';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action (nullable if action performed by system)';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected (e.g., user, chat, message, part, customer, person)';
COMMENT ON COLUMN audit_log.entity_id IS 'Identifier of the affected entity (UUID or file path)';
COMMENT ON COLUMN audit_log.action IS 'Action performed (e.g., create, update, delete, login, logout)';
COMMENT ON COLUMN audit_log.changes IS 'JSONB object containing before/after values for updates, or relevant metadata';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent string of the client that performed the action';
COMMENT ON COLUMN audit_log.created_at IS 'Timestamp when the action was performed';

COMMIT;
