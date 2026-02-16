import 'modern-normalize/modern-normalize.css'
import 'streamdown/styles.css'

import type { Metadata } from 'next'
import React from 'react'

import { QueryProvider } from './providers/QueryProvider.js'
import { SessionProvider } from './providers/SessionProvider.js'
import ThemeRegistry from './ThemeRegistry.js'

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <QueryProvider>
            <ThemeRegistry>{children}</ThemeRegistry>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
