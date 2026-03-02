import { DefaultSession } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    error?: string // NEW — 'RefreshTokenExpired' when refresh fails
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      roles: string[]
    }
  }

  interface User {
    id: string
    email: string
    accessToken: string
    refreshToken: string // NEW
    expiresInSeconds: number // NEW — seconds until access token expires
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    refreshToken: string // NEW
    accessTokenExp: number // NEW — epoch ms when access token expires
    error?: string // NEW
    id: string
    roles: string[]
  }
}
