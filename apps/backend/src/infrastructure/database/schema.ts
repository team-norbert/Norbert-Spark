/* eslint-disable max-lines */
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Define CITEXT custom type for case-insensitive text
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})

// Define VECTOR custom type for pgvector embeddings
const vector = customType<{ data: number[]; config: { dimension: number } }>({
  dataType(config) {
    return `vector(${(config as { dimension: number })?.dimension ?? 1536})`
  },
})

export const companyStatusEnum = pgEnum('customer_status', [
  'prospect',
  'active',
  'paused',
  'churned',
])

export const contactRoleEnum = pgEnum('contact_role', [
  'primary_contact',
  'decision_maker',
  'billing_contact',
  'technical_contact',
  'stakeholder',
])

/**
 * Company table: Stores customer information
 * Note: This is a singleton table - only one company record is allowed
 */
export const company = pgTable(
  'company',
  {
    companyId: uuid('company_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    legalName: text('legal_name').notNull(),
    displayName: text('display_name').notNull(),
    status: companyStatusEnum('status').notNull().default('active'),
    industry: text('industry'),
    companySize: integer('company_size'),
    websiteUrl: text('website_url'),
    billingCountry: char('billing_country', { length: 2 }),
    timezone: text('timezone').notNull().default('UTC'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    singletonCheck: boolean('singleton_check').notNull().default(true),
  },
  (table) => ({
    legalNameLengthCheck: check(
      'company_legal_name_length_check',
      sql`length(trim(${table.legalName})) BETWEEN 2 AND 200`
    ),
    displayNameLengthCheck: check(
      'company_display_name_length_check',
      sql`length(trim(${table.displayName})) BETWEEN 2 AND 200`
    ),
    industryLengthCheck: check(
      'company_industry_length_check',
      sql`${table.industry} IS NULL OR length(${table.industry}) <= 100`
    ),
    companySizeCheck: check(
      'company_company_size_check',
      sql`${table.companySize} IS NULL OR ${table.companySize} > 0`
    ),
    websiteUrlFormatCheck: check(
      'company_website_url_format_check',
      sql`${table.websiteUrl} IS NULL OR ${table.websiteUrl} ~* '^https?://'`
    ),
    billingCountryFormatCheck: check(
      'company_billing_country_format_check',
      sql`${table.billingCountry} IS NULL OR ${table.billingCountry} ~ '^[A-Z]{2}$'`
    ),
    singletonCheckConstraint: check('company_singleton_check', sql`${table.singletonCheck} = true`),
    onlyOneCompany: unique('only_one_company').on(table.singletonCheck),
  })
)

/**
 * Key Person table: Stores contacts associated with company
 */

export const keyPerson = pgTable(
  'key_person',
  {
    keyPersonId: uuid('person_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: citext('email'),
    phone: text('phone'),
    jobTitle: text('job_title'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Note: updatedAt is automatically maintained by a database trigger (see norberts_schema.sql).
    // The defaultNow() here only sets the initial value on INSERT.
    // On UPDATE operations, the touch_updated_at() trigger function automatically updates this column.
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEmail: unique('people_unique_email').on(table.email),
    firstNameLengthCheck: check(
      'key_person_first_name_length_check',
      sql`length(trim(${table.firstName})) BETWEEN 1 AND 100`
    ),
    lastNameLengthCheck: check(
      'key_person_last_name_length_check',
      sql`length(trim(${table.lastName})) BETWEEN 1 AND 100`
    ),
    emailFormatCheck: check(
      'key_person_email_format_check',
      sql`${table.email} IS NULL OR ${table.email} ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`
    ),
    phoneLengthCheck: check(
      'key_person_phone_length_check',
      sql`${table.phone} IS NULL OR length(${table.phone}) <= 30`
    ),
    jobTitleLengthCheck: check(
      'key_person_job_title_length_check',
      sql`${table.jobTitle} IS NULL OR length(${table.jobTitle}) <= 100`
    ),
  })
)

/**
 * Company - Key Person join table
 */

export const companyPeople = pgTable(
  'company_people',
  {
    companyPersonId: uuid('company_person_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => company.companyId, {
        onDelete: 'cascade',
      }),
    personId: uuid('person_id')
      .notNull()
      .references(() => keyPerson.keyPersonId, {
        onDelete: 'cascade',
      }),
    role: contactRoleEnum('role'),
    isPrimary: boolean('is_primary').default(false),
    startDate: date('start_date').default(sql`CURRENT_DATE`),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCustomerPersonRole: uniqueIndex('company_people_unique').on(
      table.companyId,
      table.personId,
      table.role
    ),
    onePrimaryPerCompany: uniqueIndex('one_primary_contact_per_company')
      .on(table.companyId)
      .where(sql`is_primary = true`),
    endDateAfterStartDate: check(
      'company_people_end_date_check',
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  })
)

/**
 * Data retrieval messages: logical messages returned by AI extraction
 */
export const dataRetrievalMessages = pgTable('data_retrieval_messages', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type DBDataRetrievalMessage = typeof dataRetrievalMessages.$inferInsert
export type DBDataRetrievalMessageSelect = typeof dataRetrievalMessages.$inferSelect

/**
 * DATA RETRIEVAL MESSAGE PARTS
 */
export const dataRetrievalMessageParts = pgTable(
  'data_retrieval_message_parts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    messageId: uuid('message_id')
      .notNull()
      .references(() => dataRetrievalMessages.id, {
        onDelete: 'cascade',
      }),
    type: varchar('type', { length: 20 }).notNull(),
    textJson: jsonb('text_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    textJsonRequiredIfTypeIsText: check(
      'text_json_required_if_type_is_text',
      sql`
        CASE
          WHEN ${table.type} = 'text'
          THEN ${table.textJson} IS NOT NULL
          ELSE TRUE
        END
      `
    ),

    /* ---------------------------------------------
     * Indexes (correct Drizzle syntax)
     * --------------------------------------------- */

    messageIdIdx: index('data_retrieval_message_parts_message_id_idx').on(table.messageId),
    textJsonGinIdx: index('data_retrieval_message_parts_text_json_idx').using(
      'gin',
      table.textJson
    ),
  })
)

export type DBDataRetrievalMessagePart = typeof dataRetrievalMessageParts.$inferInsert

export type DBDataRetrievalMessagePartSelect = typeof dataRetrievalMessageParts.$inferSelect

export const dataRetrievalMessagesRelations = relations(dataRetrievalMessages, ({ many }) => ({
  parts: many(dataRetrievalMessageParts),
}))

export const dataRetrievalMessagePartsRelations = relations(
  dataRetrievalMessageParts,
  ({ one }) => ({
    message: one(dataRetrievalMessages, {
      fields: [dataRetrievalMessageParts.messageId],
      references: [dataRetrievalMessages.id],
    }),
  })
)

/**
 * Relations
 */

export const companyRelations = relations(company, ({ many }) => ({
  contacts: many(companyPeople),
}))

export const keyPersonRelations = relations(keyPerson, ({ many }) => ({
  companies: many(companyPeople),
}))

export const companyPeopleRelations = relations(companyPeople, ({ one }) => ({
  company: one(company, {
    fields: [companyPeople.companyId],
    references: [company.companyId],
  }),
  person: one(keyPerson, {
    fields: [companyPeople.personId],
    references: [keyPerson.keyPersonId],
  }),
}))

export type DBCompany = typeof company.$inferInsert
export type DBCompanySelect = typeof company.$inferSelect

export type DBKeyPerson = typeof keyPerson.$inferInsert
export type DBKeyPersonSelect = typeof keyPerson.$inferSelect

export type DBCompanyPerson = typeof companyPeople.$inferInsert
export type DBCompanyPersonSelect = typeof companyPeople.$inferSelect

/**
 * Documents table: Tracks document metadata with status tracking
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    title: text('title').notNull(),
    source: text('source').notNull(),
    checksum: text('checksum'),
    status: text('status')
      .notNull()
      .default('processing')
      .$type<'processing' | 'indexed' | 'failed' | 'archived'>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusCheck: check(
      'documents_status_check',
      sql`${table.status} IN ('processing', 'indexed', 'failed', 'archived')`
    ),
    titleNotEmptyCheck: check(
      'documents_title_not_empty_check',
      sql`length(trim(${table.title})) > 0`
    ),
    checksumIdx: index('documents_checksum_idx')
      .on(table.checksum)
      .where(sql`${table.checksum} IS NOT NULL`),
  })
)

export type DBDocument = typeof documents.$inferInsert
export type DBDocumentSelect = typeof documents.$inferSelect

/**
 * Embedding Models table: Catalogs embedding model configurations
 */
export const embeddingModels = pgTable(
  'embedding_models',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    status: text('status').notNull(),
    releaseYear: integer('release_year').notNull(),
    recommendedUsage: text('recommended_usage').notNull(),
    taskType: text('task_type'),
    dimension: integer('dimension').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueNameProviderDimensionTaskType: unique(
      'embedding_models_name_provider_dimension_task_type_unique'
    )
      .on(table.name, table.provider, table.dimension, table.taskType)
      .nullsNotDistinct(),
    uniqueIdDimension: unique('embedding_models_id_dimension_unique').on(table.id, table.dimension),
    nameNotEmptyCheck: check(
      'embedding_models_name_not_empty_check',
      sql`length(trim(${table.name})) > 0`
    ),
    providerValuesCheck: check(
      'embedding_models_provider_values_check',
      sql`${table.provider} IN ('openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral')`
    ),
    statusCheck: check(
      'embedding_models_status_check',
      sql`${table.status} IN ('current', 'legacy', 'deprecated', 'experimental')`
    ),
    releaseYearCheck: check(
      'embedding_models_release_year_check',
      sql`${table.releaseYear} >= 2000 AND ${table.releaseYear} <= EXTRACT(YEAR FROM now())::INTEGER + 1`
    ),
    recommendedUsageNotEmptyCheck: check(
      'embedding_models_recommended_usage_not_empty_check',
      sql`length(trim(${table.recommendedUsage})) > 0`
    ),
    dimensionCheck: check(
      'embedding_models_dimension_check',
      sql`${table.dimension} IN (384, 768, 1024, 1536, 3072)`
    ),
    taskTypeValuesCheck: check(
      'embedding_models_task_type_values_check',
      sql`(${table.provider} != 'google') OR ${table.taskType} IS NULL OR ${table.taskType} IN ('RETRIEVAL_QUERY', 'RETRIEVAL_DOCUMENT', 'SEMANTIC_SIMILARITY', 'CLASSIFICATION', 'CLUSTERING') OR ${table.taskType} ~ '^[A-Z_]+$'`
    ),
    taskTypeGoogleOnlyCheck: check(
      'embedding_models_task_type_google_only_check',
      sql`(${table.provider} = 'google') OR ${table.taskType} IS NULL`
    ),
  })
)

