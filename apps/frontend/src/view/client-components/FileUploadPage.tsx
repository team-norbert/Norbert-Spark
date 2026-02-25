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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'
import type { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

import type { UploadedFile } from '@/view/hooks/useFileUpload.js'

import type { CreateVectorStoreFormData } from './CreateVectorStoreForm.js'
import { CreateVectorStoreForm } from './CreateVectorStoreForm.js'
import { ExtractedDataDisplay } from './ExtractedDataDisplay.js'
import { PageHeader } from './PageHeader.js'

type ExtractedInvoiceData = z.infer<typeof pdfSchema>

interface FileUploadPageText {
  title: string
  subtitle: string
}

interface FileUploadPageTestIds {
  fileInput: string
}

interface FileUploadPageProps {
  uploadedFiles: UploadedFile[]
  dragActive: boolean
  error: string | null
  isUploading: boolean
  isExtracting: boolean
  extractedData: ExtractedInvoiceData[]
  text: FileUploadPageText
  testIds: FileUploadPageTestIds
  flow: 'extract' | 'rag'
  showRagForm?: boolean
  ragFileKeys?: string[]
  chatTypeId?: string
  onSubmitVectorStore?: (data: CreateVectorStoreFormData) => void
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
 *   isUploading={false}
 *   isExtracting={false}
 *   extractedData={[]}
 *   text={{ title: 'Upload Files', subtitle: 'Drag and drop PDF or ZIP files to upload.' }}
 *   testIds={{ fileInput: 'file-upload-input' }}
 *   onDrag={handleDrag}
 *   onDrop={handleDrop}
 *   onFileInputChange={handleFileInputChange}
 *   onRemoveFile={removeFile}
 *   onClearAllFiles={clearAllFiles}
 *   onProcessFiles={processFiles}
 *   onClearError={clearError}
 *   onNavigateHome={() => router.push('/dashboard')}
 *   onSignOut={() => signOut()}
 * />
 * ```
 */
export function FileUploadPage({
  chatTypeId,
  dragActive,
  error,
  extractedData,
  flow,
  isExtracting,
  isUploading,
  onClearAllFiles,
  onClearError,
  onDrag,
  onDrop,
  onFileInputChange,
  onNavigateHome,
  onProcessFiles,
  onRemoveFile,
  onSignOut,
  onSubmitVectorStore,
  ragFileKeys,
  showRagForm,
  testIds,
  text,
  uploadedFiles,
}: FileUploadPageProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // eslint-disable-next-line security/detect-object-injection -- Safe: i is computed from Math.floor and bounded by sizes array length
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader title={text.title} onNavigateHome={onNavigateHome} onSignOut={onSignOut} />

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {text.subtitle}
      </Typography>

      {flow === 'extract' && isExtracting && (
        <Box sx={{ mb: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Extracting data from files...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This may take a few moments
                </Typography>
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {flow === 'extract' && extractedData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {extractedData.map((data, index) => (
            <ExtractedDataDisplay key={index} data={data} fileName={`PDF ${index + 1}`} />
          ))}
        </Box>
      )}

      <Card elevation={3}>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onProcessFiles()
            }}
            encType="multipart/form-data"
          >
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
                data-testid={testIds.fileInput}
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
                  <Button
                    size="small"
                    color="error"
                    onClick={onClearAllFiles}
                    disabled={isUploading}
                  >
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
                          disabled={isUploading}
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
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        <ListItemIcon>
                          <DescriptionIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={uploadedFile.file.name}
                          secondary={
                            <>
                              {formatFileSize(uploadedFile.file.size)}
                              {uploadedFile.uploadProgress !== undefined &&
                                uploadedFile.uploadProgress < 100 && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                  >
                                    • Uploading: {uploadedFile.uploadProgress}%
                                  </Typography>
                                )}
                              {uploadedFile.uploadProgress === 100 && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="success.main"
                                  sx={{ ml: 1 }}
                                >
                                  • Upload complete
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </Box>
                      {uploadedFile.uploadProgress !== undefined &&
                        uploadedFile.uploadProgress < 100 && (
                          <Box sx={{ width: '100%', mt: 1, pr: 7 }}>
                            <LinearProgress
                              variant="determinate"
                              value={uploadedFile.uploadProgress}
                            />
                          </Box>
                        )}
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  type="submit"
                  sx={{ mt: 2 }}
                  disabled={uploadedFiles.length === 0 || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Process Files'}
                </Button>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>

      {flow === 'rag' && showRagForm && (
        <CreateVectorStoreForm
          fileKeys={ragFileKeys ?? []}
          initialChatTypeId={chatTypeId}
          onSubmit={onSubmitVectorStore}
        />
      )}
    </Container>
  )
}
