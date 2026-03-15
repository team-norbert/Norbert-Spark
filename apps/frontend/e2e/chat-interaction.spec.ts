import type { BrowserContext, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe('Chat Interaction', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(90000) // 90 second timeout

  // Helper function to sign in and navigate to AI page
  async function signInAndNavigateToAI(context: BrowserContext, page: Page) {
    // Clear cookies
    await context.clearCookies()

    // Sign in - wait for page to be ready
    await page.goto('/signin', { waitUntil: 'load', timeout: 30000 })

    // Wait for form to be visible
    const emailField = page.getByLabel(/email address/i)
    await expect(emailField).toBeVisible({ timeout: 10000 })

    await emailField.fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)

    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })

    // Wait for page to fully load before navigation
    await page.waitForLoadState('load', { timeout: 30000 })

    // Navigate to AI page - wait for page to be stable first
    await page.waitForFunction(() => !document.body.textContent?.includes('Compiling'), {
      timeout: 30000,
    })

    // Navigate directly to /ai
    await page.goto('/ai', { waitUntil: 'load', timeout: 60000 })
    await expect(page).toHaveURL(/\/ai/, { timeout: 30000 })

    // Wait for Next.js compilation to complete (dev mode)
    await page.waitForFunction(() => !document.body.textContent?.includes('Compiling'), {
      timeout: 30000,
    })
  }

  test('should navigate to chat page and make basic interaction', async ({ context, page }) => {
    await signInAndNavigateToAI(context, page)

    // Verify the chat type selection instruction text
    const instructionText = page.getByTestId('chat-type-selection-instruction')
    await expect(instructionText).toBeVisible({ timeout: 10000 })
    await expect(instructionText).toContainText(
      'Select an AI assistant to start a new conversation.'
    )

    // Find and click the Heart of Darkness chat type card button
    const heartDarknessCard = page.getByTestId('chat-type-card-heart-darkness')
    await expect(heartDarknessCard).toBeVisible({ timeout: 10000 })

    const cardButton = heartDarknessCard.locator('button')
    await cardButton.click()

    // Wait for navigation to the new chat page
    await page.waitForURL(/\/ai\/heart-darkness\/[0-9a-f-]+/, { timeout: 30000 })

    // Verify URL segments: /ai/heart-darkness/{uuidv7}
    const currentUrl = page.url()
    const urlParts = new URL(currentUrl).pathname.split('/').filter(Boolean)

    expect(urlParts[0]).toBe('ai')
    expect(urlParts[1]).toBe('heart-darkness')

    // Verify the third segment is a UUIDv7 (format: 8-4-4-4-12 hex characters)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(urlParts[2]).toMatch(uuidPattern)

    // Wait for page to fully load
    await page.waitForLoadState('load', { timeout: 30000 })

    // Type "hello" in the chat input textarea
    const chatInput = page.getByRole('textbox', { name: 'Ask a question about The' })
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await expect(chatInput).toBeEnabled({ timeout: 5000 })
    await chatInput.fill('hello')

    // Click the send button
    const sendButton = page.getByTestId('send-button')
    await expect(sendButton).toBeVisible()
    await sendButton.click()

    // Wait for the user message to appear in the UI
    const userMessageWrapper = page.getByTestId('message-user')
    await expect(userMessageWrapper).toBeVisible({ timeout: 10000 })

    // Verify the message text directly on the user message container
    await expect(userMessageWrapper).toContainText('User: hello', { timeout: 10000 })
  })

  test('should navigate to chat page and verify form is disabled for new chat', async ({
    context,
    page,
  }) => {
    await signInAndNavigateToAI(context, page)

    // Find and click the Heart of Darkness chat type card button
    const heartDarknessCard = page.getByTestId('chat-type-card-heart-darkness')
    await expect(heartDarknessCard).toBeVisible({ timeout: 10000 })

    const cardButton = heartDarknessCard.locator('button')
    await cardButton.click()

    // Verify submit button is disabled (IconButton with type="submit")
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()

    // Verify file upload button is disabled
    const fileUploadButton = page.getByTestId('file-upload-button')
    await expect(fileUploadButton).toBeDisabled()
  })

  test('should display error message in UI when API request fails', async ({ context, page }) => {
    await signInAndNavigateToAI(context, page)

    // Find and click the Heart of Darkness chat type card button
    const heartDarknessCard = page.getByTestId('chat-type-card-heart-darkness')
    await expect(heartDarknessCard).toBeVisible({ timeout: 10000 })

    const cardButton = heartDarknessCard.locator('button')
    await cardButton.click()

    // Wait for navigation to the new chat page
    await page.waitForURL(/\/ai\/heart-darkness\/[0-9a-f-]+/, { timeout: 30000 })

    // Wait for page to fully load
    await page.waitForLoadState('load', { timeout: 30000 })

    // Intercept API request and return an error response
    await page.route('**/api/v1/ai/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request',
        }),
      })
    })

    // Type a message and submit
    const chatInput = page.getByRole('textbox', { name: 'Ask a question about The' })
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await expect(chatInput).toBeEnabled({ timeout: 5000 })
    await chatInput.fill('Test message that will trigger an error')

    const submitBtn = page.getByTestId('send-button')
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // Wait for and verify the error Alert is displayed
    const errorAlert = page.getByTestId('error-alert')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })

    // Verify the error message contains expected text
    await expect(errorAlert).toContainText(/error|failed/i)

    // Verify the alert has error severity (red color scheme)
    await expect(errorAlert).toHaveClass(/MuiAlert-standardError/)

    // Verify the close button is present
    const closeButton = errorAlert.getByRole('button', { name: /close/i })
    await expect(closeButton).toBeVisible()

    // Click close button and verify alert is removed from DOM
    await closeButton.click()
    await expect(errorAlert).not.toBeAttached()
  })
})
