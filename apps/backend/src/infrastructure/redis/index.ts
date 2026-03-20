import { createClient, type RedisClientType } from 'redis'

const logger = {
  info: (...params: unknown[]) => console.info(...params),
  error: (...params: unknown[]) => console.error(...params),
}

let client: RedisClientType | null = null
/**
 * Connects to Redis and returns the client instance.
 * Redis string format: redis[s]://[[username][:password]@][host][:port][/db-number]:
 * Type: ReturnType<typeof createClient>
 * @returns {RedisClientType} The connected Redis client instance.
 * @throws {Error} If Redis credentials are not properly configured or connection fails.
 */
export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
      },
    })

    client.on('error', (err) => logger.error('Redis Client Error', err))
    client.on('connect', () => logger.info('Redis socket connecting'))
    client.on('ready', () => logger.info('Redis client ready'))
    client.on('reconnecting', () => logger.info('Redis client reconnecting'))
    client.on('end', () => logger.info('Redis connection closed'))
  }

  return client
}

export async function connectRedis(): Promise<RedisClientType> {
  const redis = getRedisClient()

  if (!redis.isOpen) {
    await redis.connect()
  }

  return redis
}

export async function disconnectRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit()
  }
}

export async function verifyRedis(): Promise<void> {
  const redis = await connectRedis()
  const pong = await redis.ping()
  logger.info('Redis ping response:', pong)
}
