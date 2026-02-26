import { Container } from '../container.js'

async function main() {
  const container = Container.getInstance()
  await container.start()

  // Graceful shutdown
  let isShuttingDown = false
  const shutdown = async () => {
    if (isShuttingDown) return
    isShuttingDown = true
    try {
      await container.stop()
      process.exit(0)
    } catch (err) {
      console.error('Error during shutdown:', err)
      process.exit(1)
    }
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

main().catch(console.error)
