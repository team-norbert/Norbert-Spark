import type { ChildProcess } from 'node:child_process'
import { exec, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import postgres from 'postgres'

/* eslint-disable-next-line no-undef */
type ProcessEnv = NodeJS.ProcessEnv

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let postgresContainer: StartedPostgreSqlContainer
let backendProcess: ChildProcess | null = null
let frontendProcess: ChildProcess | null = null

// Export for teardown
export { backendProcess, frontendProcess, postgresContainer }

/**
 * Kill common long-running Node.js development processes before E2E tests.
 *
 * This attempts to stop previously started backend dev servers, Next.js
 * servers and Drizzle Studio instances so they don't conflict with the
 * processes managed by the test runner.
 */
async function killInterferingProcesses() {
  console.warn('🧹 Checking for interfering Node.js processes...')

  const processPatterns = [
    'next dev', // Kill dev servers that would conflict with production build
    'next start', // Kill any lingering production servers
    'node .next/standalone', // Kill any lingering standalone Next.js servers (including E2E)
    'tsx watch', // Kill backend dev servers
    'drizzle-kit studio', // Kill database GUI
  ]

  for (const pattern of processPatterns) {
    try {
      // Use pkill with -f flag to match full command line
      await execAsync(`pkill -f "${pattern}"`)
      console.warn(`   ✓ Killed processes matching: ${pattern}`)
    } catch (error) {
      // pkill exits with code 1 if no processes match, which is fine
      // Only log if there's an actual error message
      if (error instanceof Error && error.message && !error.message.includes('exit code 1')) {
        console.warn(`   ⚠ Warning killing ${pattern}: ${error.message}`)
      }
    }
  }

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.warn('✅ Process cleanup complete')
}

/**
 * Run a spawned process and return a promise that resolves when it exits
 * successfully or rejects on non-zero exit / error.
 */
function runProcess(
  command: string,
  args: string[],
  options: { cwd: string; env: ProcessEnv }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { ...options, stdio: 'inherit' })
    proc.on('close', (code: number | null) => {
      if (code === 0) resolve()
      else reject(new Error(`"${command} ${args.join(' ')}" exited with code ${code}`))
    })
    proc.on('error', reject)
  })
}

/**
 * Poll a URL until it responds successfully, with a configurable timeout.
 */
function waitForServer(url: string, label: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false

    const timeout = setTimeout(() => {
      done = true
      reject(new Error(`${label} failed to start within ${timeoutMs / 1000} seconds`))
    }, timeoutMs)

    const check = async () => {
      if (done) return

      try {
        const response = await fetch(url)
        if (response.ok) {
          clearTimeout(timeout)
          done = true
          resolve()
        } else if (!done) {
          setTimeout(check, 500)
        }
      } catch {
        if (!done) {
          setTimeout(check, 500)
        }
      }
    }

    // Give the server a moment to bind before first check
    setTimeout(check, 1000)
  })
}

