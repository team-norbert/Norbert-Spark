'use client'

import { useRouter } from 'next/navigation.js'

import { ChatTypesPage } from '@/view/client-components/ChatTypesPage.js'
import { useChatTypesPage } from '@/view/hooks/useChatTypesPage.js'

/**
 * Client component wrapper for Chat Types page
 * Connects the presentational component with the business logic hook
 */
export function ChatTypesPageClient() {
  const router = useRouter()
  const {
    chatTypes,
    error,
    handleCloseErrorMessage,
    handlePaginationChange,
    handleSearchChange,
    loading,
    paginationModel,
    rowCount,
    searchQuery,
  } = useChatTypesPage()

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  return (
    <ChatTypesPage
      chatTypes={chatTypes}
      error={error}
      loading={loading}
      searchQuery={searchQuery}
      paginationModel={paginationModel}
      rowCount={rowCount}
      onSearchChange={handleSearchChange}
      onPaginationChange={handlePaginationChange}
      onCloseErrorMessage={handleCloseErrorMessage}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
    />
  )
}
