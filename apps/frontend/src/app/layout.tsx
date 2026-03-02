import 'modern-normalize/modern-normalize.css'
import 'streamdown/styles.css'
import './styles/globals.css'
import './styles/material.css'

import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import React from 'react'

import { SessionGuard } from '../view/client-components/SessionGuard.js'
import { QueryProvider } from './providers/QueryProvider.js'
import { SessionProvider } from './providers/SessionProvider.js'
import ThemeRegistry from './ThemeRegistry.js'

const robotoMono = Roboto_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: "Norbert's Spark",
  description: 'A monorepo built with PNPM and Turborepo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={robotoMono.variable}>
      <body>
        <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
          <SessionGuard>
            <QueryProvider>
              <ThemeRegistry>{children}</ThemeRegistry>
            </QueryProvider>
          </SessionGuard>
        </SessionProvider>
      </body>
    </html>
  )
}
