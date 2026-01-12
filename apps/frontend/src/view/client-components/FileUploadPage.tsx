'use client'

import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'

import type { UploadedFile } from '@/view/hooks/useFileUpload.js'

import { PageHeader } from './PageHeader.js'

interface FileUploadPageProps {
  uploadedFiles: UploadedFile[]
  dragActive: boolean
  error: string | null
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (id: string) => void
  onClearAllFiles: () => void
  onProcessFiles: () => void
  onClearError: () => void
  onNavigateHome: () => void
  onSignOut: () => void
}

/**
 * File Upload presentational component following DDD architecture.
 * Displays a drag-and-drop file upload interface with file validation.
 *
 * This is a "dumb" component that receives all data and callbacks via props.
 * No business logic should be in this component.
 *
 * @param {FileUploadPageProps} props - Component properties
 *
 * @example
 * ```tsx
 * <FileUploadPage
 *   uploadedFiles={files}
 *   dragActive={false}
 *   error={null}
 *   onDrop={handleDrop}
 *   onRemoveFile={removeFile}
 *   onProcessFiles={processFiles}
 *   onNavigateHome={() => router.push('/dashboard')}
 *   onSignOut={() => signOut()}
 * />
 * ```
 */
export function FileUploadPage({
  dragActive,
  error,
  onClearAllFiles,
  onClearError,
  onDrag,
  onDrop,
  onFileInputChange,
  onNavigateHome,
  onProcessFiles,
  onRemoveFile,
  onSignOut,
  uploadedFiles,
}: FileUploadPageProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader title="Extract Data" onNavigateHome={onNavigateHome} onSignOut={onSignOut} />

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload PDF or ZIP files for data extraction
      </Typography>

      <Card elevation={3}>
        <CardContent>
          <Paper
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            elevation={0}
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              backgroundColor: dragActive ? 'action.hover' : 'background.default',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.zip"
              multiple
              onChange={onFileInputChange}
              style={{ display: 'none' }}
              data-testid="extract-data-file-input"
            />
            <label
              htmlFor="file-upload"
              style={{ cursor: 'pointer', width: '100%', display: 'block' }}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag and drop files here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or
              </Typography>
              <Button variant="contained" component="span">
                Browse Files
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                Accepted file types: PDF, ZIP
              </Typography>
            </label>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={onClearError}>
              {error}
            </Alert>
          )}

          {uploadedFiles.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Uploaded Files ({uploadedFiles.length})</Typography>
                <Button size="small" color="error" onClick={onClearAllFiles}>
                  Clear All
                </Button>
              </Box>

              <List>
                {uploadedFiles.map((uploadedFile) => (
                  <ListItem
                    key={uploadedFile.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => onRemoveFile(uploadedFile.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <ListItemIcon>
                      <DescriptionIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={uploadedFile.file.name}
                      secondary={formatFileSize(uploadedFile.file.size)}
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                disabled={uploadedFiles.length === 0}
                onClick={onProcessFiles}
              >
                Process Files
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
