import type { GridPaginationModel, GridRowModel } from '@mui/x-data-grid'
import { useState } from 'react'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { useAIChatConfig } from './queries/useAIChatConfig.js'

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
  hasQueryError: boolean
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

  // Use TanStack Query hook for data fetching with automatic caching
  const { chatTypes, error, isLoading } = useAIChatConfig()

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

  const handleProcessRowUpdate = async (
    newRow: GridRowModel,
    oldRow: GridRowModel
  ): Promise<GridRowModel> => {
    try {
      // Editing is currently not persisted to the server.
      // Inform the user and revert the change so data is not misleadingly shown as saved.
      setErrorMessage('Editing chat types is not yet supported. Your changes were not saved.')
      return oldRow
    } catch {
      // In case any unexpected error occurs, also revert to the previous row.
      return oldRow
    }
  }

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
    hasQueryError,
  }
}