export type DBEmbeddingModel = typeof embeddingModels.$inferInsert
export type DBEmbeddingModelSelect = typeof embeddingModels.$inferSelect

/**
 * User table: Stores user account information
 */
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
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    twoFactorSecret: text('two_factor_secret'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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

/**
 * Refresh Tokens table: Stores refresh tokens for JWT authentication
 *
 * Security features:
 * - Token hashing: Only SHA-256 hash is stored, never the raw token
 * - Token families: All tokens in a rotation chain share the same family ID for replay detection
 * - Revocation: Tokens can be explicitly revoked (logout, compromise detection)
 * - Auditing: IP address and user agent are captured at creation time
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.userId, { onDelete: 'cascade' }),
    /**
     * SHA-256 hash of the refresh token.
     * Never store the raw token - if the database is compromised, hashes are useless to attackers.
     */
    tokenHash: text('token_hash').notNull().unique(),
    /**
     * Token family ID for rotation tracking.
     * When a refresh token is used, it's revoked and a new one is issued with the same family.
     * If a revoked token is reused (replay attack), all tokens in the family are revoked.
     */
    tokenFamily: uuid('token_family').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /**
     * Updated each time the token is used to refresh an access token.
     * Useful for detecting suspicious patterns (e.g., token used from multiple locations).
     */
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    /**
     * IP address at token creation time (optional, for security auditing).
     * Stored as text because IP addresses are GDPR-masked (e.g., '192.168.1.xxx')
     * which are not valid inet values.
     */
    ipAddress: text('ip_address'),
    /**
     * User agent at token creation time (optional, for security auditing).
     */
    userAgent: text('user_agent'),
  },
  (table) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
    tokenFamilyIdx: index('refresh_tokens_token_family_idx').on(table.tokenFamily),
    /**
     * Partial index for efficient cleanup of expired, non-revoked tokens.
     * Only indexes rows where revoked_at IS NULL to reduce index size.
     */
    expiresAtIdx: index('refresh_tokens_expires_at_idx')
      .on(table.expiresAt)
      .where(sql`${table.revokedAt} IS NULL`),
  })
)

