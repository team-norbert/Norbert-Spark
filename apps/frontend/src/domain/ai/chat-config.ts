import { z } from 'zod'

/**
 * Schema for AI Chat Type configuration
 * Matches the backend response structure (camelCase from Drizzle ORM)
 */
export const ChatTypeSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  seoFriendlyId: z.string().min(1).max(200),
  // URL-safe Base64-encoded UUID without padding; always 22 characters
  seoFriendlyBase64Id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{22}$/, 'URL-safe Base64 (22 chars, no padding)'),
})

export type ChatType = z.infer<typeof ChatTypeSchema>

/**
 * Schema for the AI Chat Options API response
 */
export const AIChatOptionsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ChatTypeSchema),
})

export type AIChatOptionsResponse = z.infer<typeof AIChatOptionsResponseSchema>

/**
 * Schema for AI Chat Option Settings (individual chat configuration)
 */
export const AIChatOptionSettingsSchema = z.object({
  id: z.string().uuid(),
  chatTypeId: z.string().uuid(),
  prompt: z.string(),
  maxTokens: z.number().int().min(1).max(100000).nullable(),
  temperature: z.number().min(0).max(2).nullable(),
  topP: z.number().min(0).max(1).nullable(),
  frequencyPenalty: z.number().min(-2).max(2).nullable(),
  presencePenalty: z.number().min(-2).max(2).nullable(),
  topK: z.number().int().min(1).nullable(),
  stopSequences: z.array(z.string()).nullable(),
  seed: z.number().int().nullable(),
  maxRetries: z.number().int().min(0).max(10).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type AIChatOptionSettings = z.infer<typeof AIChatOptionSettingsSchema>

/**
 * Schema for the AI Chat Option Settings API response
 */
export const AIChatOptionSettingsResponseSchema = z.object({
  success: z.boolean(),
  data: AIChatOptionSettingsSchema,
})

export type AIChatOptionSettingsResponse = z.infer<typeof AIChatOptionSettingsResponseSchema>
