'use client'

import ChatIcon from '@mui/icons-material/Chat'
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation.js'
import { uuidv7 } from 'uuidv7'

import { PageHeader } from '@/view/client-components/PageHeader.js'
import { Wrapper } from '@/view/client-components/WrapperComponent.js'
import { useAIChatConfig } from '@/view/hooks/queries/useAIChatConfig.js'

/**
 * AI Chat landing page — chat type selection.
 *
 * Displays available chat types fetched via the existing useAIChatConfig hook.
 * On selection, navigates to /ai/{seoFriendlyId}/{newChatId}.
 */
export default function AIChatLandingPage() {
  const router = useRouter()
  const { chatTypes, error, isLoading } = useAIChatConfig()

  const handleSelectChatType = (seoFriendlyId: string) => {
    const newChatId = uuidv7()
    router.push(`/ai/${seoFriendlyId}/${newChatId}`)
  }

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = () => {
    router.push('/api/auth/signout')
  }

  return (
    <Wrapper>
      <PageHeader title="AI Chat" onNavigateHome={handleNavigateHome} onSignOut={handleSignOut} />

      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Choose a Chat Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select an AI assistant to start a new conversation.
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label="Loading chat types" />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load chat types. Please try again later.
          </Alert>
        )}

        {!isLoading && !error && chatTypes.length === 0 && (
          <Alert severity="info">No chat types available.</Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {chatTypes.map((chatType) => (
            <Card key={chatType.id} elevation={2}>
              <CardActionArea
                onClick={() => handleSelectChatType(chatType.seoFriendlyId)}
                aria-label={`Create new ${chatType.name} chat`}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <ChatIcon color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {chatType.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {chatType.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    </Wrapper>
  )
}
