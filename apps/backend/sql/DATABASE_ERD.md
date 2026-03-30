# Database Entity Relationship Diagram (ERD)

<!-- Regenerate this file whenever norberts_schema.sql changes. -->

## Schema Overview

This ERD covers all tables in the Norbert's Spark PostgreSQL schema, grouped into five domains:

- **User Management** — users, refresh_tokens
- **Vector Data / RAG** — documents, embedding_models, vector_stores, vector_store_documents, vector_embeddings_384/768/1024/1536/3072
- **CRM / Company Management** — company, key_person, company_people
- **AI Chat System** — chat_types, chats, messages, parts, chat_ai_options
- **Data Retrieval** — data_retrieval_messages, data_retrieval_message_parts
- **Audit Logging** — audit_log

---

## Entity Relationship Diagram

```mermaid
erDiagram

    %% ── USER MANAGEMENT ──────────────────────────────────────────
    users ||--o{ refresh_tokens         : "owns"
    users ||--o{ chats                  : "creates"
    users ||--o{ audit_log              : "performs"

    %% ── AI CHAT SYSTEM ───────────────────────────────────────────
    chat_types ||--|| chat_ai_options   : "configured by"
    chat_types ||--o{ chats             : "templates"
    chats      ||--o{ messages          : "contains"
    messages   ||--o{ parts             : "has"

    %% ── CRM / COMPANY MANAGEMENT ─────────────────────────────────
    company    ||--o{ company_people    : "employs"
    key_person ||--o{ company_people    : "works at"

    %% ── DATA RETRIEVAL ───────────────────────────────────────────
    data_retrieval_messages ||--o{ data_retrieval_message_parts : "contains"

    %% ── VECTOR DATA / RAG ────────────────────────────────────────
    embedding_models ||--o{ vector_stores              : "used by"
    vector_stores    ||--o{ vector_store_documents     : "groups"
    documents        ||--o{ vector_store_documents     : "belongs to"
    documents        ||--o{ vector_embeddings_384      : "chunked into"
    documents        ||--o{ vector_embeddings_768      : "chunked into"
    documents        ||--o{ vector_embeddings_1024     : "chunked into"
    documents        ||--o{ vector_embeddings_1536     : "chunked into"
    documents        ||--o{ vector_embeddings_3072     : "chunked into"
    embedding_models ||--o{ vector_embeddings_384      : "produces"
    embedding_models ||--o{ vector_embeddings_768      : "produces"
    embedding_models ||--o{ vector_embeddings_1024     : "produces"
    embedding_models ||--o{ vector_embeddings_1536     : "produces"
    embedding_models ||--o{ vector_embeddings_3072     : "produces"

    %% ── TABLE DEFINITIONS ────────────────────────────────────────

    users {
        uuid        user_id            PK  "uuidv7()"
        text        name                   "NOT NULL, 2-100 chars"
        text        password               "NULL or 60 chars (bcrypt)"
        citext      email                  "NOT NULL, UNIQUE"
        text        role                   "user|admin|moderator"
        text        provider               "NULL or google"
        text        provider_id            "OAuth provider ID"
        boolean     two_factor_enabled     "Default: false"
        text        two_factor_secret      "TOTP secret"
        timestamptz created_at             "Default: now()"
        timestamptz updated_at             "Default: now(), trigger-managed"
    }

    refresh_tokens {
        uuid        id              PK  "uuidv7()"
        uuid        user_id         FK  "REFERENCES users ON DELETE CASCADE"
        text        token_hash          "NOT NULL, UNIQUE"
        uuid        token_family        "NOT NULL"
        timestamptz expires_at          "NOT NULL"
        timestamptz revoked_at          "Nullable"
        timestamptz created_at          "Default: now()"
        timestamptz last_used_at        "Nullable"
        text        ip_address          "GDPR-masked client IP"
        text        user_agent          "Client user agent"
    }

    documents {
        uuid        id          PK  "uuidv7()"
        text        title           "NOT NULL, non-empty"
        text        source          "NOT NULL"
        text        checksum        "Nullable, indexed"
        text        status          "processing|indexed|failed|archived"
        timestamptz created_at      "Default: now()"
        timestamptz updated_at      "Default: now(), trigger-managed"
    }

    embedding_models {
        uuid        id                  PK  "uuidv7()"
        text        name                    "NOT NULL, non-empty"
        text        provider               "openai|google|cohere|amazon|voyage|mistral"
        text        status                 "current|legacy|deprecated|experimental"
        integer     release_year           "2000 to current year + 1"
        text        recommended_usage      "NOT NULL, non-empty"
        text        task_type              "Google task type (nullable for non-Google)"
        integer     dimension              "384|768|1024|1536|3072"
        timestamptz created_at             "Default: now()"
        timestamptz updated_at             "Default: now(), trigger-managed"
    }

    vector_stores {
        uuid        id                  PK  "uuidv7()"
        text        name                    "NOT NULL, non-empty"
        uuid        embedding_model_id  FK  "REFERENCES embedding_models ON DELETE RESTRICT"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    vector_store_documents {
        uuid        vector_store_id     PK,FK  "REFERENCES vector_stores ON DELETE CASCADE"
        uuid        document_id         PK,FK  "REFERENCES documents ON DELETE CASCADE"
        timestamptz added_at                   "Default: now()"
    }

    vector_embeddings_384 {
        uuid        id                  PK  "uuidv7()"
        uuid        document_id         FK  "REFERENCES documents ON DELETE CASCADE"
        uuid        embedding_model_id      "Composite FK to embedding_models(id, dimension)"
        integer     embedding_dimension     "Locked to 384"
        integer     chunk_index             "Default: 0"
        text        content                 "NOT NULL, 1-50000 chars"
        jsonb       metadata                "Default: {}"
        vector      embedding               "VECTOR(384) NOT NULL"
        integer     chunk_size              "Default: 700, 1-50000"
        integer     chunk_overlap           "Default: 120, 0 to chunk_size"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    vector_embeddings_768 {
        uuid        id                  PK  "uuidv7()"
        uuid        document_id         FK  "REFERENCES documents ON DELETE CASCADE"
        uuid        embedding_model_id      "Composite FK to embedding_models(id, dimension)"
        integer     embedding_dimension     "Locked to 768"
        integer     chunk_index             "Default: 0"
        text        content                 "NOT NULL, 1-50000 chars"
        jsonb       metadata                "Default: {}"
        vector      embedding               "VECTOR(768) NOT NULL"
        integer     chunk_size              "Default: 700, 1-50000"
        integer     chunk_overlap           "Default: 120, 0 to chunk_size"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    vector_embeddings_1024 {
        uuid        id                  PK  "uuidv7()"
        uuid        document_id         FK  "REFERENCES documents ON DELETE CASCADE"
        uuid        embedding_model_id      "Composite FK to embedding_models(id, dimension)"
        integer     embedding_dimension     "Locked to 1024"
        integer     chunk_index             "Default: 0"
        text        content                 "NOT NULL, 1-50000 chars"
        jsonb       metadata                "Default: {}"
        vector      embedding               "VECTOR(1024) NOT NULL"
        integer     chunk_size              "Default: 700, 1-50000"
        integer     chunk_overlap           "Default: 120, 0 to chunk_size"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    vector_embeddings_1536 {
        uuid        id                  PK  "uuidv7()"
        uuid        document_id         FK  "REFERENCES documents ON DELETE CASCADE"
        uuid        embedding_model_id      "Composite FK to embedding_models(id, dimension)"
        integer     embedding_dimension     "Locked to 1536"
        integer     chunk_index             "Default: 0"
        text        content                 "NOT NULL, 1-50000 chars"
        jsonb       metadata                "Default: {}"
        vector      embedding               "VECTOR(1536) NOT NULL"
        integer     chunk_size              "Default: 700, 1-50000"
        integer     chunk_overlap           "Default: 120, 0 to chunk_size"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    vector_embeddings_3072 {
        uuid        id                  PK  "uuidv7()"
        uuid        document_id         FK  "REFERENCES documents ON DELETE CASCADE"
        uuid        embedding_model_id      "Composite FK to embedding_models(id, dimension)"
        integer     embedding_dimension     "Locked to 3072"
        integer     chunk_index             "Default: 0"
        text        content                 "NOT NULL, 1-50000 chars"
        jsonb       metadata                "Default: {}"
        vector      embedding               "VECTOR(3072) NOT NULL"
        integer     chunk_size              "Default: 700, 1-50000"
        integer     chunk_overlap           "Default: 120, 0 to chunk_size"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now(), trigger-managed"
    }

    company {
        uuid              company_id      PK  "uuidv7()"
        text              legal_name          "NOT NULL, 2-200 chars"
        text              display_name        "NOT NULL, 2-200 chars"
        customer_status   status              "prospect|active|paused|churned"
        text              industry            "Max 100 chars"
        integer           company_size        "Must be > 0"
        text              website_url         "Must match https?:// pattern"
        char              billing_country     "2-char ISO country code"
        text              timezone            "Default: UTC"
        timestamptz       created_at          "Default: now()"
        timestamptz       updated_at          "Default: now(), trigger-managed"
        boolean           singleton_check     "Always true, UNIQUE (singleton enforcement)"
    }

    key_person {
        uuid        person_id   PK  "uuidv7()"
        text        first_name      "NOT NULL, 1-100 chars"
        text        last_name       "NOT NULL, 1-100 chars"
        citext      email           "UNIQUE, email format"
        text        phone           "Max 30 chars"
        text        job_title       "Max 100 chars"
        boolean     is_active       "Default: true"
        timestamptz created_at      "Default: now()"
        timestamptz updated_at      "Default: now(), trigger-managed"
    }

    company_people {
        uuid            company_person_id   PK  "uuidv7()"
        uuid            company_id          FK  "REFERENCES company ON DELETE CASCADE"
        uuid            person_id           FK  "REFERENCES key_person ON DELETE CASCADE"
        contact_role    role                    "primary_contact|decision_maker|billing_contact|technical_contact|stakeholder"
        boolean         is_primary              "Default: false"
        date            start_date              "Default: CURRENT_DATE"
        date            end_date                "Must be >= start_date"
        timestamptz     created_at              "Default: now()"
    }

    chat_types {
        uuid        id                      PK  "uuidv7()"
        text        name                        "NOT NULL, UNIQUE, 1-200 chars"
        citext      seo_friendly_id             "NOT NULL, UNIQUE, slug format"
        text        seo_friendly_base64_id      "NOT NULL, UNIQUE, 22 chars"
        text        description                 "NOT NULL, 1-500 chars"
        boolean     rag                         "Default: false"
        timestamptz created_at                  "Default: now()"
        timestamptz updated_at                  "Default: now(), trigger-managed"
    }

    chat_ai_options {
        uuid        id                  PK  "uuidv7()"
        uuid        chat_type_id        FK  "UNIQUE, REFERENCES chat_types ON DELETE CASCADE"
        text        prompt                  "NOT NULL, system prompt"
        integer     max_tokens              "NULL or 1-100000"
        numeric     temperature             "NULL or 0-2"
        numeric     top_p                   "NULL or 0-1"
        numeric     frequency_penalty       "NULL or -2 to 2"
        numeric     presence_penalty        "NULL or -2 to 2"
        integer     top_k                   "NULL or 1-100"
        text[]      stop_sequences          "Array of stop strings"
        integer     max_retries             "NULL or 0-10"
        timestamptz created_at              "Default: now()"
        timestamptz updated_at              "Default: now()"
    }

    chats {
        uuid        id              PK  "App-managed UUID (no default)"
        uuid        user_id         FK  "REFERENCES users ON DELETE CASCADE"
        uuid        chat_type_id    FK  "REFERENCES chat_types ON DELETE RESTRICT"
        timestamptz created_at          "Default: now()"
        timestamptz updated_at          "Default: now(), trigger-managed"
    }

    messages {
        uuid        id          PK  "uuidv7()"
        uuid        chat_id     FK  "REFERENCES chats ON DELETE CASCADE"
        timestamptz created_at      "Default: now()"
        varchar     role            "Max 15 chars (user|assistant|system)"
    }

    parts {
        uuid        id                                  PK  "uuidv7()"
        uuid        message_id                          FK  "REFERENCES messages ON DELETE CASCADE"
        varchar     type                                    "Discriminator: text|reasoning|file|source_url|source_document|data|tool-*"
        timestamptz created_at                              "Default: now()"
        integer     order                                   "Default: 0"
        text        text_text                               "Required if type=text"
        text        reasoning_text                          "Required if type=reasoning"
        varchar     file_media_type                         "Required if type=file"
        varchar     file_filename                           "Optional for type=file"
        varchar     file_url                                "Required if type=file"
        varchar     source_url_source_id                    "Required if type=source_url"
        varchar     source_url_url                          "Required if type=source_url"
        varchar     source_url_title                        "Optional for type=source_url"
        varchar     source_document_source_id               "Required if type=source_document"
        varchar     source_document_media_type              "Required if type=source_document"
        varchar     source_document_title                   "Required if type=source_document"
        varchar     source_document_filename                "Optional for type=source_document"
        varchar     tool_tool_call_id                       "For tool types"
        varchar     tool_state                              "For tool types"
        varchar     tool_error_text                         "For tool types"
        jsonb       data_content                            "Required if type=data"
        jsonb       provider_metadata                       "Provider-specific metadata"
        jsonb       tool_heart_of_darkness_qa_input         "Tool-specific input"
        jsonb       tool_heart_of_darkness_qa_output        "Tool-specific output"
        varchar     tool_heart_of_darkness_qa_error_text    "Tool-specific error"
    }

    data_retrieval_messages {
        uuid        id          PK  "uuidv7()"
        timestamptz created_at      "Default: now()"
    }

    data_retrieval_message_parts {
        uuid        id          PK  "uuidv7()"
        uuid        message_id  FK  "REFERENCES data_retrieval_messages ON DELETE CASCADE"
        varchar     type            "Max 20 chars"
        jsonb       text_json       "Required if type=text; GIN indexed"
        timestamptz created_at      "Default: now()"
    }

    audit_log {
        uuid        id              PK  "uuidv7()"
        uuid        user_id         FK  "REFERENCES users ON DELETE SET NULL, nullable"
        varchar     entity_type         "Max 50 chars (e.g. USER, CHAT)"
        text        entity_id           "Affected entity identifier"
        varchar     action              "Max 50 chars (e.g. CREATE, LOGIN)"
        jsonb       changes             "Before/after values or metadata"
        text        ip_address          "GDPR-masked client IP"
        text        user_agent          "Client user agent string"
        timestamptz created_at          "Default: now()"
    }
```

