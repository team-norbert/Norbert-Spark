import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import postgres from 'postgres'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let postgresContainer: StartedPostgreSqlContainer
let backendProcess: ChildProcess | null = null

// Export for teardown
export { backendProcess, postgresContainer }

async function globalSetup() {
  console.warn('🚀 Starting E2E test environment setup...')

  try {
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