export type DBRefreshToken = typeof refreshTokens.$inferInsert
export type DBRefreshTokenSelect = typeof refreshTokens.$inferSelect

/**
 * Vector Embeddings table: Stores vector embeddings for RAG (Retrieval-Augmented Generation)
 */
export const vectorEmbeddings1536 = pgTable(
  'vector_embeddings_1536',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Identifier of the source document this chunk/embedding belongs to.
     * Foreign key to documents table.
     */
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, {
        onDelete: 'cascade',
      }),
    /**
     * Identifier of the embedding model used to generate this embedding.
     * Foreign key to embedding_models table.
     */
    embeddingModelId: uuid('embedding_model_id').notNull(),
    embeddingDimension: integer('embedding_dimension').notNull().default(1536),
    /**
     * Position of this chunk within its document, used to reconstruct ordering.
     */
    chunkIndex: integer('chunk_index').notNull().default(0),
    content: text('content').notNull(),
    /**
     * Flexible metadata about the chunk/document (page, section, author, etc.).
     * Stored as JSONB with an empty-object default for backwards compatibility.
     */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    /**
     * Vector embedding representation of the content
     * Used by:
     * OpenAI text embedding models
     *
     * Pros:
     * Excellent semantic resolution
     * Very strong RAG performance
     *
     * Cons:
     * Storage and index size grow quickly
     */
    embedding: vector('embedding', { dimension: 1536 }).notNull(),
    /**
     * Number of tokens (or characters) in each chunk.
     */
    chunkSize: integer('chunk_size').notNull().default(700),
    /**
     * Number of overlapping tokens (or characters) between consecutive chunks.
     */
    chunkOverlap: integer('chunk_overlap').notNull().default(120),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingCosineIdx: index('vector_embeddings_1536_embedding_cosine_idx').using(
      'ivfflat',
      table.embedding.asc().op('vector_cosine_ops')
    ),
    documentChunkIdx: index('vector_embeddings_1536_document_chunk_idx').on(
      table.documentId,
      table.chunkIndex
    ),
    embeddingModelIdIdx: index('vector_embeddings_1536_embedding_model_id_idx').on(
      table.embeddingModelId
    ),
    uniqueDocumentModelChunk: unique('vector_embeddings_1536_document_model_chunk_unique').on(
      table.documentId,
      table.embeddingModelId,
      table.chunkIndex
    ),
    contentLengthCheck: check(
      'vector_embeddings_1536_content_length_check',
      sql`length(${table.content}) >= 1 AND length(${table.content}) <= 50000`
    ),
    chunkParamsCheck: check(
      'vector_embeddings_1536_chunk_params_check',
      sql`${table.chunkSize} > 0 AND ${table.chunkSize} <= 50000 AND ${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`
    ),
    embeddingDimensionCheck: check(
      'vector_embeddings_1536_embedding_dimension_check',
      sql`${table.embeddingDimension} = 1536`
    ),
    embeddingModelCompositeFk: foreignKey({
      columns: [table.embeddingModelId, table.embeddingDimension],
      foreignColumns: [embeddingModels.id, embeddingModels.dimension],
    }).onDelete('restrict'),
  })
)