---

## Table Reference

### User Management

| Table            | Purpose                        | PK                 | Notable Constraints                               |
| ---------------- | ------------------------------ | ------------------ | ------------------------------------------------- |
| `users`          | Authentication & authorisation | `user_id` (UUIDv7) | `email` UNIQUE (CITEXT), role enum, OAuth support |
| `refresh_tokens` | JWT refresh token storage      | `id` (UUIDv7)      | `token_hash` UNIQUE, `user_id` CASCADE DELETE     |

### Vector Data / RAG

| Table                    | Purpose                              | PK                               | Notable Constraints                                                     |
| ------------------------ | ------------------------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| `documents`              | Source document metadata             | `id` (UUIDv7)                    | `status` enum, `checksum` partial index                                 |
| `embedding_models`       | Catalogue of embedding model configs | `id` (UUIDv7)                    | Composite UNIQUE `(id, dimension)`, Google-only `task_type` check       |
| `vector_stores`          | Named collections of documents       | `id` (UUIDv7)                    | FK to `embedding_models` RESTRICT                                       |
| `vector_store_documents` | Many-to-many join: store to document | `(vector_store_id, document_id)` | Both sides CASCADE DELETE                                               |
| `vector_embeddings_384`  | 384-dim chunk embeddings             | `id` (UUIDv7)                    | Composite FK `(embedding_model_id, embedding_dimension)`, IVFFlat index |
| `vector_embeddings_768`  | 768-dim chunk embeddings             | `id` (UUIDv7)                    | As above                                                                |
| `vector_embeddings_1024` | 1024-dim chunk embeddings            | `id` (UUIDv7)                    | As above                                                                |
| `vector_embeddings_1536` | 1536-dim chunk embeddings            | `id` (UUIDv7)                    | As above                                                                |
| `vector_embeddings_3072` | 3072-dim chunk embeddings            | `id` (UUIDv7)                    | As above, HNSW halfvec index                                            |

