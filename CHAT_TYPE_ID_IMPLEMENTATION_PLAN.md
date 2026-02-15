# Implementation Plan: Populate `chatTypeId` in the `chats` Table

## Goal

Replace the temporary placeholder at `apps/backend/src/adapters/secondary/repositories/ai.repository.ts:84` with the real `chatTypeId` value, using **URI state** to connect the right `chatTypeId` from `chat_types` to each chat.

### URI Structure

The chat type is identified via a URL parameter that can be **any of the three unique identifiers** from the `chat_types` table:

```
https://localhost:4321/ai/{chatTypeParam}/{chatId}
```

Examples (all pointing to the same chat type, same chat):

```
https://localhost:4321/ai/chat-019c6003-28df-722a-a79d-0ce2b2f826df/019c613f-8284-74b5-93f0-77fbb1e1724e
https://localhost:4321/ai/chat-heart-darkness/019c613f-8284-74b5-93f0-77fbb1e1724e
https://localhost:4321/ai/chat-AZxgAyjfciqnnQzisvgm3w/019c613f-8284-74b5-93f0-77fbb1e1724e
```

| Column                   | Example Value                          | URL Segment                                 |
| ------------------------ | -------------------------------------- | ------------------------------------------- |
| `id` (UUID)              | `019c6003-28df-722a-a79d-0ce2b2f826df` | `chat-019c6003-28df-722a-a79d-0ce2b2f826df` |
| `seo_friendly_id` (slug) | `chat-heart-darkness`                  | `chat-heart-darkness`                       |
| `seo_friendly_base64_id` | `AZxgAyjfciqnnQzisvgm3w`               | `chat-AZxgAyjfciqnnQzisvgm3w`               |

**Fallback**: If the URL parameter is not present, the `chatTypeId` UUID is passed directly in the POST request body.

---

## OpenAPI Schema Naming Convention

The OpenAPI schemas have been renamed for clarity:

| Schema File                  | Describes                                                     | DB Table          |
| ---------------------------- | ------------------------------------------------------------- | ----------------- |
| `AIChatTypesResponse.json`   | Chat type listings (id, name, description, SEO fields)        | `chat_types`      |
| `AIChatOptionsResponse.json` | AI model configuration (prompt, maxTokens, temperature, etc.) | `chat_ai_options` |

The former `/ai/chats/types` endpoint has been removed from the OpenAPI spec. The `GET /ai/chats/config` endpoint returns `AIChatTypesResponse` data and is now accessible to **all authenticated users** (role restriction removed). The existing `getAIChatConfig.server.ts` server action and `useAIChatConfig` hook can be reused for the landing page — no new endpoint, server action, or hook is needed.

---

## Strategy Summary

| Concern                    | Approach                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| **Frontend URL structure** | Two-segment: `/ai/[chatTypeParam]/[chatId]`                                |
| **Chat type selection**    | Landing page at `/ai` lists available types                                |
| **Chat type resolution**   | `chatTypeParam` sent in POST body → backend resolves via 3 unique columns  |
| **Fallback**               | If no `chatTypeParam`, `chatTypeId` UUID sent directly in body             |
| **Sidebar links**          | Constructed from `seoFriendlyId` + `chatId` returned by `getChatsByUserId` |

The URL carries a human-readable or unique identifier for navigation and bookmarkability. The backend resolves `chatTypeParam` against `chat_types.id`, `chat_types.seo_friendly_id`, and `chat_types.seo_friendly_base64_id` (all unique columns) to obtain the actual UUID `chatTypeId`.

---

## Changes by Layer

### 1. Shared Package — Update Response Schema

**File**: `packages/shared/src/schemas/ai.ts`

- **Current**: `AIUserIdResponseSchema.data` is `z.array(z.uuid())` — flat array of chat IDs.
- **Change**: Update to `z.array(z.object({ id: z.uuid(), chatTypeId: z.uuid() }))` so the frontend can construct two-segment sidebar URLs.
- **Impact**: The `AIUserIdResponseSchemaType` type changes from `{ success: boolean; data: string[] }` to `{ success: boolean; data: { id: string; chatTypeId: string }[] }`.

### 2. Backend — Repository Layer

**File**: `apps/backend/src/adapters/secondary/repositories/ai.repository.ts`

