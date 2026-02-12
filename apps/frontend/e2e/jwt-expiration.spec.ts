import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe('JWT Token Expiration', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies()
  })

  test('should redirect to signin when JWT expires during server action call', async ({
    context,
    page,
  }) => {
    // Step 1: Sign in with valid credentials
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Step 2: Replace the JWT with an expired/invalid token
    const cookies = await context.cookies()
    const sessionToken = cookies.find(
      (cookie) =>
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token'
    )
    expect(sessionToken).toBeDefined()
    const tokenValue = sessionToken!.value.slice(0, -5) + 'xxxxx'
    await context.addCookies([
      {
        ...sessionToken!,
        value: tokenValue,
      },
    ])

    // Step 3: Try to access a page that makes server action calls to the backend
    await page.goto('/dashboard')

    // Step 4: Wait for redirect to signin page due to 401 from backend
    await page.waitForURL(/\/signin/, { timeout: 10000 })

    // Verify we're redirected to signin
    expect(page.url()).toContain('/signin')

    // Verify the error parameter or callbackUrl is set
    const url = new URL(page.url())
    const errorParam = url.searchParams.get('error')
    const callbackUrl = url.searchParams.get('callbackUrl')

    // Should have either an error parameter OR a callbackUrl (middleware redirect)
    expect(errorParam || callbackUrl).toBeTruthy()

    // Verify signin page is displayed
    await expect(page.getByRole('heading', { name: /Norbert's Spark/i })).toBeVisible()
  })

  test('should redirect to signin when accessing /dashboard with expired JWT', async ({
    context,
    page,
  }) => {
    // Step 1: Sign in
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Step 2: Navigate to dashboard
    await page.goto('/dashboard')

    // Step 3: Invalidate the JWT cookie with a completely invalid token
    const cookies = await context.cookies()
    const sessionToken = cookies.find(
      (cookie) =>
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token'
    )
    expect(sessionToken).toBeDefined()
    await context.addCookies([
      {
        ...sessionToken!,
        value: 'invalid.jwt.token',
      },
    ])

    // Step 4: Trigger a server action that would call the backend
    await page.reload()

    // Step 5: Should be redirected to signin
    await page.waitForURL(/\/signin/, { timeout: 10000 })
    expect(page.url()).toContain('/signin')
  })

  test('should maintain authentication with valid JWT', async ({ page }) => {
    // Sign in
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to dashboard (should work fine with valid JWT)
    await page.goto('/dashboard')

    // Should remain on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Reload the page (should still work)
    await page.reload()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})
