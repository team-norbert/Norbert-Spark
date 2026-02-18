import type { GridPaginationModel, GridRowModel } from '@mui/x-data-grid'
import { useCallback, useState } from 'react'

import type { ChatType } from '@/domain/ai/chat-config.js'
import { updateChatType } from '@/infrastructure/serverActions/updateChatType.server.js'

import { useAIChatConfig } from './queries/useAIChatConfig.js'

export interface PendingEdit {
  newRow: GridRowModel
  oldRow: GridRowModel
  field: string
}

interface UseChatTypesPageReturn {
  chatTypes: readonly ChatType[]
  error: string | null
  loading: boolean
  searchQuery: string
  paginationModel: GridPaginationModel
  rowCount: number
  handlePaginationChange: (model: GridPaginationModel) => void
  handleSearchChange: (query: string) => void
  handleCloseErrorMessage: () => void
  handleProcessRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>
  handleProcessRowUpdateError: (error: Error) => void
  hasQueryError: boolean
  confirmDialogOpen: boolean
  pendingEdit: PendingEdit | null
  handleConfirmSave: () => void
  handleCancelSave: () => void
  savingEdit: boolean
  successMessage: string | null
  handleCloseSuccessMessage: () => void
  dialogError: string | null
  handleCloseDialogError: () => void
}

/**
 * Custom hook for Chat Types page logic following DDD architecture.
 * Handles chat types configuration data fetching, pagination, search, and error states.
 * Uses TanStack Query for automatic caching, refetching, and state management.
 * Implements server-side pagination where the hook slices data and tracks the total count.
 */
export function useChatTypesPage(): UseChatTypesPageReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  // Store a resolver so processRowUpdate can await the dialog result
  const [pendingResolver, setPendingResolver] = useState<{
    resolve: (row: GridRowModel) => void
  } | null>(null)

  // Use TanStack Query hook for data fetching with automatic caching
  const { chatTypes, error, isLoading, refetch } = useAIChatConfig()

  // Track if the current error has been dismissed
  const currentErrorMessage = error?.message || null
  const isDismissed = dismissedErrorMessage === currentErrorMessage

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Reset to first page when search changes
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model)
  }

  const handleCloseErrorMessage = () => {
    setErrorMessage(null)
    // Store the dismissed error message to track which error was dismissed
    setDismissedErrorMessage(currentErrorMessage)
  }

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null)
  }

  const handleCloseDialogError = () => {
    setDialogError(null)
  }

  /**
   * Called by the DataGrid when a row edit is committed.
   * Opens a confirmation dialog and returns a promise that resolves
   * with either the new row (on save) or the old row (on cancel).
   */
  const handleProcessRowUpdate = useCallback(
    (newRow: GridRowModel, oldRow: GridRowModel): Promise<GridRowModel> => {
      // Prevent new edits if there's already one being saved
      if (savingEdit) {
        return Promise.resolve(oldRow)
      }

      // Find which field changed by comparing known editable fields
      let changedField = ''
      if (newRow.name !== oldRow.name) {
        changedField = 'name'
      } else if (newRow.seoFriendlyId !== oldRow.seoFriendlyId) {
        changedField = 'seoFriendlyId'
      } else if (newRow.description !== oldRow.description) {
        changedField = 'description'
      }

      // If nothing actually changed, just return the row as-is
      if (!changedField) {
        return Promise.resolve(newRow)
      }

      // Clear any previous messages
      setSuccessMessage(null)
      setErrorMessage(null)
      setDialogError(null)

      return new Promise<GridRowModel>((resolve) => {
        setPendingEdit({ newRow, oldRow, field: changedField })
        setPendingResolver({ resolve })
        setConfirmDialogOpen(true)
      })
    },
    [savingEdit]
  )

  const handleConfirmSave = useCallback(async () => {
    if (!pendingEdit || !pendingResolver) return

    // Clear any previous dialog error before attempting save
    setDialogError(null)
    setSavingEdit(true)

    try {
      const { field, newRow } = pendingEdit
      const payload: { id: string; name?: string; seoFriendlyId?: string; description?: string } = {
        id: newRow.id as string,
      }
      if (field === 'name') payload.name = newRow.name as string
      if (field === 'seoFriendlyId') payload.seoFriendlyId = newRow.seoFriendlyId as string
      if (field === 'description') payload.description = newRow.description as string

      await updateChatType(payload)
      setSuccessMessage('Update successful')
      pendingResolver.resolve(pendingEdit.newRow)
      await refetch()

      // Only close dialog and clear state on success
      setConfirmDialogOpen(false)
      setPendingEdit(null)
      setPendingResolver(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      // Set error in dialog instead of page-level error
      setDialogError(message)
      // Do NOT resolve the promise or close the dialog - keep it open for retry
    } finally {
      setSavingEdit(false)
    }
  }, [pendingEdit, pendingResolver, refetch])

  const handleCancelSave = useCallback(() => {
    if (pendingResolver && pendingEdit) {
      pendingResolver.resolve(pendingEdit.oldRow)
    }
    setConfirmDialogOpen(false)
    setPendingEdit(null)
    setPendingResolver(null)
    setDialogError(null)
  }, [pendingEdit, pendingResolver])

  const handleProcessRowUpdateError = useCallback((error: Error) => {
    setErrorMessage(error.message || 'An error occurred while updating the row')
  }, [])

  // Filter chat types based on search query (client-side filtering)
  const filteredChatTypes = searchQuery
    ? chatTypes.filter((chatType) => {
        const query = searchQuery.trim().toLowerCase()
        return (
          chatType.name.toLowerCase().includes(query) ||
          chatType.description.toLowerCase().includes(query) ||
          chatType.seoFriendlyId.toLowerCase().includes(query) ||
          chatType.id.toLowerCase().includes(query)
        )
      })
    : chatTypes

  // Calculate pagination - hook handles slicing for server-side pagination mode
  const startIndex = paginationModel.page * paginationModel.pageSize
  const endIndex = startIndex + paginationModel.pageSize
  const paginatedChatTypes = filteredChatTypes.slice(startIndex, endIndex)

  // Determine which error to show - prefer query error unless dismissed
  const hasQueryError = Boolean(currentErrorMessage)
  const displayError = hasQueryError && !isDismissed ? currentErrorMessage : errorMessage

  return {
    chatTypes: paginatedChatTypes,
    error: displayError,
    loading: isLoading,
    searchQuery,
    paginationModel,
    rowCount: filteredChatTypes.length,
    handlePaginationChange,
    handleSearchChange,
    handleCloseErrorMessage,
    handleProcessRowUpdate,
    handleProcessRowUpdateError,
    hasQueryError,
    confirmDialogOpen,
    pendingEdit,
    handleConfirmSave,
    handleCancelSave,
    savingEdit,
    successMessage,
    handleCloseSuccessMessage,
    dialogError,
    handleCloseDialogError,
  }
}
