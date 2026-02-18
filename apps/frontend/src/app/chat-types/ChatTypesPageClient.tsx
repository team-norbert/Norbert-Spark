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
    confirmDialogOpen,
    dialogError,
    error,
    handleCancelSave,
    handleCloseDialogError,
    handleCloseErrorMessage,
    handleCloseSuccessMessage,
    handleConfirmSave,
    handlePaginationChange,
    handleProcessRowUpdate,
    handleProcessRowUpdateError,
    handleSearchChange,
    loading,
    paginationModel,
    pendingEdit,
    rowCount,
    savingEdit,
    searchQuery,
    successMessage,
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
      confirmDialogOpen={confirmDialogOpen}
      dialogError={dialogError}
      error={error}
      loading={loading}
      searchQuery={searchQuery}
      paginationModel={paginationModel}
      rowCount={rowCount}
      onSearchChange={handleSearchChange}
      onPaginationChange={handlePaginationChange}
      onCloseDialogError={handleCloseDialogError}
      onCloseErrorMessage={handleCloseErrorMessage}
      onCloseSuccessMessage={handleCloseSuccessMessage}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
      onProcessRowUpdate={handleProcessRowUpdate}
      onProcessRowUpdateError={handleProcessRowUpdateError}
      onConfirmSave={handleConfirmSave}
      onCancelSave={handleCancelSave}
      pendingEdit={pendingEdit}
      savingEdit={savingEdit}
      successMessage={successMessage}
    />
  )
}