### CRM / Company Management

| Table            | Purpose                    | PK                           | Notable Constraints                                  |
| ---------------- | -------------------------- | ---------------------------- | ---------------------------------------------------- |
| `company`        | Company record (singleton) | `company_id` (UUIDv7)        | `singleton_check` UNIQUE enforces one row            |
| `key_person`     | Contact person (singleton) | `person_id` (UUIDv7)         | UNIQUE INDEX on `(true)` enforces one row            |
| `company_people` | Company to person junction | `company_person_id` (UUIDv7) | Unique primary contact per company via partial index |

### AI Chat System

| Table             | Purpose                       | PK                      | Notable Constraints                                             |
| ----------------- | ----------------------------- | ----------------------- | --------------------------------------------------------------- |
| `chat_types`      | Reusable chat templates       | `id` (UUIDv7)           | `name`, `seo_friendly_id`, `seo_friendly_base64_id` each UNIQUE |
| `chat_ai_options` | AI model config per chat type | `id` (UUIDv7)           | `chat_type_id` UNIQUE (one-to-one with `chat_types`)            |
| `chats`           | User chat sessions            | `id` (app-managed UUID) | `user_id` CASCADE DELETE, `chat_type_id` RESTRICT               |
| `messages`        | Messages within a chat        | `id` (UUIDv7)           | `chat_id` CASCADE DELETE                                        |
| `parts`           | Polymorphic message content   | `id` (UUIDv7)           | Type-based CHECK constraints per content type                   |

