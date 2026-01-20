import type { GridPaginationModel } from '@mui/x-data-grid'
import { useState } from 'react'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { useAIChatConfig } from './queries/useAIChatConfig.js'

interface UseAIAdminPageReturn {
  chatTypes: readonly ChatType[]
  error: string | null
  loading: boolean
  searchQuery: string
  paginationModel: GridPaginationModel
  rowCount: number
  handlePaginationChange: (model: GridPaginationModel) => void
  handleSearchChange: (query: string) => void
  handleCloseErrorMessage: () => void
}

/**
 * Custom hook for AI admin page logic following DDD architecture.
 * Handles AI chat configuration data fetching, pagination, search, and error states.
 * Uses TanStack Query for automatic caching, refetching, and state management.
 */
export function useAIAdminPage(): UseAIAdminPageReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Use TanStack Query hook for data fetching with automatic caching
  const { chatTypes, error, isLoading } = useAIChatConfig()
  console.log('chatTypes in useAIAdminPage', chatTypes)

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
  }

  // Filter chat types based on search query (client-side filtering)
  const filteredChatTypes = searchQuery
    ? chatTypes.filter((chatType) => {
        const query = searchQuery.toLowerCase()
        return (
          chatType.name.toLowerCase().includes(query) ||
          chatType.description.toLowerCase().includes(query) ||
          chatType.seoFriendlyId.toLowerCase().includes(query)
        )
      })
    : chatTypes

  // Calculate pagination
  const startIndex = paginationModel.page * paginationModel.pageSize
  const endIndex = startIndex + paginationModel.pageSize
  const paginatedChatTypes = filteredChatTypes.slice(startIndex, endIndex)

  return {
    chatTypes: paginatedChatTypes,
    error: error?.message || errorMessage,
    loading: isLoading,
    searchQuery,
    paginationModel,
    rowCount: filteredChatTypes.length,
    handlePaginationChange,
    handleSearchChange,
    handleCloseErrorMessage,
  }
}
