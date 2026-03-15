import { isArray, isDefined, isObject, isString } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import {
  PromptInjectionGuard,
  type PromptRiskAssessment,
} from '../../shared/utils/prompt-injection-guard.utils.js'

/**
 * Represents a single part of a chat message.
 *
 * The AI SDK v5 UIMessage format produces several part kinds:
 * - `"text"` — plain text fragment
 * - `"step-start"` — marks the beginning of a reasoning step
 * - `"tool-{toolName}"` — a tool invocation (e.g. `"tool-heartOfDarknessQA"`)
 *
 * Additional provider-specific fields (e.g. `providerMetadata`, `toolCallId`,
 * `input`, `output`) are carried through as `Record<string, unknown>` so the
 * backend can forward them without loss.
 */
export type PostChatMessagePart = {
  /**
   * Discriminator for the part kind. Well-known values are `"text"` and
   * `"step-start"`; tool invocation parts use `"tool-{toolName}"`.
   */
  type: string
  /** Text content — present on `"text"` parts. */
  text?: string
  /** Lifecycle state — present on `"step-start"` and tool invocation parts. */
  state?: string
  /** Remaining AI SDK fields (toolCallId, input, output, providerMetadata, …). */
  [key: string]: unknown
}

/**
 * Represents a single message in a chat conversation.
 *
 * Each message belongs to either the user or the AI assistant and contains an
 * ordered list of content parts.
 */
export type PostChatMessage = {
  /** Unique identifier for the message, e.g. `"Z9HbJCTLArucKCzf"`. */
  id: string
  /** Who authored this message. */
  role: 'user' | 'assistant'
  /** Ordered content fragments that make up the message body. */
  parts: PostChatMessagePart[]
}

/**
 * A prompt injection risk assessment result enriched with the source message
 * context. Produced by {@link PostChatDto.validate} for every user-role message
 * whose text parts trigger one or more classifier patterns.
 *
 * Only `flag` and `block` decisions are surfaced here — `allow` assessments are
 * discarded so the array stays small.
 */
export type PostChatPromptAssessment = PromptRiskAssessment & {
  /** Zero-based index of the message within the `messages` array. */
  messageIndex: number
  /** The `id` field of the assessed message. */
  messageId: string
}

/**
 * Data Transfer Object for `POST /ai/chat` requests.
 *
 * Validates and encapsulates the body of an AI chat request as described by the
 * `AIRequest` schema in the OpenAPI specification. The schema imposes an `anyOf`
 * constraint: at least one of `chatTypeParam` or `chatTypeId` must be present.
 *
 * Always construct instances through {@link PostChatDto.validate} — it enforces
 * all field-level and cross-field rules before returning a valid object.
 *
 * @example
 * ```typescript
 * // Valid request with chatTypeParam
 * const dto = PostChatDto.validate({
 *   id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
 *   messages: [
 *     { id: 'abc', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
 *   ],
 *   trigger: 'submit-message',
 *   chatTypeParam: 'heart-darkness',
 * })
 *
 * // Valid request with chatTypeId UUID
 * const dto = PostChatDto.validate({
 *   id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
 *   messages: [],
 *   trigger: 'submit-message',
 *   chatTypeId: '019c6003-28df-722a-a79d-0ce2b2f826df',
 * })
 * ```
 */
