import { readFileSync } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Verifier } from '@pact-foundation/pact'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import jwt from 'jsonwebtoken'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PACT_BROKER_PORT = process.env.PACT_BROKER_PORT ?? '9292'
const PACT_BROKER_URL =
  process.env.PACT_BROKER_URL ?? `http://localhost:${PACT_BROKER_PORT}`

/**
 * PROVIDER VERIFICATION TEST (Backend)
 *
 * Verifies that the real backend API satisfies the consumer's contract
 * by fetching the latest pact from the Pact Broker.
 *
 * How it works:
 *   1. Starts a real PostgreSQL container via Testcontainers
 *   2. Applies the full schema and seeds a company record
 *   3. Boots the full DI Container (all routes registered, real DB)
 *   4. Fetches the latest pact for BackendAPI from the broker
 *   5. Replays every interaction (injecting a test JWT for auth-protected routes)
 *   6. Publishes the verification result back to the broker
 *
 * Prerequisites:
 *   - Docker running (for Testcontainers)
 *   - Pact Broker running: cd infrastructure/pact-broker && docker compose up -d
 *   - Consumer test published: cd apps/frontend && pnpm vitest run pacts/consumer.pact.spec.ts
 *
 * Run:  cd apps/backend && pnpm test:pact
 */
describe('Provider Verification: BackendAPI', () => {
  let serverUrl: string
  let stopContainer: () => Promise<void>

  let diContainer: any

  beforeAll(async () => {
    // ── 1. Start PostgreSQL via Testcontainers ───────────────────────────────
    const pgContainer = await new PostgreSqlContainer('pgvector/pgvector:0.8.1-pg18-trixie')
      .withDatabase('norbertsSpark_test')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start()

    const host = pgContainer.getHost()
    const port = pgContainer.getMappedPort(5432)
    const connectionString = `postgresql://test:test@${host}:${port}/norbertsSpark_test`
    stopContainer = () => pgContainer.stop()

    // ── 2. Apply schema ──────────────────────────────────────────────────────
    const schemaPath = path.resolve(__dirname, '../sql/norberts_schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf-8')

    const schemaClient = new Client({ connectionString })
    await schemaClient.connect()
    await schemaClient.query(schemaSql)
    await schemaClient.end()

    // ── 3. Seed a company record ─────────────────────────────────────────────
    const seedClient = new Client({ connectionString })
    await seedClient.connect()
    await seedClient.query(`
      INSERT INTO company
        (company_id, legal_name, display_name, status, timezone, singleton_check)
      VALUES
        ('019c0027-c91d-7ea6-b833-e44d18ac8021',
         'Acme Corporation Ltd.',
         'Acme Corp',
         'active',
         'America/New_York',
         true)
      ON CONFLICT DO NOTHING
    `)
    await seedClient.end()

    // ── 4. Wire env vars BEFORE importing Container ──────────────────────────
    // DATABASE_URL must be set here so the module-level pool in database/index.ts
    // connects to the testcontainer when it is first imported below.
    process.env.DATABASE_URL = connectionString

    // ── 5. Dynamically import and initialise the DI Container ────────────────
    // Dynamic import ensures EnvConfig's static fields are evaluated after all
    // process.env assignments above (including those in test/setup.ts).
    const { Container } = await import('../src/infrastructure/di/container.js')
    diContainer = Container.getInstance()

    // ── 6. Start Fastify on a random free port ───────────────────────────────
    const address = await diContainer.app.listen({ port: 0, host: '127.0.0.1' })
    serverUrl = address
  }, 120_000)

  afterAll(async () => {
    await diContainer?.stop()
    await stopContainer?.()
  }, 60_000)

  it('satisfies the FrontendWebsite consumer contract', async () => {
    // Generate a short-lived test JWT signed with the same secret the server uses.
    // This is injected into every request by requestFilter so that auth-protected
    // routes (e.g. GET /api/v1/company/details) do not return 401.
    const testToken = jwt.sign(
      {
        email: 'pact-test@example.com',
        roles: ['admin'],
      },
      process.env.JWT_SECRET ?? 'test-secret-key-for-jwt-signing-minimum-256-bits-required',
      {
        subject: '019c0027-c91d-7ea6-b833-e44d18ac8022', // valid UUID v7
        issuer: process.env.JWT_ISSUER ?? 'test-issuer',
        expiresIn: '1h',
      }
    )

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
      // Inject a valid JWT into every request so auth middleware passes.
      // The consumer contract does not include auth headers — this is a
      // provider-side concern handled transparently here.
      requestFilter: (req, _res, next) => {
        req.headers['authorization'] = `Bearer ${testToken}`
        next()
      },
      stateHandlers: {
        // Both the health check and company details interactions use this state.
        // The server is already running and the DB is seeded in beforeAll.
        'the server is running': async () => {},
      },
    })

    // Fetches the consumer's pact from the broker, replays the
    // requests against the real server, and reports back
    const result = await verifier.verifyProvider()
    expect(result).toBeTruthy()
  }, 120_000)
})
