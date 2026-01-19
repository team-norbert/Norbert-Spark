import { relations, sql } from 'drizzle-orm'
import { pgTable, uuid, varchar, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core'
import { z } from 'zod'

export const pdfSchema = z
  .object({
    total: z.number().describe('The total amount of the invoice.'),
    currency: z.string().describe('The currency of the total amount.'),
    invoiceNumber: z.string().describe('The invoice number.'),
    companyAddress: z
      .string()
      .describe('The address of the company or person issuing the invoice.'),
    companyName: z.string().describe('The name of the company issuing the invoice.'),
    invoiceeAddress: z
      .string()
      .describe('The address of the company or person receiving the invoice.'),
  })
  .describe('The extracted data from the invoice.')

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
