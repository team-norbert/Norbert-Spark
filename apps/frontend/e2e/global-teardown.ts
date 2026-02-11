import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Gracefully stop a child process: send SIGTERM, wait up to `timeoutMs`
 * for it to exit, then force-kill with SIGKILL if necessary.
 */
async function stopProcess(
  proc: ChildProcess | null,
  label: string,
  timeoutMs = 5000
): Promise<void> {
  if (!proc || proc.killed || proc.exitCode !== null) {
    if (proc) console.warn(`ℹ️  ${label} already exited or was killed`)
    return
  }

  console.warn(`🛑 Stopping ${label}...`)
  try {
    proc.kill('SIGTERM')

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!proc.killed && proc.exitCode === null) {
          console.warn(`⚠️  ${label} did not stop gracefully, forcing kill...`)
          try {
            proc.kill('SIGKILL')
          } catch (error) {
            console.warn(`⚠️  Could not force kill ${label}: ${error}`)
          }
        }
        resolve()
      }, timeoutMs)

      proc.on('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    console.warn(`✅ ${label} stopped`)
  } catch (error) {
    console.warn(`⚠️  Error stopping ${label}: ${error}`)
  }
}

//TODO: refactor - killInterferingProcesses() now unconditionally runs pkill -f ..., which is not cross-platform (will fail on Windows / environments without pkill) and can kill unrelated processes that happen to match the pattern. Consider restoring the prior port-based approach (or gating behind an env var), and keep a Windows/Unix implementation so E2E setup remains portable and safer.
async function globalTeardown() {
  console.warn('🧹 Starting E2E test environment teardown...')

  try {
    // Import managed processes from global setup
    const { backendProcess, frontendProcess } = await import('./global-setup.js')

    // Stop frontend and backend servers
    await stopProcess(frontendProcess, 'frontend server')
    await stopProcess(backendProcess, 'backend server')

    // Read the test configuration and clean up
    const configPath = path.join(process.cwd(), 'e2e', '.test-db-config.json')

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
        containerId: string
        databaseUrl: string
        host: string
        port: number
      }

      console.warn(`📦 Stopping PostgreSQL container: ${config.containerId}`)

      // Container is automatically stopped and removed by Testcontainers
      // when the process exits, but we clean up the config file
      fs.unlinkSync(configPath)

      console.warn('✅ Test environment cleaned up')
      console.warn('💾 Database data has been wiped (container destroyed)')
    } else {
      console.warn('⚠️  No test configuration found, skipping cleanup')
    }
  } catch (error) {
    console.error('❌ Error during teardown:', error)
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

export default globalTeardown
