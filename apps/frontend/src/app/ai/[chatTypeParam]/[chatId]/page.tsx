'use client'

import { use } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { AIChatView } from '@/view/client-components/AIChatView.js'
import { useAIChat } from '@/view/hooks/useAIChat.js'
import { useFetchChat } from '@/view/hooks/useFetchChat.js'

const logger = createLogger({ prefix: 'AIChatPage' })

/**
 * AI Chat page with two-segment dynamic route: /ai/[chatTypeParam]/[chatId]
 *
 * The chatTypeParam can be any of the three unique identifiers from the chat_types table:
 * - UUID id (e.g., "019c6003-28df-722a-a79d-0ce2b2f826df")
 * - seo_friendly_id slug (e.g., "chat-heart-darkness")
 * - seo_friendly_base64_id (e.g., "AZxgAyjfciqnnQzisvgm3w")
 *
 * The backend resolves this parameter to the actual chatTypeId UUID.
 * If the parameter is not present, it falls back to chatTypeId in the POST body.
 */
export default function AIChatPage({
  params,
}: {
  params: Promise<{ chatTypeParam: string; chatId: string }>
}) {
  const { chatId, chatTypeParam } = use(params)

  logger.debug('Rendering AIChatPage', { event: 'chat.page.render', chatTypeParam, chatId })

  // Fetch the chat data from the backend
  const { data: chatData, isError: isFetchError, isLoading: isFetchingChat } = useFetchChat(chatId)

  logger.debug('Fetch state', {
    event: 'chat.page.render',
    isLoading: isFetchingChat,
    isFetchError,
    messageCount: chatData?.messages?.length,
  })

  const {
    accordionBody,
    accordionHeader,
    chats,
    currentChatId,
    disabled,
    errorMessage,
    handleDrawerToggle,
    handleErrorClose,
    handleFileSelect,
    handleInputChange,
    handleNavigateHome,
    handleNewChat,
    handleSignOut,
    handleSubmit,
    input,
    isChatsError,
    isLoading,
    isLoadingChats,
    messages,
    messagesEndRef,
    mobileOpen,
    selectedFile,
    status,
  } = useAIChat({ id: chatId, chatTypeParam, initialMessages: chatData?.messages })

  logger.debug('Rendering AIChatPage', {
    event: 'chat.page.render',
    messageCount: messages?.length,
  })

  return (
    <AIChatView
      accordionBody={accordionBody}
      accordionHeader={accordionHeader}
      chats={chats}
      currentChatId={currentChatId}
      disabled={disabled}
      errorMessage={errorMessage}
      input={input}
      isChatsError={isChatsError}
      isLoading={isLoading}
      isLoadingChats={isLoadingChats}
      messages={messages}
      messagesEndRef={messagesEndRef}
      mobileOpen={mobileOpen}
      onDrawerToggle={handleDrawerToggle}
      onErrorClose={handleErrorClose}
      onFileSelect={handleFileSelect}
      onInputChange={handleInputChange}
      onNavigateHome={handleNavigateHome}
      onNewChat={handleNewChat}
      onSignOut={handleSignOut}
      onSubmit={handleSubmit}
      selectedFile={selectedFile}
      status={status}
    />
  )
}
