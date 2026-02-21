import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth/auth.js'

import { RagFilesPageClient } from './RagFilesPageClient.js'

interface RagFilesPageProps {
  params: {
    id: string
  }
}

/**
 * RAG Files page with role-based access control.
 * Only users with 'admin' or 'ai-admin' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function RagFilesPage({ params }: RagFilesPageProps) {
  const hasAccess = await hasAnyRole(['admin', 'ai-admin'])

  if (!hasAccess) {
    const searchParams = new URLSearchParams({
      callbackUrl: `/chat-types/rag-files/${params.id}`,
      error: 'unauthorized',
    })
    redirect(`/signin?${searchParams.toString()}`)
  }

  return <RagFilesPageClient />
}
