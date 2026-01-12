import { relations, sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  inet,
  index,
  check,
  customType,
  numeric,
  pgEnum,
  boolean,
  date,
  uniqueIndex,
  char,
} from 'drizzle-orm/pg-core'

// Define CITEXT custom type for case-insensitive text
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})

export const customerStatusEnum = pgEnum('customer_status', [
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
 * Customers table: Stores customer information
 */

export const customers = pgTable(
  'customers',
  {
    customerId: uuid('user_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    legalName: text('legal_name').notNull(),
    displayName: text('display_name').notNull(),
    status: customerStatusEnum('status').notNull().default('prospect'),
    industry: text('industry'),
    companySize: integer('company_size'),
    websiteUrl: text('website_url'),
    billingCountry: char('billing_country', { length: 2 }),
    timezone: text('timezone').notNull().default('UTC'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    legalNameLengthCheck: check(
      'customers_legal_name_length_check',
      sql`length(trim(${table.legalName})) BETWEEN 2 AND 200`
    ),
    displayNameLengthCheck: check(
      'customers_display_name_length_check',
      sql`length(trim(${table.displayName})) BETWEEN 2 AND 200`
    ),
    industryLengthCheck: check(
      'customers_industry_length_check',
      sql`${table.industry} IS NULL OR length(${table.industry}) <= 100`
    ),
    companySizeCheck: check(
      'customers_company_size_check',
      sql`${table.companySize} IS NULL OR ${table.companySize} > 0`
    ),
    websiteUrlFormatCheck: check(
      'customers_website_url_format_check',
      sql`${table.websiteUrl} IS NULL OR ${table.websiteUrl} ~* '^https?://'`
    ),
    billingCountryFormatCheck: check(
      'customers_billing_country_format_check',
      sql`${table.billingCountry} IS NULL OR ${table.billingCountry} ~ '^[A-Z]{2}$'`
    ),
  })
)

/**
 * People table: Stores contacts associated with customers
 */

export const people = pgTable(
  'people',
  {
    personId: uuid('user_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    jobTitle: text('job_title'),
    linkedinUrl: text('linkedin_url'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Note: updatedAt is automatically maintained by a database trigger (see norberts_schema.sql).
    // The defaultNow() here only sets the initial value on INSERT.
    // On UPDATE operations, the touch_updated_at() trigger function automatically updates this column.
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEmail: uniqueIndex('people_unique_email').on(table.email),
    firstNameLengthCheck: check(
      'people_first_name_length_check',
      sql`length(trim(${table.firstName})) BETWEEN 1 AND 100`
    ),
    lastNameLengthCheck: check(
      'people_last_name_length_check',
      sql`length(trim(${table.lastName})) BETWEEN 1 AND 100`
    ),
    emailFormatCheck: check(
      'people_email_format_check',
      sql`${table.email} IS NULL OR ${table.email} ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`
    ),
    phoneLengthCheck: check(
      'people_phone_length_check',
      sql`${table.phone} IS NULL OR length(${table.phone}) <= 30`
    ),
    jobTitleLengthCheck: check(
      'people_job_title_length_check',
      sql`${table.jobTitle} IS NULL OR length(${table.jobTitle}) <= 100`
    ),
    linkedinUrlFormatCheck: check(
      'people_linkedin_url_format_check',
      sql`${table.linkedinUrl} IS NULL OR ${table.linkedinUrl} ~ '^https?://(www\\.)?linkedin\\.com/.*$'`
    ),
  })
)

/**
 * Customer - People join table
 */

export const customerPeople = pgTable(
  'customer_people',
  {
    customerPersonId: uuid('customer_person_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.customerId, {
        onDelete: 'cascade',
      }),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.personId, {
        onDelete: 'cascade',
      }),
    role: contactRoleEnum('role').notNull(),
    isPrimary: boolean('is_primary').default(false),
    startDate: date('start_date').notNull().defaultNow(),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCustomerPersonRole: uniqueIndex('customer_people_unique').on(
      table.customerId,
      table.personId,
      table.role
    ),
    onePrimaryPerCustomer: uniqueIndex('one_primary_contact_per_customer')
      .on(table.customerId)
      .where(sql`is_primary = true`),
    endDateAfterStartDate: check(
      'customer_people_end_date_check',
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  })
)

/**
 * Relations
 */

export const customerRelations = relations(customers, ({ many }) => ({
  contacts: many(customerPeople),
}))

export const personRelations = relations(people, ({ many }) => ({
  customers: many(customerPeople),
}))

export const customerPeopleRelations = relations(customerPeople, ({ one }) => ({
  customer: one(customers, {
    fields: [customerPeople.customerId],
    references: [customers.customerId],
  }),
  person: one(people, {
    fields: [customerPeople.personId],
    references: [people.personId],
  }),
}))

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

/**
 * Chats table: Stores chat sessions linked to users
 */
export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.userId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    // Note: For the chats table, updatedAt must be manually updated by application code.
    // Unlike customers and people tables, there is no database trigger for this table.
    // The default(sql`now()`) here only sets the initial value on INSERT.
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('chats_user_id_idx').on(table.userId),
    userIdUpdatedAtIdx: index('chats_user_id_updated_at_idx').on(
      table.userId,
      sql`${table.updatedAt} DESC`
    ),
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
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
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
 * AI Options table: Stores AI generation parameters for each message
 */
export const aiOptions = pgTable(
  'ai_options',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    maxOutputTokens: integer('max_tokens').notNull(),
    temperature: numeric('temperature').notNull(),
    topP: numeric('top_p').notNull(),
    frequencyPenalty: numeric('frequency_penalty').notNull(),
    presencePenalty: numeric('presence_penalty').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    messageIdIdx: index('ai_options_message_id_idx').on(table.messageId),
    maxTokensCheck: check('max_tokens_check', sql`${table.maxOutputTokens} > 0`),
    temperatureRange: check(
      'temperature_range',
      sql`${table.temperature} >= 0 AND ${table.temperature} <= 2`
    ),
    topPRange: check('top_p_range', sql`${table.topP} >= 0 AND ${table.topP} <= 1`),
    frequencyPenaltyRange: check(
      'frequency_penalty_range',
      sql`${table.frequencyPenalty} >= -2 AND ${table.frequencyPenalty} <= 2`
    ),
    presencePenaltyRange: check(
      'presence_penalty_range',
      sql`${table.presencePenalty} >= -2 AND ${table.presencePenalty} <= 2`
    ),
  })
)

export type DBAIOptions = typeof aiOptions.$inferInsert
export type DBAIOptionsSelect = typeof aiOptions.$inferSelect

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
    entityId: uuid('entity_id'),
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

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  parts: many(parts),
  aiOptions: one(aiOptions, {
    fields: [messages.id],
    references: [aiOptions.messageId],
  }),
}))

export const partsRelations = relations(parts, ({ one }) => ({
  message: one(messages, {
    fields: [parts.messageId],
    references: [messages.id],
  }),
}))

export const aiOptionsRelations = relations(aiOptions, ({ one }) => ({
  message: one(messages, {
    fields: [aiOptions.messageId],
    references: [messages.id],
  }),
}))

export type MyDBUIMessagePart = typeof parts.$inferInsert
export type MyDBUIMessagePartSelect = typeof parts.$inferSelect
