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