export type DBVectorEmbeddings1536 = typeof vectorEmbeddings1536.$inferInsert
export type DBVectorEmbeddings1536Select = typeof vectorEmbeddings1536.$inferSelect
export type DBVectorEmbeddingsSelect1536 = DBVectorEmbeddings1536Select

export const vectorEmbeddings768 = pgTable(
  'vector_embeddings_768',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Identifier of the source document this chunk/embedding belongs to.
     * Foreign key to documents table.
     */
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, {
        onDelete: 'cascade',
      }),
    /**
     * Identifier of the embedding model used to generate this embedding.
     * Foreign key to embedding_models table.
     */
    embeddingModelId: uuid('embedding_model_id').notNull(),
    embeddingDimension: integer('embedding_dimension').notNull().default(768),
    /**
     * Position of this chunk within its document, used to reconstruct ordering.
     */
    chunkIndex: integer('chunk_index').notNull().default(0),
    content: text('content').notNull(),
    /**
     * Flexible metadata about the chunk/document (page, section, author, etc.).
     * Stored as JSONB with an empty-object default for backwards compatibility.
     */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    /**
     * Used by: older SBERT models, some multilingual models
     *
     * Pros:
     * Better semantic richness than 384
     * Still relatively compact
     *
     * Cons:
     * Slightly more storage + compute
     */
    embedding: vector('embedding', { dimension: 768 }).notNull(),
    /**
     * Number of tokens (or characters) in each chunk.
     */
    chunkSize: integer('chunk_size').notNull().default(700),
    /**
     * Number of overlapping tokens (or characters) between consecutive chunks.
     */
    chunkOverlap: integer('chunk_overlap').notNull().default(120),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingCosineIdx: index('vector_embeddings_768_embedding_cosine_idx').using(
      'ivfflat',
      table.embedding.asc().op('vector_cosine_ops')
    ),
    documentChunkIdx: index('vector_embeddings_768_document_chunk_idx').on(
      table.documentId,
      table.chunkIndex
    ),
    embeddingModelIdIdx: index('vector_embeddings_768_embedding_model_id_idx').on(
      table.embeddingModelId
    ),
    uniqueDocumentModelChunk: unique('vector_embeddings_768_document_model_chunk_unique').on(
      table.documentId,
      table.embeddingModelId,
      table.chunkIndex
    ),
    contentLengthCheck: check(
      'vector_embeddings_768_content_length_check',
      sql`length(${table.content}) >= 1 AND length(${table.content}) <= 50000`
    ),
    chunkParamsCheck: check(
      'vector_embeddings_768_chunk_params_check',
      sql`${table.chunkSize} > 0 AND ${table.chunkSize} <= 50000 AND ${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`
    ),
    embeddingDimensionCheck: check(
      'vector_embeddings_768_embedding_dimension_check',
      sql`${table.embeddingDimension} = 768`
    ),
    embeddingModelCompositeFk: foreignKey({
      columns: [table.embeddingModelId, table.embeddingDimension],
      foreignColumns: [embeddingModels.id, embeddingModels.dimension],
    }).onDelete('restrict'),
  })
)

export type DBVectorEmbeddings768 = typeof vectorEmbeddings768.$inferInsert
export type DBVectorEmbeddingsSelect768 = typeof vectorEmbeddings768.$inferSelect

