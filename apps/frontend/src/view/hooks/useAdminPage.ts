import type { GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid'
import { useState } from 'react'

import type { User } from '@/domain/user/user.js'
import { deleteUsersAction } from '@/infrastructure/serverActions/deleteUsers.server.js'
import { useUsers } from '@/view/hooks/queries/useUsers.js'

interface UseAdminPageReturn {
  currentUserRole: 'admin' | 'moderator' | 'user'
  error: string | null
  successMessage: string | null
  handlePaginationChange: (model: GridPaginationModel) => void
  handleSearchChange: (query: string) => void
  handleSelectionChange: (ids: GridRowSelectionModel) => void
  handleDeleteUsers: () => Promise<void>
  handleDeleteClick: () => void
  handleConfirmDelete: () => void
  handleCancelDelete: () => void
  handleCloseSuccessMessage: () => void
  handleCloseErrorMessage: () => void
  loading: boolean
  paginationModel: GridPaginationModel
  rowCount: number
  searchQuery: string
  selectedUserIds: GridRowSelectionModel
  showConfirmDialog: boolean
  users: readonly User[]
  isDeleting: boolean
}

/**
 * Custom hook for admin page logic following DDD architecture.
 * Handles user data fetching, pagination, search, and error states.
 * Uses TanStack Query for automatic caching, refetching, and state management.
 */
export function useAdminPage(): UseAdminPageReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [selectedUserIds, setSelectedUserIds] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // TODO: Replace with actual user role from authentication
  const currentUserRole = 'admin' as 'admin' | 'moderator' | 'user'

  // Use TanStack Query hook for data fetching with automatic caching
  const { error, isLoading, refetch, total, users } = useUsers({
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
  })

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model)
  }

  const handleSelectionChange = (ids: GridRowSelectionModel) => {
    setSelectedUserIds(ids)
  }

  const handleDeleteClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = () => {
    setShowConfirmDialog(false)
    void handleDeleteUsers()
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
  }

  const handleDeleteUsers = async () => {
    // Clear any previous messages
    setSuccessMessage(null)
    setErrorMessage(null)

    // Get array of user IDs from the selection
    const userIdsToDelete = Array.from(selectedUserIds.ids) as string[]

    if (userIdsToDelete.length === 0) {
      setErrorMessage('No users selected for deletion')
      return
    }

    try {
      setIsDeleting(true)

      // Call the server action
      const result = await deleteUsersAction(userIdsToDelete)

      if (result.success) {
        setSuccessMessage(result.message)
        // Clear selection after successful delete
        setSelectedUserIds({ type: 'include', ids: new Set() })
        // Refetch users to update the list
        await refetch()
      } else {
        setErrorMessage(result.message)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null)
  }

  const handleCloseErrorMessage = () => {
    setErrorMessage(null)
  }

  return {
    currentUserRole,
    error: error || errorMessage,
    successMessage,
    handlePaginationChange,
    handleSearchChange,
    handleSelectionChange,
    handleDeleteUsers,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseSuccessMessage,
    handleCloseErrorMessage,
    loading: isLoading,
    paginationModel,
    rowCount: total,
    searchQuery,
    selectedUserIds,
    showConfirmDialog,
    users,
    isDeleting,
  }
}
