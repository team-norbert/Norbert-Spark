import { Container } from '../container.js'

async function main() {
  const container = Container.getInstance()
  await container.start()

  // Graceful shutdown
  const shutdown = async () => {
    await container.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(console.error)
