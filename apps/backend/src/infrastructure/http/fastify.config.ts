import '../security/instrument.js'

import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { OpenAPI } from '@norberts-spark/shared'
import * as Sentry from '@sentry/node'
import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'
import { uuidv7 } from 'uuidv7'

import { ErrorCode } from '../../shared/constants/error-codes.js'
import { BaseException } from '../../shared/exceptions/base.exception.js'
import { EnvConfig } from '../config/env.config.js'

/**
 * Creates and configures a Fastify server instance with CORS, Swagger, and OpenAPI support.
 *
 * @param {FastifyServerOptions} [options] - Optional Fastify server options to customize the instance.
 * @returns {FastifyInstance} The configured Fastify server instance.
 *
 * @throws {Error} If the OpenAPI specification file (`openapi.json`) cannot be found or parsed.
 *
 * @remarks
 * - Registers CORS with permissive settings for development.
 * - Loads and parses the OpenAPI specification from disk.
 * - Registers Swagger and Swagger UI plugins for API documentation.
 * - Registers a `/health` route for health checks.
 * - Reads files from disk and may throw if files are missing or invalid.
 */
export function createFastifyApp(options?: FastifyServerOptions): FastifyInstance {
  const defaultLoggerOptions = {
    redact: ['req.headers.authorization'],
    level: EnvConfig.LOG_LEVEL,
    base: {
      service: EnvConfig.SERVICE_NAME,
      env: EnvConfig.NODE_ENV,
      version: EnvConfig.APP_VERSION,
    },
    serializers: {
      req(req: { method: string; routeOptions?: { url?: string }; url: string }) {
        return {
          method: req.method,
          url: req.routeOptions?.url ?? req.url.split('?')[0],
          // remoteAddress and remotePort intentionally omitted — IP is PII under UK GDPR.
          // IP is retained in the audit_log table under a separate retention policy.
        }
      },
    },
  }

  // Merge caller-supplied logger options over the defaults so that the GDPR-safe
  // serializers are always active, even when a custom stream/level is injected
  // (e.g. in tests).  A boolean logger value (true/false) is used as-is.
  // Serializers are explicitly merged so a caller adding extra serializers does
  // not accidentally remove the req serializer.
  const resolvedLogger =
    options?.logger == null || typeof options.logger === 'boolean'
      ? (options?.logger ?? defaultLoggerOptions)
      : (() => {
          const callerLogger = options.logger as Record<string, unknown>
          return {
            ...defaultLoggerOptions,
            ...callerLogger,
            serializers: {
              ...defaultLoggerOptions.serializers,
              ...((callerLogger['serializers'] as Record<string, unknown> | undefined) ?? {}),
            },
          }
        })()

  const fastify = Fastify({
    genReqId: () => uuidv7(),
    ...options,
    logger: resolvedLogger,
  })

  fastify.addHook('onRequest', (request, _reply, done) => {
    // Attach request start time for duration calculation
    request.startTime = Date.now()
    done()
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    // Skip logging here for server errors — onError already emitted http.request.error for those
    if (reply.statusCode >= 500) {
      done()
      return
    }

    const durationMs = request.startTime != null ? Math.round(Date.now() - request.startTime) : -1
    request.durationMs = durationMs
    const userId = request.user?.sub ?? undefined

    request.log.info(
      {
        event: 'http.request.completed',
        requestId: request.id,
        userId,
        method: request.method,
        route: request.routeOptions?.url ?? request.url,
        statusCode: reply.statusCode,
        durationMs,
      },
      'request completed'
    )

    done()
  })

  fastify.addHook('onError', (request, reply, error, done) => {
    const statusCode = error instanceof BaseException ? error.statusCode : reply.statusCode

    // Only emit http.request.error for server-side errors (5xx)
    // 4xx client errors are handled by onResponse as http.request.completed
    if (statusCode < 500) {
      done()
      return
    }

    const durationMs = request.startTime != null ? Math.round(Date.now() - request.startTime) : -1

    request.log.error(
      {
        event: 'http.request.error',
        requestId: request.id,
        userId: request.user?.sub ?? undefined,
        method: request.method,
        route: request.routeOptions?.url ?? request.url,
        statusCode,
        durationMs,
        errorCode: error instanceof BaseException ? error.code : ErrorCode.INTERNAL_ERROR,
        err: error,
      },
      'request error'
    )

    done()
  })

  // Register CORS - use specific origins rather than permissive wildcard
  const isProduction = EnvConfig.NODE_ENV === 'production'
  let allowedOrigins: string[]

  if (isProduction) {
    const rawAllowedOrigins = process.env.ALLOWED_ORIGINS

    if (!rawAllowedOrigins) {
      fastify.log.warn(
        'ALLOWED_ORIGINS is not set in production; CORS will reject all cross-origin requests. ' +
          'Set ALLOWED_ORIGINS to a comma-separated list of allowed origins.'
      )
      allowedOrigins = []
    } else {
      allowedOrigins = rawAllowedOrigins
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    }
  } else {
    allowedOrigins = [
      // Next.js dev server
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
      'https://127.0.0.1:3000',
      // Next.js production / standalone server (pnpm start:e2e and manual prod runs)
      'http://localhost:4321',
      'http://127.0.0.1:4321',
      'https://localhost:4321',
      'https://127.0.0.1:4321',
    ]
  }
  fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const xRealIp = req.headers['x-real-ip']
      if (typeof xRealIp === 'string' && xRealIp.trim().length > 0) {
        return xRealIp.trim()
      }

      const xForwardedFor = req.headers['x-forwarded-for']
      if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
        const forwardedIps = xForwardedFor
          .split(',')
          .map((ip) => ip.trim())
          .filter(Boolean)

        if (forwardedIps.length > 0) {
          return forwardedIps[0]
        }
      }

      return req.socket?.remoteAddress ?? ''
    },
  })

  fastify.register(
    helmet,
    // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    {
      contentSecurityPolicy: false,
      global: true,
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
    }
  )

  // Register multipart support for file uploads
  fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 10, // Maximum number of files
    },
  })

  // Register Swagger
  fastify.register(swagger, {
    mode: 'static',
    specification: {
      document: OpenAPI as any,
    },
  })

  // Register Swagger UI
  fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  })

  if (EnvConfig.SENTRY_ENABLED === true) {
    Sentry.setupFastifyErrorHandler(fastify)
  }

  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return fastify
}
