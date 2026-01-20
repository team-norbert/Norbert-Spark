import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function hasAnyRole(allowedRoles: string[]): Promise<boolean> {
  const cookieStore = cookies()
  const roleCookie = cookieStore.get('role')
  if (!roleCookie?.value) {
    return false
  }

  const userRoles = roleCookie.value.split(',').map((role) => role.trim())
  return userRoles.some((role) => allowedRoles.includes(role))
}

export default async function AIAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const isAuthorized = await hasAnyRole(['admin', 'ai-admin'])
  if (!isAuthorized) {
    redirect('/unauthorized')
  }
  return <AIOptionsForm chatTypeId={id} />
}
