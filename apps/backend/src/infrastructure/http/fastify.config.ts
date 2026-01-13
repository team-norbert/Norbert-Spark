import '../security/instrument.js'
import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import * as Sentry from '@sentry/node'
import helmet from '@fastify/helmet'

import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { OpenAPI } from '@norberts-spark/shared'
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
  const fastify = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
      level: 'info',
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            hostname: req.hostname,
            remoteAddress: req.ip,
            remotePort: req.socket?.remotePort,
          }
        },
      },
    },
    ...options,
  })

  // Register CORS with permissive policy for development
  fastify.register(cors, {
    origin: true, // Allow all origins
    credentials: true, // Allow credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  fastify.register(
    helmet,
    // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    { contentSecurityPolicy: false, global: true }
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

  if (EnvConfig.SENTRY_ENABLED === 'true') {
    Sentry.setupFastifyErrorHandler(fastify)
  }

  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return fastify
}