export class PostChatDto {
  /**
   * Creates a `PostChatDto` instance.
   *
   * Prefer {@link PostChatDto.validate} over calling this constructor directly
   * — it validates all fields and enforces cross-field rules before construction.
   *
   * @param id - The UUID of the chat session (UUIDv7 format).
   * @param messages - The full message history for this request.
   * @param trigger - Machine-readable identifier for the action that triggered
   *   this request (e.g. `"submit-message"`).
   * @param chatTypeParam - A flexible chat-type identifier (UUID, SEO slug, or
   *   base64 ID) extracted from the URL. Mutually optional with `chatTypeId`
   *   but at least one must be supplied.
   * @param chatTypeId - The direct UUID of the chat type. Mutually optional with
   *   `chatTypeParam` but at least one must be supplied.
   * @param promptRiskAssessments - Prompt injection risk assessments for user
   *   messages that scored above the `allow` threshold (`flag` or `block`).
   *   Empty when all user messages were classified as safe.
   */
  constructor(
    /**
     * The UUID of the chat session.
     *
     * @example '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a'
     */
    public readonly id: string,
    /**
     * Ordered list of messages exchanged in this conversation.
     */
    public readonly messages: PostChatMessage[],
    /**
     * Machine-readable identifier for the action that triggered this AI request.
     *
     * @example 'submit-message'
     */
    public readonly trigger: string,
    /**
     * Flexible chat-type identifier: UUID, SEO slug, or base64 ID.
     * Resolved to a UUID by the backend. Undefined when `chatTypeId` is used.
     *
     * @example 'heart-darkness'
     * @example '019c6003-28df-722a-a79d-0ce2b2f826df'
     * @example 'AZxgAyjfciqnnQzisvgm3w'
     */
    public readonly chatTypeParam: string | undefined,
    /**
     * Direct UUID of the chat type. Undefined when `chatTypeParam` is used.
     *
     * @example '019c6003-28df-722a-a79d-0ce2b2f826df'
     */
    public readonly chatTypeId: string | undefined,
    /**
     * Prompt injection risk assessments for any user message that scored above
     * the `allow` threshold. The controller reads this to write audit log entries
     * and reject `block`-level messages before they reach the AI.
     */
    public readonly promptRiskAssessments: PostChatPromptAssessment[]
  ) {}