export const vectorEmbeddings384 = pgTable(
  'vector_embeddings_384',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Identifier of the source document this chunk/embedding belongs to.
     * Foreign key to documents table.
     */
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, {
        onDelete: 'cascade',
      }),
    /**
     * Identifier of the embedding model used to generate this embedding.
     * Foreign key to embedding_models table.
     */
    embeddingModelId: uuid('embedding_model_id').notNull(),
    // NOTE: SQL schema previously had DEFAULT 3072 / CHECK (= 3072) here — copy-paste error from vector_embeddings_3072.
    embeddingDimension: integer('embedding_dimension').notNull().default(384),
    /**
     * Position of this chunk within its document, used to reconstruct ordering.
     */
    chunkIndex: integer('chunk_index').notNull().default(0),
    content: text('content').notNull(),
    /**
     * Flexible metadata about the chunk/document (page, section, author, etc.).
     * Stored as JSONB with an empty-object default for backwards compatibility.
     */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    /**
     * Vector embedding representation of the content
     * Used by: smaller Sentence-Transformers models (e.g. all-MiniLM-L6-v2)
     *
     * Pros:
     * Fast
     * Cheap to store
     * Good enough for many semantic search / RAG tasks
     *
     * Cons:
     * Lower recall for subtle semantic distinctions
     * Typical use cases:
     * Lightweight RAG
     * High-volume search
     * Edge / cost-sensitive system
     */
    embedding: vector('embedding', { dimension: 384 }).notNull(),
    /**
     * Number of tokens (or characters) in each chunk.
     */
    chunkSize: integer('chunk_size').notNull().default(700),
    /**
     * Number of overlapping tokens (or characters) between consecutive chunks.
     */
    chunkOverlap: integer('chunk_overlap').notNull().default(120),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingCosineIdx: index('vector_embeddings_384_embedding_cosine_idx').using(
      'ivfflat',
      table.embedding.asc().op('vector_cosine_ops')
    ),
    documentChunkIdx: index('vector_embeddings_384_document_chunk_idx').on(
      table.documentId,
      table.chunkIndex
    ),
    embeddingModelIdIdx: index('vector_embeddings_384_embedding_model_id_idx').on(
      table.embeddingModelId
    ),
    uniqueDocumentModelChunk: unique('vector_embeddings_384_document_model_chunk_unique').on(
      table.documentId,
      table.embeddingModelId,
      table.chunkIndex
    ),
    contentLengthCheck: check(
      'vector_embeddings_384_content_length_check',
      sql`length(${table.content}) >= 1 AND length(${table.content}) <= 50000`
    ),
    chunkParamsCheck: check(
      'vector_embeddings_384_chunk_params_check',
      sql`${table.chunkSize} > 0 AND ${table.chunkSize} <= 50000 AND ${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`
    ),
    embeddingDimensionCheck: check(
      'vector_embeddings_384_embedding_dimension_check',
      sql`${table.embeddingDimension} = 384`
    ),
    embeddingModelCompositeFk: foreignKey({
      columns: [table.embeddingModelId, table.embeddingDimension],
      foreignColumns: [embeddingModels.id, embeddingModels.dimension],
    }).onDelete('restrict'),
  })
)

export type DBVectorEmbeddings384 = typeof vectorEmbeddings384.$inferInsert
export type DBVectorEmbeddingsSelect384 = typeof vectorEmbeddings384.$inferSelect

/**
 * Vector Embeddings table: Stores 3072-dimension vector embeddings for RAG
 */
export const vectorEmbeddings3072 = pgTable(
  'vector_embeddings_3072',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Identifier of the source document this chunk/embedding belongs to.
     * Foreign key to documents table.
     */
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, {
        onDelete: 'cascade',
      }),
    /**
     * Identifier of the embedding model used to generate this embedding.
     * Foreign key to embedding_models table.
     */
    embeddingModelId: uuid('embedding_model_id').notNull(),
    embeddingDimension: integer('embedding_dimension').notNull().default(3072),
    /**
     * Position of this chunk within its document, used to reconstruct ordering.
     */
    chunkIndex: integer('chunk_index').notNull().default(0),
    content: text('content').notNull(),
    /**
     * Flexible metadata about the chunk/document (page, section, author, etc.).
     * Stored as JSONB with an empty-object default for backwards compatibility.
     */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    /**
     * Vector embedding representation of the content.
     * Used by:
     * - OpenAI text-embedding-3-large
     * - Google gemini-embedding-001
     *
     * Pros:
     * Highest semantic resolution available
     * Best retrieval precision for complex or nuanced queries
     *
     * Cons:
     * Largest storage footprint and index size
     * Higher latency per query vs smaller dimensions
     */
    embedding: vector('embedding', { dimension: 3072 }).notNull(),
    /**
     * Number of tokens (or characters) in each chunk.
     */
    chunkSize: integer('chunk_size').notNull().default(700),
    /**
     * Number of overlapping tokens (or characters) between consecutive chunks.
     */
    chunkOverlap: integer('chunk_overlap').notNull().default(120),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingCosineIdx: index('vector_embeddings_3072_embedding_cosine_idx').using(
      'hnsw',
      sql`(embedding::halfvec(3072)) halfvec_cosine_ops`
    ),
    documentChunkIdx: index('vector_embeddings_3072_document_chunk_idx').on(
      table.documentId,
      table.chunkIndex
    ),
    embeddingModelIdIdx: index('vector_embeddings_3072_embedding_model_id_idx').on(
      table.embeddingModelId
    ),
    uniqueDocumentModelChunk: unique('vector_embeddings_3072_document_model_chunk_unique').on(
      table.documentId,
      table.embeddingModelId,
      table.chunkIndex
    ),
    contentLengthCheck: check(
      'vector_embeddings_3072_content_length_check',
      sql`length(${table.content}) >= 1 AND length(${table.content}) <= 50000`
    ),
    chunkParamsCheck: check(
      'vector_embeddings_3072_chunk_params_check',
      sql`${table.chunkSize} > 0 AND ${table.chunkSize} <= 50000 AND ${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`
    ),
    embeddingDimensionCheck: check(
      'vector_embeddings_3072_embedding_dimension_check',
      sql`${table.embeddingDimension} = 3072`
    ),
    embeddingModelCompositeFk: foreignKey({
      columns: [table.embeddingModelId, table.embeddingDimension],
      foreignColumns: [embeddingModels.id, embeddingModels.dimension],
    }).onDelete('restrict'),
  })
)

