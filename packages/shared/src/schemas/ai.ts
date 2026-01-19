import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, integer, index, check, numeric } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { messages } from './chat.js'

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
    maxOutputTokens: integer('max_tokens'),
    temperature: numeric('temperature'),
    topP: numeric('top_p'),
    frequencyPenalty: numeric('frequency_penalty'),
    presencePenalty: numeric('presence_penalty'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    messageIdIdx: index('ai_options_message_id_idx').on(table.messageId),
    maxTokensCheck: check(
      'max_tokens_check',
      sql`${table.maxOutputTokens} IS NULL OR ${table.maxOutputTokens} > 0`
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
      sql`${table.presencePenalty} >= -2 AND ${table.presencePenalty} <= 2`
    ),
  })
)

export type DBAIOptions = typeof aiOptions.$inferInsert
export type DBAIOptionsSelect = typeof aiOptions.$inferSelect

export const AISummarySchema = z.object({
  id: z.string(),
  prompt: z.string(),
  createdAt: z.coerce.date().optional(),
})

export const AIListSchema = z.array(AISummarySchema)

export const AISummaryWithUsageSchema = AISummarySchema.extend({
  usageCount: z.number(),
})

export const AIListWithUsageSchema = z.array(AISummaryWithUsageSchema)
export const AIUsageSchema = z.object({
  aiId: z.string(),
  usageCount: z.number(),
})

export const AIUsageListSchema = z.array(AIUsageSchema)

export const AIModelsSchema = z.array(z.string())

export const AIRequestSchema = z.object({
  prompt: z.string().min(1, { message: 'Prompt is required' }),
})

// Streaming event schemas for SSE responses
export const StreamEventStartSchema = z.object({
  type: z.literal('start'),
})

export const StreamEventStartStepSchema = z.object({
  type: z.literal('start-step'),
})

export const StreamEventTextStartSchema = z.object({
  type: z.literal('text-start'),
  id: z.string(),
})

export const StreamEventTextDeltaSchema = z.object({
  type: z.literal('text-delta'),
  id: z.string(),
  delta: z.string(),
})

export const StreamEventTextEndSchema = z.object({
  type: z.literal('text-end'),
  id: z.string(),
})

export const StreamEventToolInputStartSchema = z.object({
  type: z.literal('tool-input-start'),
  toolCallId: z.string(),
  toolName: z.string(),
})

export const StreamEventToolInputDeltaSchema = z.object({
  type: z.literal('tool-input-delta'),
  toolCallId: z.string(),
  inputTextDelta: z.string(),
})

export const StreamEventToolInputAvailableSchema = z.object({
  type: z.literal('tool-input-available'),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.record(z.string(), z.unknown()),
})

export const StreamEventToolOutputAvailableSchema = z.object({
  type: z.literal('tool-output-available'),
  toolCallId: z.string(),
  output: z.unknown(),
})

export const StreamEventFinishStepSchema = z.object({
  type: z.literal('finish-step'),
})

export const StreamEventFinishSchema = z.object({
  type: z.literal('finish'),
  finishReason: z.enum(['stop', 'length', 'content-filter', 'tool-calls', 'error', 'other']),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
})

// Union type for all possible stream events
export const StreamEventSchema = z.discriminatedUnion('type', [
  StreamEventStartSchema,
  StreamEventStartStepSchema,
  StreamEventTextStartSchema,
  StreamEventTextDeltaSchema,
  StreamEventTextEndSchema,
  StreamEventToolInputStartSchema,
  StreamEventToolInputDeltaSchema,
  StreamEventToolInputAvailableSchema,
  StreamEventToolOutputAvailableSchema,
  StreamEventFinishStepSchema,
  StreamEventFinishSchema,
])

export const MessagePartSchema = z.object({
  type: z.enum([
    'text',
    'reasoning',
    'file',
    'source_url',
    'source_document',
    'step-start',
    'data',
    'tool-heartOfDarknessQA',
  ]),
  text: z.string().optional(),
  state: z.enum(['done', 'output-available']).optional(),
})

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(MessagePartSchema),
})

export const AIReturnedResponseSchema = z.object({
  id: z.uuid(),
  messages: z.array(MessageSchema),
  trigger: z.string(),
})

export const AIUserIdResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.uuid()),
})

export const AIFetchChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.uuid(),
    messages: z.array(MessageSchema),
  }),
})

export const metadataSchema = z.object({})

//TODO: define proper metadata schema
export type MyMetadata = z.infer<typeof metadataSchema>

export type AISummaryWithUsageSchemaType = z.infer<typeof AISummaryWithUsageSchema>
export type AISummarySchemaType = z.infer<typeof AISummarySchema>
export type AIListSchemaType = z.infer<typeof AIListSchema>
export type AIUsageSchemaType = z.infer<typeof AIUsageSchema>
export type AIUsageListSchemaType = z.infer<typeof AIUsageListSchema>
export type AIReturnedResponseSchemaType = z.infer<typeof AIReturnedResponseSchema>
export type AIUserIdResponseSchemaType = z.infer<typeof AIUserIdResponseSchema>
export type AIFetchChatResponseSchemaType = z.infer<typeof AIFetchChatResponseSchema>
export type AIListWithUsageSchemaType = z.infer<typeof AIListWithUsageSchema>
export type AIModelsSchemaType = z.infer<typeof AIModelsSchema>
export type AIRequestSchemaType = z.infer<typeof AIRequestSchema>
export type MessagePartSchemaType = z.infer<typeof MessagePartSchema>
export type MessageSchemaType = z.infer<typeof MessageSchema>
export type StreamEventSchemaType = z.infer<typeof StreamEventSchema>
export type StreamEventStartSchemaType = z.infer<typeof StreamEventStartSchema>
export type StreamEventStartStepSchemaType = z.infer<typeof StreamEventStartStepSchema>
export type StreamEventTextStartSchemaType = z.infer<typeof StreamEventTextStartSchema>
export type StreamEventTextDeltaSchemaType = z.infer<typeof StreamEventTextDeltaSchema>
export type StreamEventTextEndSchemaType = z.infer<typeof StreamEventTextEndSchema>
export type StreamEventToolInputStartSchemaType = z.infer<typeof StreamEventToolInputStartSchema>
export type StreamEventToolInputDeltaSchemaType = z.infer<typeof StreamEventToolInputDeltaSchema>
export type StreamEventToolInputAvailableSchemaType = z.infer<
  typeof StreamEventToolInputAvailableSchema
>
export type StreamEventToolOutputAvailableSchemaType = z.infer<
  typeof StreamEventToolOutputAvailableSchema
>
export type StreamEventFinishStepSchemaType = z.infer<typeof StreamEventFinishStepSchema>
export type StreamEventFinishSchemaType = z.infer<typeof StreamEventFinishSchema>
