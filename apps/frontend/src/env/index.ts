export { env as serverEnv } from './server.js'

// Re-export the server env as the default 'env' for convenience
// This matches the t3-oss convention where server env is the primary export
export { env } from './server.js'