- **`createChat`**: Add `chatTypeId: ChatIdType` parameter. Include it in the `newChat` object inserted into the `chats` table. Remove the `// TODO` and `@ts-expect-error`.
- **`getChatsByUserId`**: Change the `select` to return both `chats.id` and `chats.chatTypeId` instead of just `id`. Return type changes from `ChatIdType[]` to `{ id: ChatIdType; chatTypeId: string }[]`.

### 3. Backend — Port Interface

**File**: `apps/backend/src/application/ports/ai.port.ts`

- **`AIServicePort.createChat`**: Add `chatTypeId: ChatIdType` to the signature.
- **`AIServicePort.getChatsByUserId`**: Change return type from `ChatIdType[]` to `{ id: ChatIdType; chatTypeId: string }[]`.

### 4. Backend — Use Cases

**File**: `apps/backend/src/application/use-cases/save-chat.use-case.ts`

- **`SaveChatUseCase.execute`**: Add `chatTypeId: ChatIdType` parameter. Pass it through to `this.aiRepository.createChat(chatId, userId, chatTypeId, messages)`.

**File**: `apps/backend/src/application/use-cases/get-chats-by-userid.use-case.ts`

- **`GetChatsByUserIdUseCase.execute`**: Change return type from `ChatIdType[]` to `{ id: ChatIdType; chatTypeId: string }[]`. The audit log entries remain unchanged.

**Note**: `AppendedChatUseCase` does not need changes — it only appends messages to an existing chat whose `chatTypeId` was already set at creation time.

### 5. Backend — Controller

**File**: `apps/backend/src/adapters/primary/http/ai.controller.ts`

- **`chat()` method (POST `/ai/chat`)**:
  - Extract `chatTypeId` from `body?.chatTypeId` (already partially logged at line 114).
  - Validate it as a UUIDv7 using `new ChatId(body.chatTypeId).getValue()`.
  - Return 400 if `chatTypeId` is missing or invalid.
  - Pass the validated `chatTypeId` to `this.saveChatUseCase.execute(...)`.
  - Fix the existing bug at line 168 where `const chatTypeId = new ChatId(id).getValue()` incorrectly derives chatTypeId from the chat's own `id`. This must now come from `body.chatTypeId`.
- **`getAIChatsByUserId()` method**: Update the response to include `chatTypeId` alongside each chat ID (the use case now returns enriched objects).

### 6. Backend — Chat Types Endpoint (No Changes Needed)

The `requireRole(['admin', 'moderator'])` middleware has been removed from the existing `GET /ai/chats/config` endpoint. It now requires only `authMiddleware`, making it accessible to all authenticated users. No new endpoint is needed — the frontend landing page will call the existing endpoint via the existing `getAIChatConfig.server.ts` server action and `useAIChatConfig` hook.

### 7. Backend — DI Container

**File**: `apps/backend/src/infrastructure/di/container.ts`

- No constructor signature changes — `SaveChatUseCase` already receives `(logger, aiRepository, auditLog)`. The new `chatTypeId` parameter is on the `execute()` method, not the constructor.
- If the new `GET /ai/chat-types` endpoint reuses `GetChatDetailsUseCase`, no new wiring is needed — the controller already has access to it.

### 8. Frontend — New Landing Page

**File**: `apps/frontend/src/app/ai/page.tsx`

- **Current**: Renders `AIChatView` directly with `useAIChat()` (no id → disabled chat).
- **Change**: Convert to a chat-type selection page. Fetch available chat types using the existing `useAIChatConfig` hook (which calls `getAIChatConfig.server.ts` → `GET /api/v1/ai/chats/config`). Display a list/grid of chat types. On selection, navigate to `/ai/{chatTypeId}/{uuidv7()}`.
- **No new server action or hook needed**: The existing `getAIChatConfig.server.ts` and `useAIChatConfig` hook already fetch chat types from the now-public `/ai/chats/config` endpoint.

### 9. Frontend — New Two-Segment Chat Route

**File**: `apps/frontend/src/app/ai/[chatTypeId]/[chatId]/page.tsx` (new file)

