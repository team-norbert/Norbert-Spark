import { Verifier } from '@pact-foundation/pact'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PACT_BROKER_URL = process.env.PACT_BROKER_URL ?? 'http://localhost:9293'

/**
 * PROVIDER VERIFICATION TEST (Backend)
 *
 * Verifies that the real backend API satisfies the consumer's contract
 * by fetching the latest pact from the Pact Broker.
 *
 * How it works:
 *   1. Starts a real Fastify server with the /health endpoint
 *   2. Fetches the latest pact for BackendAPI from the broker at localhost:9292
 *   3. Replays every interaction from the contract against the real server
 *   4. Publishes the verification result back to the broker
 *
 * Prerequisites:
 *   - Pact Broker running: cd infrastructure/pact-broker && docker compose up -d
 *   - Consumer test published: cd apps/frontend && pnpm vitest run pacts/consumer.pact.spec.ts
 *
 * Run:  cd apps/backend && pnpm vitest run pact/provider.pact.spec.ts
 */
describe('Provider Verification: BackendAPI', () => {
  let app: FastifyInstance
  let serverUrl: string

  beforeAll(async () => {
    // Dynamic import so test/setup.ts env vars are loaded first
    const { createFastifyApp } = await import('../src/infrastructure/http/fastify.config.js')

    // Start Fastify with only the health endpoint (no full DI container)
    app = createFastifyApp({ logger: false })
    const address = await app.listen({ port: 0, host: '127.0.0.1' })
    serverUrl = address
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('satisfies the FrontendWebsite consumer contract', async () => {
    const verifier = new Verifier({
      providerBaseUrl: serverUrl,
      provider: 'BackendAPI',
      // Fetch pacts from the broker instead of local files
      pactBrokerUrl: PACT_BROKER_URL,
      // Select which consumer versions to verify against
      consumerVersionSelectors: [{ latest: true }],
      // Publish verification results back to the broker
      publishVerificationResult: true,
      providerVersion: '1.0.0',
      logLevel: 'warn',
    })

    // Fetches the consumer's pact from the broker, replays the
    // requests against the real server, and reports back
    const result = await verifier.verifyProvider()
    expect(result).toBeTruthy()
  })
})
