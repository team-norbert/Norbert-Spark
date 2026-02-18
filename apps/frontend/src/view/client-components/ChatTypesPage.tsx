'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridPreProcessEditCellProps,
  type GridRenderEditCellParams,
  type GridRowModel,
} from '@mui/x-data-grid'
import { validateKebabCase } from '@norberts-spark/shared'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { PageHeader } from './PageHeader.js'

interface PendingEdit {
  newRow: GridRowModel
  oldRow: GridRowModel
  field: string
}

// Exported pure validation predicates for testing
export const isNameInvalid = (value: string): boolean =>
  !value || value.length < 1 || value.length > 200

export const isSeoFriendlyIdInvalid = (value: string): boolean => !validateKebabCase(value)

export const isDescriptionInvalid = (value: string): boolean =>
  !value || value.length < 1 || value.length > 500

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
  onProcessRowUpdateError: (error: Error) => void
  confirmDialogOpen: boolean
  pendingEdit: PendingEdit | null
  onConfirmSave: () => void
  onCancelSave: () => void
  savingEdit: boolean
  successMessage: string | null
  onCloseSuccessMessage: () => void
}

/**
 * Chat Types page component following DDD architecture.
 * This is a presentational component - all logic is handled by the hook.
 * Displays chat types configuration in a read-only DataGrid.
 */
export function ChatTypesPage({
  chatTypes,
  confirmDialogOpen,
  error,
  loading,
  onCancelSave,
  onCloseErrorMessage,
  onCloseSuccessMessage,
  onConfirmSave,
  onNavigateHome,
  onPaginationChange,
  onProcessRowUpdate,
  onProcessRowUpdateError,
  onSearchChange,
  onSignOut,
  paginationModel,
  pendingEdit,
  rowCount,
  savingEdit,
  searchQuery,
  successMessage,
}: ChatTypesPageProps) {
  const getHelperText = (field: string, value: string): string | undefined => {
    if (field === 'name' && isNameInvalid(value)) {
      return 'Name must be between 1 and 200 characters'
    }
    if (field === 'seoFriendlyId' && isSeoFriendlyIdInvalid(value)) {
      return 'SEO Friendly ID must be between 1 and 200 characters, lowercase, words separated by hyphens, and contain only letters, numbers, and hyphens'
    }
    if (field === 'description' && isDescriptionInvalid(value)) {
      return 'Description must be between 1 and 500 characters'
    }
    return undefined
  }

  const editCell = (params: GridRenderEditCellParams) => {
    const value = (params.value as string) ?? ''
    const helperText = getHelperText(params.field, value)
    return (
      <TextField
        value={value}
        onChange={(e) =>
          params.api.setEditCellValue({
            id: params.id,
            field: params.field,
            value: e.target.value,
          })
        }
        error={!!helperText}
        helperText={helperText ?? ''}
        size="small"
        fullWidth
      />
    )
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
      preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        const hasError = isNameInvalid(params.props.value as string)
        return {
          ...params.props,
          error: hasError,
          helperText: hasError ? 'Name must be between 1 and 200 characters' : undefined,
        }
      },
      renderEditCell: editCell,
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
      preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        const hasError = isSeoFriendlyIdInvalid(params.props.value as string)
        return {
          ...params.props,
          error: hasError,
          helperText: hasError
            ? 'SEO Friendly ID must be lowercase, words separated by hyphens, and contain only letters, numbers, and hyphens'
            : undefined,
        }
      },
      renderEditCell: editCell,
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
      preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        const hasError = isDescriptionInvalid(params.props.value as string)
        return {
          ...params.props,
          error: hasError,
          helperText: hasError ? 'Description must be between 1 and 500 characters' : undefined,
        }
      },
      renderEditCell: editCell,
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

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={onCloseSuccessMessage}
          data-testid="success-alert"
        >
          {successMessage}
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
          onProcessRowUpdateError={onProcessRowUpdateError}
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: 'default',
            },
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Note: Click on name, SEO friendly ID, or description cells to edit.
      </Typography>

      <Dialog
        open={confirmDialogOpen}
        onClose={(_, reason) => {
          if (savingEdit && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            return
          }
          onCancelSave()
        }}
        aria-labelledby="confirm-save-dialog-title"
        data-testid="confirm-save-dialog"
      >
        <DialogTitle id="confirm-save-dialog-title">Confirm Edit</DialogTitle>
        <DialogContent>
          <DialogContentText>Do you want to save this text?</DialogContentText>
          {pendingEdit && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}
              data-testid="pending-edit-value"
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {pendingEdit.field}:
              </Typography>
              <Typography variant="body1">
                {String(pendingEdit.newRow[pendingEdit.field])}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelSave} disabled={savingEdit} data-testid="cancel-save-button">
            No
          </Button>
          <Button
            onClick={onConfirmSave}
            variant="contained"
            disabled={savingEdit}
            data-testid="confirm-save-button"
          >
            {savingEdit ? <CircularProgress size={20} /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
