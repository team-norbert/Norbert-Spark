'use client'

import { AdminPage } from '@/view/client-components/AdminPage.js'
import { useAdminPage } from '@/view/hooks/useAdminPage.js'

/** Admin page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function AdminPageClient() {
  const {
    currentUserRole,
    error,
    handleCancelDelete,
    handleCloseErrorMessage,
    handleCloseSuccessMessage,
    handleConfirmDelete,
    handleDeleteClick,
    handlePaginationChange,
    handleSearchChange,
    handleSelectionChange,
    isDeleting,
    loading,
    paginationModel,
    rowCount,
    searchQuery,
    selectedUserIds,
    showConfirmDialog,
    successMessage,
    users,
  } = useAdminPage()

  return (
    <AdminPage
      users={users}
      error={error}
      successMessage={successMessage}
      loading={loading}
      searchQuery={searchQuery}
      paginationModel={paginationModel}
      rowCount={rowCount}
      currentUserRole={currentUserRole}
      selectedUserIds={selectedUserIds}
      showConfirmDialog={showConfirmDialog}
      isDeleting={isDeleting}
      onSearchChange={handleSearchChange}
      onPaginationChange={handlePaginationChange}
      onSelectionChange={handleSelectionChange}
      onDeleteClick={handleDeleteClick}
      onConfirmDelete={handleConfirmDelete}
      onCancelDelete={handleCancelDelete}
      onCloseSuccessMessage={handleCloseSuccessMessage}
      onCloseErrorMessage={handleCloseErrorMessage}
    />
  )
}
