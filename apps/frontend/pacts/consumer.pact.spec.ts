import path from 'node:path'

import { MatchersV3, PactV4, SpecificationVersion } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'

const { like } = MatchersV3

const PACT_BROKER_URL = process.env.PACT_BROKER_URL ?? 'http://localhost:9292'
const PACT_DIR = path.resolve(process.cwd(), 'pacts')
const CONSUMER = 'FrontendWebsite'
const PROVIDER = 'BackendAPI'
const CONSUMER_VERSION = '1.0.0'

/**
 * CONSUMER CONTRACT TEST (Frontend → Backend)
 *
 * This test defines what the frontend expects from the backend's GET /health endpoint.
 *
 * How it works:
 *   1. Define the expected request/response interaction
 *   2. Pact spins up a mock server that returns the expected response
 *   3. The test makes a real HTTP call to the mock (simulating the frontend)
 *   4. On success, a contract file is written to ./pacts/FrontendWebsite-BackendAPI.json
 *   5. Publish the contract separately via: pnpm run test:publish
 *
 * The provider test then verifies directly from the broker.
 *
 * Run:  cd apps/frontend && pnpm vitest run pacts/consumer.pact.spec.ts
 */
const pact = new PactV4({
  consumer: CONSUMER,
  provider: PROVIDER,
  spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
  dir: PACT_DIR,
  logLevel: 'warn',
})

describe('Consumer Contract: Health API', () => {
  it('returns a healthy status from the backend', async () => {
    // Define the interaction and execute the test in one chain.
    // "given" sets the provider state (useful for setting up test data)
    // "uponReceiving" is a unique description of this interaction
    await pact
      .addInteraction()
      .given('the server is running')
      .uponReceiving('a request to check server health')
      .withRequest('GET', '/health')
      .willRespondWith(200, (builder) => {
        // like() means "match the type, not the exact value"
        // The provider must return an object with these keys and matching types
        builder.jsonBody({
          status: like('ok'),
          timestamp: like('2025-01-01T00:00:00.000Z'),
        })
      })
      .executeTest(async (mockServer) => {
        // This simulates the frontend calling the backend API
        const response = await fetch(`${mockServer.url}/health`)
        const body = (await response.json()) as { status: string; timestamp: string }

        // Assert the response shape
        expect(response.status).toBe(200)
        expect(body.status).toBe('ok')
        expect(body).toHaveProperty('timestamp')
      })
  })
})
