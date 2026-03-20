import { ReadableStream } from 'node:stream/web'

import { type LanguageModelV3Middleware } from '@ai-sdk/provider'
import { UtcDate } from '@norberts-spark/shared'
import { Redis } from '@upstash/redis'
import { simulateReadableStream } from 'ai'
import { obscured } from 'obscured'

import { EnvConfig } from '../../config/env.config.js'

let isConfiguredCache: boolean | null = null
let cachedRedisUrl: string | undefined
let cachedRedisToken: string | undefined
/**
 * Check if Redis credentials are properly configured
 */
function isRedisConfigured(): boolean {
  // Return cached result if already computed
  if (isConfiguredCache !== null) {
    return isConfiguredCache
  }

  cachedRedisUrl = obscured.value(EnvConfig.UPSTASH_REDIS_REST_URL)
  cachedRedisToken = obscured.value(EnvConfig.UPSTASH_REDIS_REST_TOKEN)

  // Check if credentials exist and are not obscured placeholder values
  isConfiguredCache =
    !!cachedRedisUrl &&
    !!cachedRedisToken &&
    cachedRedisUrl !== '[OBSCURED]' &&
    cachedRedisToken !== '[OBSCURED]' &&
    cachedRedisUrl !== 'undefined' &&
    cachedRedisToken !== 'undefined'

  return isConfiguredCache
}

/**
 * Lazily initialize Redis client only when credentials are configured
 */
let redisClient: Redis | null = null
let initializationAttempted = false

function getRedisClient(): Redis | null {
  // Return existing client if already initialized
  if (redisClient !== null) {
    return redisClient
  }

  // Check if Redis is configured
  if (!isRedisConfigured()) {
    return null
  }

  // Only attempt initialization once to avoid repeated errors
  if (initializationAttempted) {
    return null
  }

  initializationAttempted = true

  try {
    redisClient = new Redis({
      url: cachedRedisUrl!,
      token: cachedRedisToken!,
    })
    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    return null
  }
}

export const textOnlyCacheMiddleware: LanguageModelV3Middleware = {
  specificationVersion: 'v3',
  wrapGenerate: async ({ doGenerate, params }) => {
    const redis = getRedisClient()
    const cacheKey = `ai:text:${JSON.stringify(params)}`
    const cached = await redis?.get<string>(cacheKey)

    if (cached) {
      return {
        content: [{ type: 'text', text: cached }],
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: null, rawSettings: {} },
      } as any
    }

    const result = await doGenerate()
    const textContent = result.content
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('')
    if (textContent) await redis?.set(cacheKey, textContent, { ex: 3600 })
    return result
  },
  wrapStream: async ({ doStream, params }) => {
    const redis = getRedisClient()
    const cacheKey = `ai:text:stream:${JSON.stringify(params)}`
    const cachedText = await redis?.get<string>(cacheKey)

    if (cachedText) {
      return {
        // We wrap the plain text into the internal 'text-delta' format
        stream: simulateReadableStream({
          chunks: [{ type: 'text-delta' as const, id: 'cached-0', delta: cachedText }],
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      }
    }

    const { stream, ...rest } = await doStream()
    let fullText = ''

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (fullText) await redis?.set(cacheKey, fullText, { ex: 3600 })
            controller.close()
            break
          }

          // Only capture 'text-delta' chunks for storage
          if (value.type === 'text-delta') {
            fullText += value.delta
          }

          controller.enqueue(value)
        }
      },
    })

    return { stream: transformedStream, ...rest }
  },
}
