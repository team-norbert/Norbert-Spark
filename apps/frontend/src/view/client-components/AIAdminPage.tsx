'use client'

import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { PageHeader } from './PageHeader.js'

interface AIAdminPageProps {
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
  onChangeOptions: (id: string) => void
}

/**
 * AI Admin page component following DDD architecture.
 * This is a presentational component - all logic is handled by the hook.
 * Displays AI chat configuration in a DataGrid.
 */
export function AIAdminPage({
  chatTypes,
  error,
  loading,
  onChangeOptions,
  onCloseErrorMessage,
  onNavigateHome,
  onPaginationChange,
  onSearchChange,
  onSignOut,
  paginationModel,
  rowCount,
  searchQuery,
}: AIAdminPageProps) {
  // Define columns for the DataGrid
  const columns: GridColDef<ChatType>[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 350,
      flex: 2,
    },
    {
      field: 'seoFriendlyId',
      headerName: 'SEO Friendly ID',
      width: 200,
      flex: 1,
    },
    {
      field: 'seoFriendlyBase64Id',
      headerName: 'Base64 ID',
      width: 200,
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (value) => {
        if (!value) return ''
        const date = new Date(value)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 180,
      valueFormatter: (value) => {
        if (!value) return ''
        const date = new Date(value)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
      },
    },
    {
      field: 'actions',
      headerName: 'Click to change options',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          data-testid={`change-options-${params.row.id}`}
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => {
            onChangeOptions(params.row.id)
          }}
        >
          Change Options
        </Button>
      ),
    },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} id="ai-admin-page" data-testid="ai-admin-page">
      <header>
        <PageHeader
          title="AI Chat Configuration"
          onNavigateHome={onNavigateHome}
          onSignOut={onSignOut}
        />
      </header>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          View and manage AI chat types and their configurations
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
        Note: This page displays read-only AI chat configuration data.
      </Typography>
    </Container>
  )
}
