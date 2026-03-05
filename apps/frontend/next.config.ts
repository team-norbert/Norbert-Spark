import { fileURLToPath } from 'node:url'

import { createJiti } from 'jiti'
import type { NextConfig } from 'next'
import path from 'path'

const jiti = createJiti(fileURLToPath(import.meta.url))

// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
jiti('./src/env')

/**
 * NOTE:
 * - Start with Report-Only in production to avoid breaking the site.
 * - Once you’ve validated it, switch to Content-Security-Policy.
 */
const csp = [
  "default-src 'self'",
  // If you can, avoid 'unsafe-inline' long-term. It's included here as a safe starting point for many Next apps.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  reactCompiler: true,
  reactStrictMode: true,
  // Optimize for production
  poweredByHeader: false,
  // Configure image optimization if needed
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // OPTION A: Start with Report-Only (recommended first step)
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          // OPTION B: Enforce CSP (turn this on after you validate)
          // { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
  // Redirect homepage to sign-in page
  async redirects() {
    return [
      {
        source: '/',
        destination: '/signin',
        permanent: false,
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Enable filesystem caching for `next dev`
    turbopackFileSystemCacheForDev: true,
    // Enable filesystem caching for `next build`
    turbopackFileSystemCacheForBuild: true,
  },
  // Set the workspace root for turbopack
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
}

export default nextConfig