  /**
   * Parses and validates a raw AI chat request payload into a {@link PostChatDto}.
   *
   * Validation rules (applied in order):
   * 1. `data` must be a non-null object.
   * 2. `id` must be a non-empty string.
   * 3. `trigger` must be a non-empty string.
   * 4. `messages` must be an array.
   * 5. Each message must be an object with:
   *    - `id`: non-empty string
   *    - `role`: `"user"` or `"assistant"`
   *    - `parts`: array of part objects, each with:
   *      - `type`: `"text"` or `"step-start"`
   *      - `text` (optional): string
   *      - `state` (optional): `"done"`
   * 6. At least one of `chatTypeParam` or `chatTypeId` must be a non-empty string
   *    (the `anyOf` constraint from the OpenAPI spec).
   *
   * @param data - Raw request body conforming to the `AIRequest` OpenAPI schema.
   * @returns A new `PostChatDto` with all fields validated.
   *
   * @throws {TypeException} When `data` is not a non-null object.
   * @throws {ValidationException} When `id` is missing or not a non-empty string.
   * @throws {ValidationException} When `trigger` is missing or not a non-empty string.
   * @throws {ValidationException} When `messages` is missing or not an array.
   * @throws {ValidationException} When any message or part fails structural validation.
   * @throws {ValidationException} When neither `chatTypeParam` nor `chatTypeId`
   *   is provided as a non-empty string.
   *
   * @example
   * ```typescript
   * // Happy path
   * const dto = PostChatDto.validate({
   *   id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
   *   messages: [{ id: 'x', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
   *   trigger: 'submit-message',
   *   chatTypeParam: 'heart-darkness',
   * })
   *
   * // Throws TypeException — not an object
   * PostChatDto.validate(null)
   *
   * // Throws ValidationException — missing both chat type identifiers
   * PostChatDto.validate({ id: 'x', messages: [], trigger: 'go' })
   *
   * // Throws ValidationException — invalid role
   * PostChatDto.validate({
   *   id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
   *   messages: [{ id: 'x', role: 'system', parts: [] }],
   *   trigger: 'submit-message',
   *   chatTypeParam: 'heart-darkness',
   * })
   * ```
   */
  static validate(data: components['schemas']['AIRequest']): PostChatDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Data must be a valid object')
    }

    const d = data as Record<string, unknown>

    if (!isDefined(d.id) || !isString(d.id) || d.id === '') {
      throw new ValidationException('id is required and must be a non-empty string')
    }

    if (!isDefined(d.trigger) || !isString(d.trigger) || d.trigger === '') {
      throw new ValidationException('trigger is required and must be a non-empty string')
    }

    if (!isDefined(d.messages) || !isArray(d.messages)) {
      throw new ValidationException('messages is required and must be an array')
    }

    const validatedMessages = PostChatDto.validateMessages(d.messages as unknown[])

    const chatTypeParam =
      isDefined(d.chatTypeParam) && isString(d.chatTypeParam) && d.chatTypeParam !== ''
        ? d.chatTypeParam
        : undefined

    const chatTypeId =
      isDefined(d.chatTypeId) && isString(d.chatTypeId) && d.chatTypeId !== ''
        ? d.chatTypeId
        : undefined

    if (!chatTypeParam && !chatTypeId) {
      throw new ValidationException('At least one of chatTypeParam or chatTypeId must be provided')
    }

    // Assess every user-role message for prompt injection patterns.
    // Only flag/block results are collected; allow results are discarded.
    const guard = new PromptInjectionGuard()
    const promptRiskAssessments: PostChatPromptAssessment[] = []

    for (const [i, msg] of validatedMessages.entries()) {
      if (msg.role !== 'user') continue

      for (const part of msg.parts) {
        if (part.type !== 'text' || !isString(part.text) || part.text === '') continue

        const assessment = guard.assess(part.text)
        if (assessment.decision !== 'allow') {
          promptRiskAssessments.push({
            ...assessment,
            messageIndex: i,
            messageId: msg.id,
          })
        }
      }
    }

    return new PostChatDto(
      d.id,
      validatedMessages,
      d.trigger,
      chatTypeParam,
      chatTypeId,
      promptRiskAssessments
    )
  }

  /**
   * Validates an array of raw message objects, returning a typed array on
   * success or throwing a {@link ValidationException} on the first invalid entry.
   *
   * @param messages - The raw array from the request body `messages` field.
   * @returns A validated array of {@link PostChatMessage} objects.
   * @throws {ValidationException} When any message or part fails validation.
   * @private
   */
  private static validateMessages(messages: unknown[]): PostChatMessage[] {
    return messages.map((msg, i) => {
      if (!isDefined(msg) || !isObject(msg)) {
        throw new ValidationException(`messages[${i}] must be an object`)
      }

      const m = msg as Record<string, unknown>

      if (!isDefined(m.id) || !isString(m.id) || m.id === '') {
        throw new ValidationException(`messages[${i}].id must be a non-empty string`)
      }

      if (
        !isDefined(m.role) ||
        !isString(m.role) ||
        (m.role !== 'user' && m.role !== 'assistant')
      ) {
        throw new ValidationException(`messages[${i}].role must be "user" or "assistant"`)
      }

      if (!isDefined(m.parts) || !isArray(m.parts)) {
        throw new ValidationException(`messages[${i}].parts must be an array`)
      }

      return {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: PostChatDto.validateParts(m.parts as unknown[], i),
      }
    })
  }

  /**
   * Validates an array of raw part objects for a single message.
   *
   * @param parts - The raw array from a message's `parts` field.
   * @param messageIndex - The index of the parent message, used in error messages.
   * @returns A validated array of {@link PostChatMessagePart} objects.
   * @throws {ValidationException} When any part fails validation.
   * @private
   */
  private static validateParts(parts: unknown[], messageIndex: number): PostChatMessagePart[] {
    return parts.map((part, j) => {
      if (!isDefined(part) || !isObject(part)) {
        throw new ValidationException(`messages[${messageIndex}].parts[${j}] must be an object`)
      }

      const p = part as Record<string, unknown>

      // Accept any non-empty string: "text", "step-start", "tool-{toolName}", etc.
      if (!isDefined(p.type) || !isString(p.type) || p.type === '') {
        throw new ValidationException(
          `messages[${messageIndex}].parts[${j}].type must be a non-empty string`
        )
      }

      if (isDefined(p.text) && !isString(p.text)) {
        throw new ValidationException(
          `messages[${messageIndex}].parts[${j}].text must be a string when provided`
        )
      }

      if (isDefined(p.state) && !isString(p.state)) {
        throw new ValidationException(
          `messages[${messageIndex}].parts[${j}].state must be a string when provided`
        )
      }

      // Pass all fields through so tool-call parts (toolCallId, input, output,
      // providerMetadata, etc.) are preserved for downstream use-cases.
      return { ...p } as PostChatMessagePart
    })
  }
}