export type DBVectorEmbeddings3072 = typeof vectorEmbeddings3072.$inferInsert
export type DBVectorEmbeddingsSelect3072 = typeof vectorEmbeddings3072.$inferSelect

/**
 * Vector Embeddings table: Stores 1024-dimension vector embeddings for RAG
 */
export const vectorEmbeddings1024 = pgTable(
  'vector_embeddings_1024',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Identifier of the source document this chunk/embedding belongs to.
     * Foreign key to documents table.
     */
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, {
        onDelete: 'cascade',
      }),
    /**
     * Identifier of the embedding model used to generate this embedding.
     * Foreign key to embedding_models table.
     */
    embeddingModelId: uuid('embedding_model_id').notNull(),
    embeddingDimension: integer('embedding_dimension').notNull().default(1024),
    /**
     * Position of this chunk within its document, used to reconstruct ordering.
     */
    chunkIndex: integer('chunk_index').notNull().default(0),
    content: text('content').notNull(),
    /**
     * Flexible metadata about the chunk/document (page, section, author, etc.).
     * Stored as JSONB with an empty-object default for backwards compatibility.
     */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    /**
     * Vector embedding representation of the content.
     * Used by:
     * - Cohere embed-english-v3.0 / embed-multilingual-v3.0
     * - Amazon Titan embed-text-v2:0
     * - Voyage AI voyage-4, voyage-4-lite, voyage-code-3
     * - Mistral mistral-embed
     * - Jina jina-embeddings-v3
     *
     * Pros:
     * Strong balance of semantic quality and storage efficiency
     * Wide provider support for multilingual and code use-cases
     *
     * Cons:
     * Slightly lower resolution than 1536/3072 models
     */
    embedding: vector('embedding', { dimension: 1024 }).notNull(),
    /**
     * Number of tokens (or characters) in each chunk.
     */
    chunkSize: integer('chunk_size').notNull().default(700),
    /**
     * Number of overlapping tokens (or characters) between consecutive chunks.
     */
    chunkOverlap: integer('chunk_overlap').notNull().default(120),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingCosineIdx: index('vector_embeddings_1024_embedding_cosine_idx').using(
      'ivfflat',
      table.embedding.asc().op('vector_cosine_ops')
    ),
    documentChunkIdx: index('vector_embeddings_1024_document_chunk_idx').on(
      table.documentId,
      table.chunkIndex
    ),
    embeddingModelIdIdx: index('vector_embeddings_1024_embedding_model_id_idx').on(
      table.embeddingModelId
    ),
    uniqueDocumentModelChunk: unique('vector_embeddings_1024_document_model_chunk_unique').on(
      table.documentId,
      table.embeddingModelId,
      table.chunkIndex
    ),
    contentLengthCheck: check(
      'vector_embeddings_1024_content_length_check',
      sql`length(${table.content}) >= 1 AND length(${table.content}) <= 50000`
    ),
    chunkParamsCheck: check(
      'vector_embeddings_1024_chunk_params_check',
      sql`${table.chunkSize} > 0 AND ${table.chunkSize} <= 50000 AND ${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`
    ),
    embeddingDimensionCheck: check(
      'vector_embeddings_1024_embedding_dimension_check',
      sql`${table.embeddingDimension} = 1024`
    ),
    embeddingModelCompositeFk: foreignKey({
      columns: [table.embeddingModelId, table.embeddingDimension],
      foreignColumns: [embeddingModels.id, embeddingModels.dimension],
    }).onDelete('restrict'),
  })
)

export type DBVectorEmbeddings1024 = typeof vectorEmbeddings1024.$inferInsert
export type DBVectorEmbeddingsSelect1024 = typeof vectorEmbeddings1024.$inferSelect

/**
 * Chat Types table: Stores reusable chat templates/configurations
 */
