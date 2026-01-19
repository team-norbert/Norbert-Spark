import { relations, sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  check,
  pgEnum,
  boolean,
  date,
  uniqueIndex,
  unique,
  char,
} from 'drizzle-orm/pg-core'

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
    uniqueEmail: unique('people_unique_email').on(table.email),
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
      sql`${table.linkedinUrl} IS NULL OR ${table.linkedinUrl} ~* '^https?://(www\\.)?linkedin\\.com/.*$'`
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

export type DBCustomer = typeof customers.$inferInsert
export type DBCustomerSelect = typeof customers.$inferSelect

export type DBPerson = typeof people.$inferInsert
export type DBPersonSelect = typeof people.$inferSelect

export type DBCustomerPerson = typeof customerPeople.$inferInsert
export type DBCustomerPersonSelect = typeof customerPeople.$inferSelect
