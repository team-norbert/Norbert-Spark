import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe('Chat Interaction', () => {
  test('should navigate to chat page and verify form is disabled for new chat', async ({
    context,
    page,
  }) => {
    // Clear cookies
    await context.clearCookies()

    // Sign in
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Click on chat navigation element
    const chatButton = page.getByTestId('chat')
    await expect(chatButton).toBeVisible()
    await chatButton.click()

    // Wait for navigation (30s timeout for Next.js dev compilation)
    await page.waitForURL('/ai', { timeout: 30000 })

    // Wait for Next.js compilation to complete (dev mode indicator disappears)
    await page.waitForFunction(() => !document.body.textContent?.includes('Compiling'), {
      timeout: 30000,
    })

    // Wait for the chat input to be visible and stable
    const textInput = page.getByTestId('chat-text-input')
    await expect(textInput).toBeVisible({ timeout: 10000 })

    // Wait a moment for React hydration to complete
    await page.waitForTimeout(500)

    // Now verify form elements are disabled
    await expect(textInput).toBeDisabled({ timeout: 5000 })

    // Verify submit button is disabled (IconButton with type="submit")
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()

    // Verify file upload button is disabled
    const fileUploadButton = page.getByTestId('file-upload-button')
    await expect(fileUploadButton).toBeDisabled()
  })

  test('should display error message in UI when API request fails', async ({ context, page }) => {
    // Clear cookies
    await context.clearCookies()

    // Sign in
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Click on chat navigation element
    const chatButton = page.getByTestId('chat')
    await expect(chatButton).toBeVisible()
    await chatButton.click()

    // Wait for navigation (30s timeout for Next.js dev compilation)
    await page.waitForURL('/ai', { timeout: 30000 })

    // Wait for Next.js compilation to complete (dev mode indicator disappears)
    await page.waitForFunction(() => !document.body.textContent?.includes('Compiling'), {
      timeout: 30000,
    })

    // Wait for the New Chat button to be visible and stable
    const newChatButton = page.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 10000 })

    // Wait for React hydration
    await page.waitForTimeout(500)

    // Click "New Chat" button to enable the form
    await newChatButton.click()

    // Wait for URL to change to a new chat ID
    await page.waitForURL(/\/ai\/[a-f0-9-]+/, { timeout: 10000 })

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
    const textInput = page.getByPlaceholder('Ask a question about The Heart of Darkness...')
    await expect(textInput).toBeVisible()
    await expect(textInput).toBeEnabled()
    await textInput.fill('Test message that will trigger an error')

    const submitBtn = page.locator('button[type="submit"]')
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
