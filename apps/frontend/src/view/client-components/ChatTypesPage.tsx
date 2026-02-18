'use client'

import { Alert, Box, Container, TextField, Tooltip, Typography } from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridPreProcessEditCellProps,
  type GridRowModel,
} from '@mui/x-data-grid'

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
  onProcessRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>
}

/**
 * Chat Types page component following DDD architecture.
 * This is a presentational component - all logic is handled by the hook.
 * Displays chat types configuration in a read-only DataGrid.
 */
export function ChatTypesPage({
  chatTypes,
  error,
  loading,
  onCloseErrorMessage,
  onNavigateHome,
  onPaginationChange,
  onProcessRowUpdate,
  onSearchChange,
  onSignOut,
  paginationModel,
  rowCount,
  searchQuery,
}: ChatTypesPageProps) {
  // Validation functions for editable fields
  const validateName = (params: GridPreProcessEditCellProps) => {
    const value = params.props.value as string
    const hasError = !value || value.length < 1 || value.length > 200
    return {
      ...params.props,
      error: hasError,
      helperText: hasError ? 'Name must be between 1 and 200 characters' : undefined,
    }
  }

  const validateSeoFriendlyId = (params: GridPreProcessEditCellProps) => {
    const value = params.props.value as string
    // eslint-disable-next-line security/detect-unsafe-regex
    const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    const hasError = !value || value.length < 1 || value.length > 200 || !kebabCaseRegex.test(value)
    return {
      ...params.props,
      error: hasError,
      helperText: hasError
        ? 'SEO ID must be 1-200 chars in kebab-case format (e.g., my-chat-type)'
        : undefined,
    }
  }

  const validateDescription = (params: GridPreProcessEditCellProps) => {
    const value = params.props.value as string
    const hasError = !value || value.length < 1 || value.length > 500
    return {
      ...params.props,
      error: hasError,
      helperText: hasError ? 'Description must be between 1 and 500 characters' : undefined,
    }
  }

  // Define columns for the DataGrid
  const columns: GridColDef[] = [
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
      editable: true,
      preProcessEditCellProps: validateName,
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
      field: 'seoFriendlyId',
      headerName: 'SEO Friendly ID',
      width: 200,
      flex: 1,
      editable: true,
      preProcessEditCellProps: validateSeoFriendlyId,
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
      editable: true,
      preProcessEditCellProps: validateDescription,
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
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationChange}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          processRowUpdate={onProcessRowUpdate}
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: 'default',
            },
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Note: Click on name, SEO friendly ID, or description cells to edit. Changes are saved
        automatically.
      </Typography>
    </Container>
  )
}
