import { redirect } from 'next/navigation.js'

import { hasAnyRole } from '@/lib/auth.js'
import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

export default async function AIAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const isAuthorized = await hasAnyRole(['admin', 'ai-admin'])
  if (!isAuthorized) {
    redirect('/signin?callbackUrl=/ai-admin/' + id + '&error=unauthorized')
  }
  return <AIOptionsForm chatTypeId={id} />
}
