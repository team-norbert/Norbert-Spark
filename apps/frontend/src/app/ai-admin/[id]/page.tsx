import { cookies } from 'next/headers.js'
import { redirect } from 'next/navigation.js'

import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

async function hasAnyRole(allowedRoles: string[]): Promise<boolean> {
  const cookieStore = await cookies()
  const roleCookie = cookieStore.get('role')
  if (!roleCookie?.value) {
    return false
  }

  const userRoles = roleCookie.value.split(',').map((role: string) => role.trim())
  return userRoles.some((role: string) => allowedRoles.includes(role))
}

export default async function AIAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const isAuthorized = await hasAnyRole(['admin', 'ai-admin'])
  if (!isAuthorized) {
    redirect('/unauthorized')
  }
  return <AIOptionsForm chatTypeId={id} />
}
