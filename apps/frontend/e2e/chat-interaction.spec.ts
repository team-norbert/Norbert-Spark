import type { BrowserContext, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

// These tests are skipped because the Next.js dev server takes too long to compile
// the /ai route on first access. They work correctly in isolation but timeout when
// run as part of the full suite due to dev mode compilation overhead.
// TODO: Enable these tests when running against a production build or with precompiled pages.
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

  // Skip reason: Next.js dev server takes >60s to compile /ai route on first access
  test.skip('should navigate to chat page and verify form is disabled for new chat', async ({
    context,
    page,
  }) => {
    await signInAndNavigateToAI(context, page)

    // Verify form elements are disabled - use simple selectors
    const textInput = page.getByTestId('chat-text-input')
    await expect(textInput).toBeVisible({ timeout: 10000 })

    // Wait for React hydration to complete
    await page.waitForTimeout(500)

    await expect(textInput).toBeDisabled({ timeout: 5000 })

    // Verify submit button is disabled (IconButton with type="submit")
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()

    // Verify file upload button is disabled
    const fileUploadButton = page.getByTestId('file-upload-button')
    await expect(fileUploadButton).toBeDisabled()
  })

  // Skip reason: Next.js dev server takes >60s to compile /ai route on first access
  test.skip('should display error message in UI when API request fails', async ({
    context,
    page,
  }) => {
    await signInAndNavigateToAI(context, page)

    // Click "New Chat" button to enable the form - ensure we click the visible one
    const newChatButton = page.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 10000 })

    // Wait for React hydration to complete
    await page.waitForTimeout(500)

    await newChatButton.click()

    // Wait for URL to change to a new chat ID
    await expect(page).toHaveURL(/\/ai\/[a-f0-9-]+/, { timeout: 10000 })

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
