import type { ChildProcess } from 'node:child_process'
import { exec, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import postgres from 'postgres'

const execAsync = promisify(exec)

const PID_REGEX = /^\d+$/

/**
 * Check if an error from exec is expected (exit code 1 or command not found).
 * Exit code 1 typically means "no process found" for lsof/netstat.
 * ENOENT means the command itself was not found.
 */
function isExpectedExecError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const errCode = (error as { code?: string | number }).code
  return errCode === 1 || errCode === '1' || errCode === 'ENOENT'
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let postgresContainer: StartedPostgreSqlContainer
let backendProcess: ChildProcess | null = null

// Export for teardown
export { backendProcess, postgresContainer }

/**
 * Kill processes listening on specific ports before E2E tests.
 *
 * This is opt-in via E2E_CLEANUP_PROCESSES=true environment variable to avoid
 * accidentally killing unrelated processes. When enabled, it frees up port 3000
 * (backend) by killing processes bound to that port.
 *
 * Uses cross-platform approach:
 * - Windows: netstat + taskkill
 * - Unix/Linux/macOS: lsof
 *
 * NOTE: We target specific ports instead of process names to avoid killing
 * unrelated projects. Port 4321 is intentionally skipped as Playwright's webServer
 * manages the Next.js dev server.
 */
async function killInterferingProcesses() {
  // Make cleanup opt-in to avoid accidentally killing unrelated processes
  if (process.env.E2E_CLEANUP_PROCESSES !== 'true') {
    console.warn('ℹ️  Process cleanup skipped (set E2E_CLEANUP_PROCESSES=true to enable)')
    return
  }

  console.warn('🧹 Checking for processes on ports 3000...')

  const portsToCheck = [
    3000, // Backend server (we manage this ourselves in global-setup)
    // 4321 is intentionally excluded - Playwright's webServer manages the frontend
  ]

  const platform = process.platform
  let killedAny = false

  for (const port of portsToCheck) {
    try {
      let pid: string | null = null

      if (platform === 'win32') {
        // Windows: Use netstat to find process on port
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
          const lines = stdout.trim().split('\n')
          for (const line of lines) {
            const match = line.match(/LISTENING\s+(\d+)/)
            if (match && match[1]) {
              pid = match[1]
              break
            }
          }

          if (pid) {
            await execAsync(`taskkill /F /PID ${pid}`)
            console.warn(`   ✓ Killed process ${pid} on port ${port}`)
            killedAny = true
          }
        } catch (error) {
          // Ignore exit code 1 (no matching process found) and ENOENT (command not found)
          if (!isExpectedExecError(error)) {
            console.warn(
              `   ⚠ Could not check port ${port}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        }
      } else {
        // Unix/Linux/macOS: Use lsof to find process(es) on port
        try {
          const { stdout } = await execAsync(`lsof -ti :${port}`)
          const pids = stdout
            .trim()
            .split(/\s+/)
            .map((value) => value.trim())
            .filter((value) => value.length > 0 && PID_REGEX.test(value))

          for (const pidToKill of pids) {
            await execAsync(`kill -9 ${pidToKill}`)
            console.warn(`   ✓ Killed process ${pidToKill} on port ${port}`)
            killedAny = true
          }
        } catch (error) {
          // lsof exits with code 1 if no process found, which is fine
          // Also ignore ENOENT (command not found)
          if (!isExpectedExecError(error)) {
            console.warn(
              `   ⚠ Could not check port ${port}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        }
      }
    } catch (error) {
      // Catch-all for unexpected errors
      console.warn(`   ⚠ Unexpected error checking port ${port}:`, error)
    }
  }

  if (killedAny) {
    // Wait a moment for processes to fully terminate
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.warn('✅ Process cleanup complete')
}

async function globalSetup() {
  console.warn('🚀 Starting E2E test environment setup...')

  try {
    // Kill any interfering processes first
    await killInterferingProcesses()

    // Start PostgreSQL container
    console.warn('📦 Starting PostgreSQL container...')
    postgresContainer = await new PostgreSqlContainer('postgres:18-alpine')
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

    // Execute SQL schema to create database structure
    console.warn('📝 Creating database from SQL schema...')
    const schemaPath = path.resolve(__dirname, '..', '..', 'backend', 'sql', 'norberts_schema.sql')
    console.warn(`📂 Schema path: ${schemaPath}`)

    // Read SQL schema file
    const sqlSchema = fs.readFileSync(schemaPath, 'utf-8')

    // Execute SQL schema
    const schemaClient = postgres(connectionString, { max: 1, prepare: false })
    await schemaClient.unsafe(sqlSchema)
    await schemaClient.end()
    console.warn('✅ Database schema created')

    // Seed chat types
    console.warn('🌱 Seeding chat types...')
    const backendSeedPath = path.join(process.cwd(), '..', 'backend')
    const seedChatProcess = spawn('pnpm', ['seed:chat'], {
      cwd: backendSeedPath,
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
      },
      stdio: 'inherit',
    })

    await new Promise<void>((resolve, reject) => {
      seedChatProcess.on('close', (code) => {
        if (code === 0) {
          console.warn('✅ Chat types seeded')
          resolve()
        } else {
          reject(new Error(`Seed chat process exited with code ${code}`))
        }
      })
      seedChatProcess.on('error', reject)
    })

    // Seed test users
    console.warn('🌱 Seeding test users...')
    const seedUsersProcess = spawn('pnpm', ['seed:users', '3'], {
      cwd: backendSeedPath,
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        SEED_PASSWORD: 'Admin123!', // Test password for all seeded users
      },
      stdio: 'inherit',
    })

    await new Promise<void>((resolve, reject) => {
      seedUsersProcess.on('close', (code) => {
        if (code === 0) {
          console.warn('✅ Test users seeded')
          resolve()
        } else {
          reject(new Error(`Seed users process exited with code ${code}`))
        }
      })
      seedUsersProcess.on('error', reject)
    })

    // Save connection info to a file that tests can read
    const testConfig = {
      databaseUrl: connectionString,
      host,
      port,
      containerId: postgresContainer.getId(),
    }

    const configPath = path.join(process.cwd(), 'e2e', '.test-db-config.json')
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2))

    // Set environment variable for the test run
    process.env.DATABASE_URL = connectionString
    process.env.TEST_DATABASE_URL = connectionString

    // Start backend server
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
        USE_HTTPS: 'false', // Use HTTP for E2E tests
        JWT_SECRET: 'test-jwt-secret-for-e2e-tests-minimum-256-bits',
        JWT_ISSUER: 'norbertsSpark-test',
        JWT_EXPIRATION: '3600', // 1 hour in seconds (backend expects seconds, not '1h' format)
        GOOGLE_GENERATIVE_AI_API_KEY: 'test-google-api-key-for-e2e',
        MODEL_NAME: 'gemini-1.5-flash',
        RESEND_API_KEY: 'test-resend-api-key-for-e2e',
        API_VERSION: 'v1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Wait for backend to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Backend server failed to start within 30 seconds'))
      }, 30000)

      const checkServer = async () => {
        try {
          const response = await fetch('http://localhost:3000/health')
          if (response.ok) {
            clearTimeout(timeout)
            resolve()
          }
        } catch {
          // Server not ready yet, try again
          setTimeout(checkServer, 500)
        }
      }

      // Start checking after 2 seconds to give server time to start
      setTimeout(checkServer, 2000)

      // Log backend output
      backendProcess?.stdout?.on('data', (data) => {
        const message = data.toString().trim()
        if (message) {
          console.warn(`[Backend] ${message}`)
        }
      })

      backendProcess?.stderr?.on('data', (data) => {
        const message = data.toString().trim()
        if (message) {
          console.warn(`[Backend Error] ${message}`)
        }
      })

      backendProcess?.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      backendProcess?.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeout)
          reject(new Error(`Backend process exited with code ${code}`))
        }
      })
    })

    console.warn('✅ Backend server started at http://localhost:3000')

    console.warn('✅ E2E test environment ready!')
    console.warn(`📊 Database running at ${host}:${port}`)
    console.warn(`🔧 Backend API running at http://localhost:3000`)
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error)
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