- Replaces the old `apps/frontend/src/app/ai/[id]/page.tsx`.
- Extracts both `chatTypeId` and `chatId` from `params`.
- Passes both to `useAIChat({ chatTypeId, id: chatId })`.
- Fetches existing chat data via `useFetchChat(chatId)` (unchanged).

### 10. Frontend — Delete Old Single-Segment Route

**File**: `apps/frontend/src/app/ai/[id]/page.tsx`

- Delete this file. It is replaced by the two-segment route above.

### 11. Frontend — Update `useAIChat` Hook

**File**: `apps/frontend/src/view/hooks/useAIChat.ts`

- **Props**: Add `chatTypeId?: string` to `UseAIChatProps`.
- **`handleNewChat`**: Change from `router.push(\`/ai/${newId}\`)` to `router.push(\`/ai/${chatTypeId}/${newId}\`)`. If `chatTypeId`is not available, navigate to`/ai` (landing page).
- **`useChat` transport body**: The AI SDK v5 `useChat` hook supports a `body` option that merges extra fields into the POST body. Add `body: { chatTypeId }` so the backend receives it.
- **Return value**: Export `chatTypeId` so the view can use it.

### 12. Frontend — Update `AIChatView` Sidebar

**File**: `apps/frontend/src/view/client-components/AIChatView.tsx`

- **Props**: Change `chats` type from `string[]` to `{ id: string; chatTypeId: string }[]`.
- **Sidebar links**: Change `router.push(\`/ai/${chatId}\`)` to `router.push(\`/ai/${chat.chatTypeId}/${chat.id}\`)`.
- **Display**: Update `ListItemText` to reference `chat.id` for truncation.
- **Selected state**: Change `currentChatId === chatId` to `currentChatId === chat.id`.

### 13. Frontend — Update `useUserChats` Hook

**File**: `apps/frontend/src/view/hooks/useUserChats.ts`

- The `getChatsByUserIdAction` now returns `{ id: string; chatTypeId: string }[]` instead of `string[]`.
- Update the return type accordingly — React Query will infer the new shape.

### 14. Frontend — Update `getChatsByUserId` Server Action

**File**: `apps/frontend/src/infrastructure/serverActions/getChatsByUserId.server.ts`

- The `AIUserIdResponseSchemaType` from the shared package will have the new shape. No code changes needed here beyond the shared schema update — TypeScript will propagate the new type.

---

