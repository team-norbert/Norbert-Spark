import path from 'node:path'

import { MatchersV3, PactV4, SpecificationVersion } from '@pact-foundation/pact'
import { describe, expect, it } from 'vitest'

const { like } = MatchersV3

const PACT_DIR = path.resolve(process.cwd(), '../../infrastructure/pact-broker/results')
const CONSUMER = 'FrontendWebsite'
const PROVIDER = 'BackendAPI'

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

describe('Consumer Contract: Company Details API', () => {
  it('returns Company Details from the backend', async () => {
    await pact
      .addInteraction()
      .given('the server is running')
      .uponReceiving('a request to get company details')
      .withRequest('GET', '/api/v1/company/details')
      .willRespondWith(200, (builder) => {
        builder.jsonBody({
          success: like(true),
          data: {
            company: like({
              companyId: like('019c0027-c91d-7ea6-b833-e44d18ac8021'),
              legalName: like('Acme Corporation Ltd.'),
              displayName: like('Acme Corp'),
              status: like('active'),
              timezone: like('America/New_York'),
              createdAt: like('2024-01-15T10:30:00.000Z'),
              updatedAt: like('2024-06-01T12:00:00.000Z'),
            }),
          },
        })
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/company/details`)
        const body = (await response.json()) as {
          success: boolean
          data: { company: Record<string, unknown> | null }
        }

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data).toHaveProperty('company')
        expect(body.data.company).toHaveProperty('companyId')
        expect(body.data.company).toHaveProperty('legalName')
        expect(body.data.company).toHaveProperty('displayName')
        expect(body.data.company).toHaveProperty('status')
        expect(body.data.company).toHaveProperty('timezone')
      })
  })
})