### Data Retrieval

| Table                          | Purpose                            | PK            | Notable Constraints                        |
| ------------------------------ | ---------------------------------- | ------------- | ------------------------------------------ |
| `data_retrieval_messages`      | Extraction job records (immutable) | `id` (UUIDv7) | Separate lifecycle from chat messages      |
| `data_retrieval_message_parts` | Parts of a retrieval message       | `id` (UUIDv7) | GIN index on `text_json` for JSONB queries |

### Audit Logging

| Table       | Purpose                        | PK            | Notable Constraints                                               |
| ----------- | ------------------------------ | ------------- | ----------------------------------------------------------------- |
| `audit_log` | System-wide action audit trail | `id` (UUIDv7) | `user_id` SET NULL on delete; indexed by entity, action, and date |

---

## Indexes

| Table                          | Index                                    | Type                    | Columns                                                            |
| ------------------------------ | ---------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `documents`                    | `documents_checksum_idx`                 | B-tree (partial)        | `checksum` WHERE NOT NULL                                          |
| `vector_stores`                | `vector_stores_embedding_model_id_idx`   | B-tree                  | `embedding_model_id`                                               |
| `vector_store_documents`       | `vector_store_documents_document_id_idx` | B-tree                  | `document_id`                                                      |
| `vector_embeddings_384`        | cosine / document+chunk / model          | IVFFlat / B-tree        | `embedding`, `(document_id, chunk_index)`, `embedding_model_id`    |
| `vector_embeddings_768`        | cosine / document+chunk / model          | IVFFlat / B-tree        | As above                                                           |
| `vector_embeddings_1024`       | cosine / document+chunk / model          | IVFFlat / B-tree        | As above                                                           |
| `vector_embeddings_1536`       | cosine / document+chunk / model          | IVFFlat / B-tree        | As above                                                           |
| `vector_embeddings_3072`       | cosine / document+chunk / model          | HNSW (halfvec) / B-tree | `embedding`, `(document_id, chunk_index)`, `embedding_model_id`    |
| `refresh_tokens`               | user / family / expiry                   | B-tree (expiry partial) | `user_id`, `token_family`, `expires_at` WHERE revoked_at IS NULL   |
| `chat_types`                   | `chat_types_name_idx`                    | B-tree                  | `name`                                                             |
| `chats`                        | user / user+updated_at / chat_type       | B-tree                  | `user_id`, `(user_id, updated_at DESC)`, `chat_type_id`            |
| `messages`                     | chat / chat+created_at                   | B-tree                  | `chat_id`, `(chat_id, created_at)`                                 |
| `parts`                        | message / message+order                  | B-tree                  | `message_id`, `(message_id, order)`                                |
| `chat_ai_options`              | `chat_ai_options_chat_type_id_idx`       | B-tree (unique)         | `chat_type_id`                                                     |
| `data_retrieval_message_parts` | message / text_json                      | B-tree / GIN            | `message_id`, `text_json`                                          |
| `audit_log`                    | user / entity / created_at / action      | B-tree                  | `user_id`, `(entity_type, entity_id)`, `created_at DESC`, `action` |
| `company_people`               | `one_primary_contact_per_company`        | B-tree (partial unique) | `company_id` WHERE `is_primary = true`                             |
| `key_person`                   | `only_one_key_person`                    | B-tree (unique)         | `(true)` expression                                                |

