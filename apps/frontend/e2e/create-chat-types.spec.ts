import { expect, test, type Page } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

const NEW_CHAT_TYPE = {
  name: 'this is a test chat',
  description:
    'Vestibulum libero est, euismod a eleifend a, tempor in sem. Mauris et nunc ac arcu placerat molestie. Aliquam hendrerit tempus enim vitae fringilla.',
} as const

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
  await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
    page.getByRole('button', { name: /^sign in$/i }).click(),
  ])
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
}

async function createChatTypeWithRag(page: Page) {
  await page.goto('/chat-types/create')
  await expect(page).toHaveURL('/chat-types/create')

  const nameInput = page.getByLabel('Name *')
  await expect(nameInput).toBeVisible({ timeout: 10_000 })
  await nameInput.fill(NEW_CHAT_TYPE.name)

  const descriptionInput = page.getByLabel('Description *')
  await expect(descriptionInput).toBeVisible()
  await descriptionInput.fill(NEW_CHAT_TYPE.description)

  const ragCheckbox = page.getByLabel('RAG (Retrieval-Augmented Generation)')
  await expect(ragCheckbox).toBeVisible()
  await ragCheckbox.check()

  const createButton = page.getByTestId('create-button')
  await expect(createButton).toBeVisible()
  await createButton.click()

  await page.waitForURL('/chat-types', { timeout: 15_000 })
}

test.describe('Create Chat Type Page', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('admin can create a new chat type and verify it appears in the chat types table', async ({
    page,
  }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await signIn(page)

    // ── 2. Create a new chat type with RAG enabled ────────────────────────────
    await createChatTypeWithRag(page)

    // ── 3. Wait for automatic navigation to /chat-types ──────────────────────
    await expect(page).toHaveURL('/chat-types')

    // ── 4. Wait for the DataGrid rows to render ───────────────────────────────
    await page.waitForSelector('.MuiDataGrid-row', { timeout: 15_000 })

    // ── 5. Verify the new chat type name appears in the Name column ───────────
    const nameCell = page.locator('[data-field="name"]').filter({ hasText: NEW_CHAT_TYPE.name })
    await expect(nameCell).toBeVisible({ timeout: 10_000 })
    await expect(nameCell).toContainText(NEW_CHAT_TYPE.name, { ignoreCase: true })

    // ── 6. Verify the description appears in the Description column ───────────
    const descriptionCell = page
      .locator('[data-field="description"]')
      .filter({ hasText: NEW_CHAT_TYPE.description.substring(0, 40) })
    await expect(descriptionCell).toBeVisible({ timeout: 10_000 })

    // ── 7. Verify the RAG value is persisted and shown as true in the RAG column ─
    const newChatTypeRow = page
      .locator('.MuiDataGrid-row')
      .filter({ hasText: NEW_CHAT_TYPE.name })
      .first()
    await expect(newChatTypeRow).toBeVisible({ timeout: 10_000 })
    const ragCell = newChatTypeRow.locator('[data-field="rag"]')
    await expect(ragCell).toBeVisible({ timeout: 10_000 })
    await expect(ragCell).toHaveText(/true/i)
  })

  test('successfully navigate to RAG Files page from the Chat Types page', async ({ page }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await signIn(page)

    // ── 2. Create a chat type with RAG enabled ────────────────────────────────
    await createChatTypeWithRag(page)

    // ── 3. Verify the RAG value is persisted and shown as true in the RAG column ─
    await page.waitForSelector('.MuiDataGrid-row', { timeout: 15_000 })
    const newChatTypeRow = page
      .locator('.MuiDataGrid-row')
      .filter({ hasText: NEW_CHAT_TYPE.name })
      .first()
    await expect(newChatTypeRow).toBeVisible({ timeout: 10_000 })
    const ragCell = newChatTypeRow.locator('[data-field="rag"]')
    await expect(ragCell).toBeVisible({ timeout: 10_000 })
    await expect(ragCell).toHaveText(/true/i)

    // -- 4. Click through the link in the RAG column to navigate to the RAG Files page ──
    const ragLink = ragCell.locator('a')
    await expect(ragLink).toBeVisible()
    await ragLink.click()

    // ── 5. Verify navigation to the RAG Files page ─────────────────────────────
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
    await page.waitForURL(new RegExp(`/chat-types/rag-files/${uuidRegex.source}`), {
      timeout: 15_000,
    })
    await expect(page).toHaveURL(new RegExp(`/chat-types/rag-files/${uuidRegex.source}`))

    // ── 6. Verify the RAG Files page content is visible ─────────────────────────
    await expect(
      page.getByRole('heading', { name: /retrieval-augmented generation/i })
    ).toBeVisible()
    expect(page.getByTestId('rag-files-file-input').first()).toBeDefined()
  })
})
