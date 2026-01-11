'use client'
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowSelectionModel,
} from '@mui/x-data-grid'

import type { User } from '@/domain/user/user.js'

interface AdminPageProps {
  users: readonly User[]
  error: string | null
  successMessage: string | null
  loading: boolean
  searchQuery: string
  paginationModel: GridPaginationModel
  rowCount: number
  currentUserRole: 'admin' | 'moderator' | 'user'
  selectedUserIds: GridRowSelectionModel
  showConfirmDialog: boolean
  isDeleting: boolean
  onSearchChange: (query: string) => void
  onPaginationChange: (model: GridPaginationModel) => void
  onSelectionChange: (ids: GridRowSelectionModel) => void
  onDeleteClick: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onCloseSuccessMessage: () => void
  onCloseErrorMessage: () => void
}

/**
 * Admin page component following DDD architecture.
 * This is a presentational component - all logic is handled by the hook.
 */
export function AdminPage({
  currentUserRole,
  error,
  isDeleting,
  loading,
  onCancelDelete,
  onCloseErrorMessage,
  onCloseSuccessMessage,
  onConfirmDelete,
  onDeleteClick,
  onPaginationChange,
  onSearchChange,
  onSelectionChange,
  paginationModel,
  rowCount,
  searchQuery,
  selectedUserIds,
  showConfirmDialog,
  successMessage,
  users,
}: AdminPageProps) {
  // Define columns
  const columns: GridColDef<User>[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 200,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  // TODO: include API call to search by email as all emails must be unique
  // Filter users based on search query (searches name, email, and role)
  // Note: This is client-side filtering on the current page only
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentUserRole === 'admin'
            ? 'Manage user accounts and roles'
            : 'View user accounts (read-only access)'}
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={onCloseSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onCloseErrorMessage}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          label="Search users"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: 300 }}
          placeholder="Search by email"
          helperText="Search through all users"
        />
      </Box>

      <Box sx={{ height: '100%', width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationChange}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection={currentUserRole === 'admin'}
          disableRowSelectionOnClick
          rowSelectionModel={selectedUserIds}
          onRowSelectionModelChange={onSelectionChange}
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: currentUserRole === 'admin' ? 'pointer' : 'default',
            },
          }}
        />
      </Box>

      {currentUserRole === 'admin' && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            disabled={selectedUserIds.ids.size === 0}
            onClick={onDeleteClick}
            data-testid="delete-users-button"
          >
            Delete Users ({selectedUserIds.ids.size})
          </Button>
        </Box>
      )}

      <Dialog
        open={showConfirmDialog}
        onClose={onCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete{' '}
            {selectedUserIds.ids.size > 1 ? 'these users' : 'this user'}? All activity from{' '}
            {selectedUserIds.ids.size > 1 ? 'these users' : 'this user'} will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={onCancelDelete}
            disabled={isDeleting}
            data-testid="cancel-delete-button"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            data-testid="confirm-delete-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {currentUserRole === 'moderator' && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Note: You have read-only access. Contact an administrator to modify user data.
        </Typography>
      )}
    </Container>
  )
}