async function globalSetup() {
  console.warn('🚀 Starting E2E test environment setup...')

  try {
    // Kill any interfering processes first
    await killInterferingProcesses()

    // ── 1. Start PostgreSQL container ────────────────────────────────────
    console.warn('📦 Starting PostgreSQL container...')
    postgresContainer = await new PostgreSqlContainer('pgvector/pgvector:0.8.1-pg18-trixie')
      .withDatabase('norbertsSpark_test')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start()

    const host = postgresContainer.getHost()
    const port = postgresContainer.getMappedPort(5432)
    const username = postgresContainer.getUsername()
    const password = postgresContainer.getPassword()
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/norbertsSpark_test`
    console.warn(`✅ PostgreSQL container started at ${host}:${port}`)

    // ── 2. Create database schema ────────────────────────────────────────
    console.warn('📝 Creating database from SQL schema...')
    const schemaPath = path.resolve(__dirname, '..', '..', 'backend', 'sql', 'norberts_schema.sql')
    console.warn(`📂 Schema path: ${schemaPath}`)

    const sqlSchema = fs.readFileSync(schemaPath, 'utf-8')
    const schemaClient = postgres(connectionString, { max: 1, prepare: false })
    await schemaClient.unsafe(sqlSchema)
    await schemaClient.end()
    console.warn('✅ Database schema created')

    // ── 3. Seed data ─────────────────────────────────────────────────────
    const backendSeedPath = path.join(process.cwd(), '..', 'backend')
    const seedEnv = { ...process.env, DATABASE_URL: connectionString }

    console.warn('🌱 Seeding chat types...')
    await runProcess('pnpm', ['seed:chat'], { cwd: backendSeedPath, env: seedEnv })
    console.warn('✅ Chat types seeded')

    console.warn('🌱 Seeding test users...')
    await runProcess('pnpm', ['seed:users', '3'], {
      cwd: backendSeedPath,
      env: { ...seedEnv, SEED_PASSWORD: 'Admin123!' },
    })
    console.warn('✅ Test users seeded')

    console.warn('🌱 Seeding company data...')
    await runProcess('pnpm', ['seed:company'], { cwd: backendSeedPath, env: seedEnv })
    console.warn('✅ Company data seeded')

    // ── 4. Save test config ──────────────────────────────────────────────
    const testConfig = {
      databaseUrl: connectionString,
      host,
      port,
      containerId: postgresContainer.getId(),
    }
    const configPath = path.join(process.cwd(), 'e2e', '.test-db-config.json')
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2))

    process.env.DATABASE_URL = connectionString
    process.env.TEST_DATABASE_URL = connectionString

    // ── 5. Production build of Next.js ───────────────────────────────────
    console.warn('🔨 Building Next.js production bundle...')
    const frontendPath = process.cwd()
    await runProcess('pnpm', ['build'], {
      cwd: frontendPath,
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        BACKEND_AI_CALLBACK_URL: 'http://localhost:3000/api/v1',
        BACKEND_AI_CALLBACK_URL_DEV: 'http://localhost:3000/api/v1',
        BACKEND_AI_CALLBACK_URL_PROD: 'http://localhost:3000/api/v1',
        NEXT_PUBLIC_BASE_URL: 'http://localhost:4321',
        NEXT_PUBLIC_POST_AI_CALLBACK_URL: 'http://localhost:3000/api/v1/ai/chat',
        NEXTAUTH_URL: 'http://localhost:4321',
        NEXTAUTH_SECRET: 'e2e-test-secret-minimum-32-chars-long',
      },
    })
    console.warn('✅ Next.js production build complete')

    // ── 6. Start backend server ──────────────────────────────────────────
    console.warn('🚀 Starting backend server...')
    const backendPath = path.join(process.cwd(), '..', 'backend')

    backendProcess = spawn('pnpm', ['dev'], {
      cwd: backendPath,
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        PORT: '3000',
        HOST: 'localhost',
        NODE_ENV: 'test',
        USE_HTTPS: 'false',
        JWT_SECRET: 'test-jwt-secret-for-e2e-tests-minimum-256-bits',
        JWT_ISSUER: 'norbertsSpark-test',
        JWT_EXPIRATION: '3600',
        GOOGLE_GENERATIVE_AI_API_KEY: 'test-google-api-key-for-e2e',
        MODEL_NAME: 'gemini-1.5-flash',
        RESEND_API_KEY: 'test-resend-api-key-for-e2e',
        API_VERSION: 'v1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    backendProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.warn(`[Backend] ${msg}`)
    })
    backendProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.warn(`[Backend Error] ${msg}`)
    })

    await waitForServer('http://localhost:3000/health', 'Backend server')
    console.warn('✅ Backend server started at http://localhost:3000')

    // ── 7. Start Next.js production server ───────────────────────────────
    console.warn('🚀 Starting Next.js production server...')

    frontendProcess = spawn('pnpm', ['start:e2e'], {
      cwd: frontendPath,
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        NODE_ENV: 'production',
        BACKEND_AI_CALLBACK_URL: 'http://localhost:3000/api/v1',
        BACKEND_AI_CALLBACK_URL_DEV: 'http://localhost:3000/api/v1',
        BACKEND_AI_CALLBACK_URL_PROD: 'http://localhost:3000/api/v1',
        NEXT_PUBLIC_BASE_URL: 'http://localhost:4321',
        NEXT_PUBLIC_POST_AI_CALLBACK_URL: 'http://localhost:3000/api/v1/ai/chat',
        NEXTAUTH_URL: 'http://localhost:4321',
        NEXTAUTH_SECRET: 'e2e-test-secret-minimum-32-chars-long',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    frontendProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.warn(`[Frontend] ${msg}`)
    })
    frontendProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.warn(`[Frontend Error] ${msg}`)
    })

    await waitForServer('http://localhost:4321', 'Next.js production server')
    console.warn('✅ Next.js production server started at http://localhost:4321')

    // ── Done ─────────────────────────────────────────────────────────────
    console.warn('✅ E2E test environment ready!')
    console.warn(`📊 Database running at ${host}:${port}`)
    console.warn(`🔧 Backend API running at http://localhost:3000`)
    console.warn(`🌐 Frontend running at http://localhost:4321`)
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error)

    // Clean up anything that was started
    if (frontendProcess && !frontendProcess.killed) {
      frontendProcess.kill('SIGTERM')
    }
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill('SIGTERM')
    }
    if (postgresContainer) {
      try {
        await postgresContainer.stop()
        console.warn('🛑 PostgreSQL container stopped due to setup failure.')
      } catch (stopError) {
        console.error('⚠️ Failed to stop PostgreSQL container:', stopError)
      }
    }
    throw error
  }
}

export default globalSetup
