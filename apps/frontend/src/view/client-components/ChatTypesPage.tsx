'use client'

import { Alert, Box, Container, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useState } from 'react'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { PageHeader } from './PageHeader.js'

interface ChatTypesPageProps {
  chatTypes: readonly ChatType[]
  error: string | null
  loading: boolean
  searchQuery: string
  paginationModel: GridPaginationModel
  rowCount: number
  onSearchChange: (query: string) => void
  onPaginationChange: (model: GridPaginationModel) => void
  onCloseErrorMessage: () => void
  onNavigateHome: () => void
  onSignOut: () => void
}

/**
 * Chat Types page component following DDD architecture.
 * This is a presentational component - all logic is handled by the hook.
 * Displays chat types configuration in a DataGrid.
 */
export function ChatTypesPage({
  chatTypes,
  error,
  loading,
  onCloseErrorMessage,
  onNavigateHome,
  onPaginationChange,
  onSearchChange,
  onSignOut,
  paginationModel,
  rowCount,
  searchQuery,
}: ChatTypesPageProps) {
  // State for inline editing
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editedValue, setEditedValue] = useState<string>('')

  // Handle entering edit mode
  const handleStartEdit = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field })
    setEditedValue(currentValue)
  }

  // Handle exiting edit mode and saving
  const handleSaveEdit = () => {
    if (!editingCell) return
    // TODO: Implement API call to save the edited value
    console.log(
      'Saving edited value:',
      editedValue,
      'for field:',
      editingCell.field,
      'id:',
      editingCell.id
    )
    setEditingCell(null)
    setEditedValue('')
  }

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditedValue('')
  }

  // Define columns for the DataGrid
  const columns: GridColDef<ChatType>[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 280,
      flex: 1,
      renderCell: (params) => (
        <Tooltip
          title={params.value || ''}
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                fontSize: '1rem',
                maxWidth: 500,
              },
            },
          }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        const isEditing = editingCell?.id === params.row.id && editingCell?.field === 'name'

        if (isEditing) {
          return (
            <TextField
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              fullWidth
              size="small"
              variant="standard"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          )
        }

        return (
          <Tooltip
            title={params.value || ''}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '1rem',
                  maxWidth: 500,
                },
              },
            }}
          >
            <Box
              onClick={() => handleStartEdit(params.row.id, 'name', params.value || '')}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'seoFriendlyId',
      headerName: 'SEO Friendly ID',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        const isEditing =
          editingCell?.id === params.row.id && editingCell?.field === 'seoFriendlyId'

        if (isEditing) {
          return (
            <TextField
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              fullWidth
              size="small"
              variant="standard"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          )
        }

        return (
          <Tooltip
            title={params.value || ''}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '1rem',
                  maxWidth: 500,
                },
              },
            }}
          >
            <Box
              onClick={() => handleStartEdit(params.row.id, 'seoFriendlyId', params.value || '')}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'seoFriendlyBase64Id',
      headerName: 'Base64 ID',
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <Tooltip
          title={params.value || ''}
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                fontSize: '1rem',
                maxWidth: 500,
              },
            },
          }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 350,
      flex: 2,
      renderCell: (params) => {
        const isEditing = editingCell?.id === params.row.id && editingCell?.field === 'description'

        if (isEditing) {
          return (
            <TextField
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              fullWidth
              size="small"
              variant="standard"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          )
        }

        return (
          <Tooltip
            title={params.value || ''}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '1rem',
                  maxWidth: 500,
                },
              },
            }}
          >
            <Box
              onClick={() => handleStartEdit(params.row.id, 'description', params.value || '')}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return ''
        const date = new Date(params.value)
        const formattedDate = isNaN(date.getTime()) ? '' : date.toLocaleDateString()
        return (
          <Tooltip
            title={formattedDate}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '1rem',
                  maxWidth: 500,
                },
              },
            }}
          >
            <Box
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {formattedDate}
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return ''
        const date = new Date(params.value)
        const formattedDate = isNaN(date.getTime()) ? '' : date.toLocaleDateString()
        return (
          <Tooltip
            title={formattedDate}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '1rem',
                  maxWidth: 500,
                },
              },
            }}
          >
            <Box
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {formattedDate}
            </Box>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <header>
        <PageHeader
          title="Chat Types Configuration"
          onNavigateHome={onNavigateHome}
          onSignOut={onSignOut}
        />
      </header>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          View and manage chat types and their configurations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onCloseErrorMessage}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          label="Search chat types"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: 300 }}
          placeholder="Search by name, description, or SEO ID"
          helperText="Search through all chat types"
        />
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={chatTypes}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="client"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationChange}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: 'default',
            },
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Note: This page displays read-only chat types configuration data.
      </Typography>
    </Container>
  )
}