---

## Cascade & Delete Behaviour

| Relationship                                               | On DELETE               |
| ---------------------------------------------------------- | ----------------------- |
| `users` → `refresh_tokens`                                 | CASCADE                 |
| `users` → `chats`                                          | CASCADE                 |
| `users` → `audit_log`                                      | SET NULL                |
| `chats` → `messages`                                       | CASCADE                 |
| `messages` → `parts`                                       | CASCADE                 |
| `chat_types` → `chats`                                     | RESTRICT                |
| `chat_types` → `chat_ai_options`                           | CASCADE                 |
| `company` → `company_people`                               | CASCADE                 |
| `key_person` → `company_people`                            | CASCADE                 |
| `data_retrieval_messages` → `data_retrieval_message_parts` | CASCADE                 |
| `embedding_models` → `vector_stores`                       | RESTRICT                |
| `vector_stores` → `vector_store_documents`                 | CASCADE                 |
| `documents` → `vector_store_documents`                     | CASCADE                 |
| `documents` → `vector_embeddings_*`                        | CASCADE                 |
| `embedding_models` → `vector_embeddings_*`                 | RESTRICT (composite FK) |

---

## ENUM Types

| ENUM              | Values                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `customer_status` | `prospect`, `active`, `paused`, `churned`                                                  |
| `contact_role`    | `primary_contact`, `decision_maker`, `billing_contact`, `technical_contact`, `stakeholder` |

---

## Triggers (auto-managed `updated_at`)

The `touch_updated_at()` function fires `BEFORE UPDATE` on: `chats`, `chat_types`, `company`, `key_person`, `documents`, `embedding_models`, `vector_stores`, `vector_embeddings_384`, `vector_embeddings_768`, `vector_embeddings_1024`, `vector_embeddings_1536`, `vector_embeddings_3072`.

The `users` table uses its own dedicated `users_set_updated_at()` trigger.
