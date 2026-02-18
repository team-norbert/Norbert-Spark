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
import { useEffect, useState } from 'react'

import type { ChatType } from '@/domain/ai/chat-config.js'

import { PageHeader } from './PageHeader.js'

/**
 * Holds the before/after row state for a cell edit that is awaiting user
 * confirmation before being persisted to the API.
 */
interface PendingEdit {
  newRow: GridRowModel
  oldRow: GridRowModel
  field: string
}

/**
 * Returns `true` when a chat-type name fails validation.
 * A valid name must be between 1 and 200 characters (inclusive).
 *
 * @param value - The raw string value entered by the user.
 * @returns `true` if the value is invalid, `false` if it is acceptable.
 */
export const isNameInvalid = (value: string): boolean =>
  !value || value.length < 1 || value.length > 200

/**
 * Returns `true` when a SEO-friendly ID fails validation.
 * A valid ID must conform to kebab-case: lowercase letters, digits, and
 * single hyphens as word separators (1–200 characters, no leading/trailing
 * hyphens, no consecutive hyphens).
 *
 * Delegates to {@link validateKebabCase} from `@norberts-spark/shared` for
 * the kebab-case pattern check, and additionally enforces the 1–200 character
 * length constraint.
 *
 * @param value - The raw string value entered by the user.
 * @returns `true` if the value is invalid, `false` if it is acceptable.
 */
export const isSeoFriendlyIdInvalid = (value: string): boolean =>
  !value || value.length < 1 || value.length > 200 || !validateKebabCase(value)

/**
 * Returns `true` when a chat-type description fails validation.
 * A valid description must be between 1 and 500 characters (inclusive).
 *
 * @param value - The raw string value entered by the user.
 * @returns `true` if the value is invalid, `false` if it is acceptable.
 */
export const isDescriptionInvalid = (value: string): boolean =>
  !value || value.length < 1 || value.length > 500

/**
 * Returns a human-readable validation error message for an editable DataGrid
 * field, or `undefined` when the value is valid.
 *
 * Supports the three editable fields: `name`, `seoFriendlyId`, and
 * `description`. Unknown field names always return `undefined`.
 *
 * @param field - The DataGrid column field name being validated.
 * @param value - The current cell value as a string.
 * @returns An error message string when invalid, or `undefined` when valid.
 */
export const getValidationMessage = (field: string, value: string): string | undefined => {
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

/**
 * Inline edit cell renderer used by the MUI X DataGrid for the `name`,
 * `seoFriendlyId`, and `description` columns.
 *
 * Runs field validation on every render and notifies the parent
 * `ChatTypesPage` via `onValidationChange` so the validation message can be
 * surfaced in the page-level warning Alert. The notification is deferred to
 * a `useEffect` to avoid calling `setState` during the DataGrid render phase.
 *
 * The two props are `params` (standard MUI X `GridRenderEditCellParams`) and
 * `onValidationChange` (called with the current error message, or `null` when
 * the value is valid).
 */
export function EditCell({
  onValidationChange,
  params,
}: {
  onValidationChange: (message: string | null) => void
  params: GridRenderEditCellParams
}) {
  const value = (params.value as string) ?? ''
  const message = getValidationMessage(params.field, value)

  useEffect(() => {
    onValidationChange(message ?? null)
  }, [message, onValidationChange])

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
      error={!!message}
      size="small"
      fullWidth
    />
  )
}

/**
 * Props for the {@link ChatTypesPage} presentational component.
 *
 * All data and callbacks are supplied by `useChatTypesPage` via
 * `ChatTypesPageClient`, keeping this component free of business logic.
 */
interface ChatTypesPageProps {
  /** The list of chat types to display in the DataGrid. */
  chatTypes: readonly ChatType[]
  /** API or fetch error message to display in the error Alert, or `null`. */
  error: string | null
  /** When `true` the DataGrid shows its loading overlay. */
  loading: boolean
  /** Current value of the search input field. */
  searchQuery: string
  /** Current MUI DataGrid pagination model (page index + page size). */
  paginationModel: GridPaginationModel
  /** Total number of rows across all pages (used for server-side pagination). */
  rowCount: number
  /** Called whenever the user changes the search input value. */
  onSearchChange: (query: string) => void
  /** Called whenever the user changes the page or page size. */
  onPaginationChange: (model: GridPaginationModel) => void
  /** Called when the user closes the error Alert. */
  onCloseErrorMessage: () => void
  /** Called when the user clicks the home navigation button. */
  onNavigateHome: () => void
  /** Called when the user clicks the sign-out button. */
  onSignOut: () => void
  /**
   * Called by the DataGrid `processRowUpdate` prop when a cell edit is
   * committed. Returns a Promise resolving to the accepted row.
   */
  onProcessRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>
  /** Called by the DataGrid when `processRowUpdate` throws an error. */
  onProcessRowUpdateError: (error: Error) => void
  /** Controls whether the save-confirmation Dialog is open. */
  confirmDialogOpen: boolean
  /** The pending cell edit awaiting confirmation, or `null` when none. */
  pendingEdit: PendingEdit | null
  /** Called when the user confirms the save in the Dialog (clicks Yes). */
  onConfirmSave: () => void
  /** Called when the user cancels the save in the Dialog (clicks No). */
  onCancelSave: () => void
  /** When `true` the Dialog buttons are disabled and a spinner is shown. */
  savingEdit: boolean
  /** Success message to display after a successful save, or `null`. */
  successMessage: string | null
  /** Called when the user closes the success Alert. */
  onCloseSuccessMessage: () => void
}

/**
 * Presentational component for the Chat Types configuration page.
 *
 * Follows the DDD view-layer contract: all business logic and server
 * interactions live in `useChatTypesPage`; this component is responsible
 * only for rendering.
 *
 * Features:
 * - Server-paginated MUI X DataGrid showing all {@link ChatType} records.
 * - Inline editing of `name`, `seoFriendlyId`, and `description` cells,
 *   with live field validation surfaced via a page-level warning Alert.
 * - Confirmation Dialog before persisting any cell edit to the API.
 * - Success and error Alerts for API response feedback.
 * - Client-side search input (filtering is handled server-side via
 *   `onSearchChange`).
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
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const renderEditCell = (params: GridRenderEditCellParams) => (
    <EditCell params={params} onValidationChange={setValidationMessage} />
  )

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
        return { ...params.props, error: hasError }
      },
      renderEditCell: renderEditCell,
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
        return { ...params.props, error: hasError }
      },
      renderEditCell: renderEditCell,
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
        return { ...params.props, error: hasError }
      },
      renderEditCell: renderEditCell,
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

      {validationMessage && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          onClose={() => setValidationMessage(null)}
          data-testid="validation-alert"
        >
          {validationMessage}
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
