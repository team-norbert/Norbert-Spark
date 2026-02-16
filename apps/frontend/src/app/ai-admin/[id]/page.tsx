import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth/auth.js'
import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

export default async function AIAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const isAuthorized = await hasAnyRole(['admin', 'ai-admin'])
  if (!isAuthorized) {
    const searchParams = new URLSearchParams({
      callbackUrl: `/ai-admin/${id}`,
      error: 'unauthorized',
    })
    redirect(`/signin?${searchParams.toString()}`)
  }
  return <AIOptionsForm chatTypeId={id} />
}