## Data Flow (After Changes)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Landing Page: /ai                                                   │
│ → GET /api/v1/ai/chats/config (auth only, returns chat types)      │
│ → User clicks "General Assistant"                                   │
│ → router.push(`/ai/${chatTypeId}/${uuidv7()}`)                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Chat Page: /ai/[chatTypeId]/[chatId]                                │
│ → useAIChat({ chatTypeId, id: chatId })                            │
│ → useChat({ body: { chatTypeId }, ... })                           │
│ → POST /api/v1/ai/chat  body: { id, messages, trigger, chatTypeId }│
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Backend: AIController.chat()                                        │
│ → Validates chatTypeId from body (UUIDv7)                          │
│ → saveChatUseCase.execute(chatId, userId, chatTypeId, msgs, audit) │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Backend: AIRepository.createChat()                                  │
│ → INSERT INTO chats (id, user_id, chat_type_id) VALUES (...)       │
└─────────────────────────────────────────────────────────────────────┘
```

### Sidebar Flow (Existing Chats)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Sidebar: useUserChats(userId)                                       │
│ → getChatsByUserIdAction(userId)                                    │
│ → GET /api/v1/ai/chats/:userId                                     │
│ → Returns [{ id: "abc...", chatTypeId: "def..." }, ...]            │
│ → Sidebar renders: router.push(`/ai/${chat.chatTypeId}/${chat.id}`)│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files Changed (Summary)

| #   | File                                                                        | Action                                                    |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `packages/shared/src/schemas/ai.ts`                                         | Modify schema                                             |
| 2   | `apps/backend/src/application/ports/ai.port.ts`                             | Modify interface                                          |
| 3   | `apps/backend/src/adapters/secondary/repositories/ai.repository.ts`         | Modify `createChat`, `getChatsByUserId`                   |
| 4   | `apps/backend/src/application/use-cases/save-chat.use-case.ts`              | Add `chatTypeId` parameter                                |
| 5   | `apps/backend/src/application/use-cases/get-chats-by-userid.use-case.ts`    | Change return type                                        |
| 6   | `apps/backend/src/adapters/primary/http/ai.controller.ts`                   | Extract `chatTypeId` from body, fix bug (no new endpoint) |
| 7   | `apps/frontend/src/app/ai/page.tsx`                                         | Rewrite as chat-type selection page                       |
| 8   | `apps/frontend/src/app/ai/[chatTypeId]/[chatId]/page.tsx`                   | New file (replaces `[id]/page.tsx`)                       |
| 9   | `apps/frontend/src/app/ai/[id]/page.tsx`                                    | Delete                                                    |
| 10  | `apps/frontend/src/view/hooks/useAIChat.ts`                                 | Accept and send `chatTypeId`                              |
| 11  | `apps/frontend/src/view/client-components/AIChatView.tsx`                   | Update sidebar links and types                            |
| 12  | `apps/frontend/src/view/hooks/useUserChats.ts`                              | Type change (automatic via schema)                        |
| 13  | `apps/frontend/src/infrastructure/serverActions/getChatsByUserId.server.ts` | Type change (automatic via schema)                        |

---

## Test Impact

- **`apps/backend/test/adapters/secondary/repositories/ai.repository.test.ts`**: Update `createChat` call to include `chatTypeId`. Remove temporary placeholder expectation.
- **`apps/backend/test/application/use-cases/save-chat.use-case.test.ts`**: Add `chatTypeId` to `execute()` calls.
- **`apps/backend/test/application/use-cases/get-chats-by-userid.use-case.test.ts`**: Update expected return shape.
- **`apps/backend/test/adapters/primary/http/ai.controller.test.ts`**: Update mock request body to include `chatTypeId`. Verify 400 for missing/invalid `chatTypeId`.
- **`packages/shared/tests/**`**: If there are tests for `AIUserIdResponseSchema`, update expected shape.
- **Frontend E2E tests**: Any Playwright tests navigating to `/ai/{id}` need to use `/ai/{chatTypeId}/{chatId}`.

---

## Risk Mitigation

1. **Backwards compatibility**: The shared schema change is a breaking change. Frontend and backend must be deployed together.
2. **Existing chat data**: Any existing chats in the database will have `NULL` or the placeholder `chatTypeId`. A migration script may be needed to backfill these with the correct `chatTypeId`. See `apps/backend/docs/CHAT_TYPE_ID_DATA_INTEGRITY.md` for detailed migration strategy and data integrity guarantees.
3. **Single chat type today**: The implementation should work with one chat type but must not hard-code assumptions — the landing page naturally handles N chat types.

### Database Integrity Guarantees

The database schema includes multiple layers of protection against data integrity issues:

- **Foreign Key Constraint**: `chats.chatTypeId` references `chat_types.id` with `onDelete: 'restrict'` (schema.ts:695)
  - Prevents insertion of chats with invalid chatTypeId
  - Prevents deletion of chat types that are referenced by chats
- **NOT NULL Constraint**: `chats.chatTypeId` has `.notNull()` (schema.ts:694)
  - Ensures every chat has a valid chat type
  - Makes INNER JOIN operations safe (no rows excluded due to NULL values)
- **Database Index**: `chats_chat_type_id_idx` on `chats.chatTypeId` (schema.ts:705)
  - Optimizes JOIN performance
  - Ensures efficient queries filtering by chatTypeId

For detailed information about data integrity, migration procedures, and verification queries, see:
**`apps/backend/docs/CHAT_TYPE_ID_DATA_INTEGRITY.md`**

---

## Suggested Implementation Order

1. Shared package schema change (`AIUserIdResponseSchema`)
2. Backend port interface (`AIServicePort`)
3. Backend repository (`AIRepository`)
4. Backend use cases (`SaveChatUseCase`, `GetChatsByUserIdUseCase`)
5. Backend controller (`AIController` — body extraction, response shape, fix bug)
6. Frontend pages (`/ai` landing with existing `useAIChatConfig`, `/ai/[chatTypeId]/[chatId]` chat page)
7. Frontend view components (`useAIChat` hook, `AIChatView` sidebar, `useUserChats` type update)
8. Delete old `/ai/[id]` route
9. Fix all tests
10. Typecheck and full test run
