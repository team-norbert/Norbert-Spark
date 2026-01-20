'use client'

import { AIAdminPage } from '@/view/client-components/AIAdminPage.js'
import { useAIAdminPage } from '@/view/hooks/useAIAdminPage.js'

/**
 * Client component wrapper for AI Admin page
 * Connects the presentational component with the business logic hook
 */
export function AIAdminPageClient() {
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
    />
  )
}