export const chatTypes = pgTable(
  'chat_types',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text('name').notNull().unique(),
    seoFriendlyId: citext('seo_friendly_id').notNull().unique(),
    seoFriendlyBase64Id: text('seo_friendly_base64_id').notNull().unique(),
    description: text('description').notNull(),
    rag: boolean('rag').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('chat_types_name_idx').on(table.name),
    nameLengthCheck: check(
      'chat_types_name_length_check',
      sql`length(${table.name}) >= 1 AND length(${table.name}) <= 200`
    ),
    seoFriendlyIdLengthCheck: check(
      'chat_types_seo_friendly_id_length_check',
      sql`length(${table.seoFriendlyId}) >= 1 AND length(${table.seoFriendlyId}) <= 200 AND ${table.seoFriendlyId} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
    seoFriendlyBase64IdLengthCheck: check(
      'chat_types_seo_friendly_base64_id_length_check',
      sql`length(${table.seoFriendlyBase64Id}) = 22`
    ),
    descriptionLengthCheck: check(
      'chat_types_description_length_check',
      sql`length(${table.description}) >= 1 AND length(${table.description}) <= 500`
    ),
  })
)

export type DBChatType = typeof chatTypes.$inferInsert
export type DBChatTypeSelect = typeof chatTypes.$inferSelect

/**
 * Chats table: Stores individual user chat sessions
 */
export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey(), // Generated in frontend
    userId: uuid('user_id')
      .notNull()
      .references(() => user.userId, { onDelete: 'cascade' }),
    chatTypeId: uuid('chat_type_id')
      .notNull()
      .references(() => chatTypes.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('chats_user_id_idx').on(table.userId),
    userIdUpdatedAtIdx: index('chats_user_id_updated_at_idx').on(
      table.userId,
      sql`${table.updatedAt} DESC`
    ),
    chatTypeIdIdx: index('chats_chat_type_id_idx').on(table.chatTypeId),
  })
)

/**
 * Messages table: Stores individual messages within chats
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    role: varchar('role').notNull(),
  },
  (table) => ({
    chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
    chatIdCreatedAtIdx: index('messages_chat_id_created_at_idx').on(table.chatId, table.createdAt),
    roleLengthCheck: check('role_length_check', sql`char_length(${table.role}) <= 15`),
  })
)

export type DBMessage = typeof messages.$inferInsert
export type DBMessageSelect = typeof messages.$inferSelect

/**
 * AI options table: Stores model configuration parameters for each chat type
 */
export const chatAiOptions = pgTable(
  'chat_ai_options',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    chatTypeId: uuid('chat_type_id')
      .notNull()
      .unique()
      .references(() => chatTypes.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    maxTokens: integer('max_tokens'),
    temperature: numeric('temperature'),
    topP: numeric('top_p'),
    frequencyPenalty: numeric('frequency_penalty'),
    presencePenalty: numeric('presence_penalty'),
    topK: integer('top_k'),
    stopSequences: text('stop_sequences').array(),
    maxRetries: integer('max_retries'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    chatTypeIdIdx: uniqueIndex('chat_ai_options_chat_type_id_idx').on(table.chatTypeId),
    maxTokensCheck: check(
      'max_tokens_check',
      sql`${table.maxTokens} IS NULL OR (${table.maxTokens} > 0 AND ${table.maxTokens} <= 100000)`
    ),
    temperatureRange: check(
      'temperature_range',
      sql`${table.temperature} IS NULL OR (${table.temperature} >= 0 AND ${table.temperature} <= 2)`
    ),
    topPRange: check(
      'top_p_range',
      sql`${table.topP} IS NULL OR (${table.topP} >= 0 AND ${table.topP} <= 1)`
    ),
    frequencyPenaltyRange: check(
      'frequency_penalty_range',
      sql`${table.frequencyPenalty} IS NULL OR (${table.frequencyPenalty} >= -2 AND ${table.frequencyPenalty} <= 2)`
    ),
    presencePenaltyRange: check(
      'presence_penalty_range',
      sql`${table.presencePenalty} IS NULL OR (${table.presencePenalty} >= -2 AND ${table.presencePenalty} <= 2)`
    ),
    topKCheck: check(
      'top_k_check',
      sql`${table.topK} IS NULL OR (${table.topK} > 0 AND ${table.topK} <= 100)`
    ),
    maxRetriesCheck: check(
      'max_retries_check',
      sql`${table.maxRetries} IS NULL OR (${table.maxRetries} >= 0 AND ${table.maxRetries} <= 10)`
    ),
  })
)

export type DBChatAiOptions = typeof chatAiOptions.$inferInsert
export type DBChatAiOptionsSelect = typeof chatAiOptions.$inferSelect

/**
 * Parts table: Stores message parts with polymorphic structure based on type field
 * Type discriminator values: text, reasoning, file, source_url, source_document,
 * step-start, data (for custom data parts - currently supports darkness, extensible for weather, etc.)
 */
export const parts = pgTable(
  'parts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    type: varchar('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    order: integer('order').notNull().default(0),

    // Text fields
    textText: text('text_text'),

    // Reasoning fields
    reasoningText: text('reasoning_text'),

    // File fields
    fileMediaType: varchar('file_media_type'),
    fileFilename: varchar('file_filename'),
    fileUrl: varchar('file_url'),

    // Source URL fields
    sourceUrlSourceId: varchar('source_url_source_id'),
    sourceUrlUrl: varchar('source_url_url'),
    sourceUrlTitle: varchar('source_url_title'),

    // Source document fields
    sourceDocumentSourceId: varchar('source_document_source_id'),
    sourceDocumentMediaType: varchar('source_document_media_type'),
    sourceDocumentTitle: varchar('source_document_title'),
    sourceDocumentFilename: varchar('source_document_filename'),

    // Shared tool call columns
    toolToolCallId: varchar('tool_tool_call_id'),
    toolState: varchar('tool_state'),
    toolErrorText: varchar('tool_error_text'),

    // Tool-specific fields for heartOfDarknessQA
    toolHeartOfDarknessQAInput: jsonb('tool_heart_of_darkness_qa_input'),
    toolHeartOfDarknessQAOutput: jsonb('tool_heart_of_darkness_qa_output'),
    toolHeartOfDarknessQAErrorText: varchar('tool_heart_of_darkness_qa_error_text'),

    // Data part fields (for custom data parts)
    dataContent: jsonb('data_content'),

    // Provider metadata
    providerMetadata: jsonb('provider_metadata'),
  },
  (table) => ({
    messageIdIdx: index('parts_message_id_idx').on(table.messageId),
    messageIdOrderIdx: index('parts_message_id_order_idx').on(table.messageId, table.order),
    textTextRequiredIfTypeIsText: check(
      'text_text_required_if_type_is_text',
      sql`CASE WHEN ${table.type} = 'text' THEN ${table.textText} IS NOT NULL ELSE TRUE END`
    ),
    reasoningTextRequiredIfTypeIsReasoning: check(
      'reasoning_text_required_if_type_is_reasoning',
      sql`CASE WHEN ${table.type} = 'reasoning' THEN ${table.reasoningText} IS NOT NULL ELSE TRUE END`
    ),
    fileFieldsRequiredIfTypeIsFile: check(
      'file_fields_required_if_type_is_file',
      sql`CASE WHEN ${table.type} = 'file' THEN ${table.fileMediaType} IS NOT NULL AND ${table.fileUrl} IS NOT NULL ELSE TRUE END`
    ),
    sourceUrlFieldsRequiredIfTypeIsSourceUrl: check(
      'source_url_fields_required_if_type_is_source_url',
      sql`CASE WHEN ${table.type} = 'source_url' THEN ${table.sourceUrlSourceId} IS NOT NULL AND ${table.sourceUrlUrl} IS NOT NULL ELSE TRUE END`
    ),
    sourceDocumentFieldsRequiredIfTypeIsSourceDocument: check(
      'source_document_fields_required_if_type_is_source_document',
      sql`CASE WHEN ${table.type} = 'source_document' THEN ${table.sourceDocumentSourceId} IS NOT NULL AND ${table.sourceDocumentMediaType} IS NOT NULL AND ${table.sourceDocumentTitle} IS NOT NULL ELSE TRUE END`
    ),
    dataContentRequiredIfTypeIsData: check(
      'data_content_required_if_type_is_data',
      sql`CASE WHEN ${table.type} = 'data' THEN ${table.dataContent} IS NOT NULL ELSE TRUE END`
    ),
  })
)

/**
 * Audit log table: Tracks all significant actions and changes across the system
 * for security and compliance
 */
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
    /**
     * IP address stored as text because IP addresses are GDPR-masked
     * (e.g., '192.168.1.xxx') which are not valid inet values.
     */
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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

export const chatTypesRelations = relations(chatTypes, ({ many, one }) => ({
  chatAiOptions: one(chatAiOptions, {
    fields: [chatTypes.id],
    references: [chatAiOptions.chatTypeId],
  }),
  chats: many(chats),
}))

export const chatsRelations = relations(chats, ({ many, one }) => ({
  messages: many(messages),
  chatType: one(chatTypes, {
    fields: [chats.chatTypeId],
    references: [chatTypes.id],
  }),
}))

export const messagesRelations = relations(messages, ({ many, one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  parts: many(parts),
}))

export const partsRelations = relations(parts, ({ one }) => ({
  message: one(messages, {
    fields: [parts.messageId],
    references: [messages.id],
  }),
}))

export const chatAiOptionsRelations = relations(chatAiOptions, ({ one }) => ({
  chatType: one(chatTypes, {
    fields: [chatAiOptions.chatTypeId],
    references: [chatTypes.id],
  }),
}))

export const documentsRelations = relations(documents, ({ many }) => ({
  vectorEmbeddings1536: many(vectorEmbeddings1536),
  vectorEmbeddings768: many(vectorEmbeddings768),
  vectorEmbeddings384: many(vectorEmbeddings384),
}))

export const embeddingModelsRelations = relations(embeddingModels, ({ many }) => ({
  vectorEmbeddings1536: many(vectorEmbeddings1536),
  vectorEmbeddings768: many(vectorEmbeddings768),
  vectorEmbeddings384: many(vectorEmbeddings384),
}))

export const vectorEmbeddings1536Relations = relations(vectorEmbeddings1536, ({ one }) => ({
  document: one(documents, {
    fields: [vectorEmbeddings1536.documentId],
    references: [documents.id],
  }),
  embeddingModel: one(embeddingModels, {
    fields: [vectorEmbeddings1536.embeddingModelId],
    references: [embeddingModels.id],
  }),
}))

export const vectorEmbeddings768Relations = relations(vectorEmbeddings768, ({ one }) => ({
  document: one(documents, {
    fields: [vectorEmbeddings768.documentId],
    references: [documents.id],
  }),
  embeddingModel: one(embeddingModels, {
    fields: [vectorEmbeddings768.embeddingModelId],
    references: [embeddingModels.id],
  }),
}))

export const vectorEmbeddings384Relations = relations(vectorEmbeddings384, ({ one }) => ({
  document: one(documents, {
    fields: [vectorEmbeddings384.documentId],
    references: [documents.id],
  }),
  embeddingModel: one(embeddingModels, {
    fields: [vectorEmbeddings384.embeddingModelId],
    references: [embeddingModels.id],
  }),
}))

export type MyDBUIMessagePart = typeof parts.$inferInsert
export type MyDBUIMessagePartSelect = typeof parts.$inferSelect
