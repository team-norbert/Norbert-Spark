'use client'

import { useRouter } from 'next/navigation.js'

import { AIAdminPage } from '@/view/client-components/AIAdminPage.js'
import { useAIAdminPage } from '@/view/hooks/useAIAdminPage.js'

/**
 * Client component wrapper for AI Admin page
 * Connects the presentational component with the business logic hook
 */
export function AIAdminPageClient() {
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
  } = useAIAdminPage()

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  const handleChangeOptions = (id: string) => {
    router.push(`/ai-admin/${id}`)
  }

  return (
    <AIAdminPage
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
      onChangeOptions={handleChangeOptions}
    />
  )
}
