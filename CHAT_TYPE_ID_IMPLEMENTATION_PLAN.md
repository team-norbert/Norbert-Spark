# Implementation Plan: Populate `chatTypeId` in the `chats` Table

## Goal

Replace the temporary placeholder at `apps/backend/src/adapters/secondary/repositories/ai.repository.ts:84` with the real `chatTypeId` value, using a hybrid of Approach 4 (Landing Page) and Approach 3 (Body-Only).

---

## Hybrid Strategy Summary

| Concern                    | Approach                                                                |
| -------------------------- | ----------------------------------------------------------------------- |
| **Frontend URL structure** | Two-segment: `/ai/[chatTypeId]/[chatId]` (Approach 4)                   |
| **Chat type selection**    | Landing page at `/ai` lists available types (Approach 4)                |
| **Backend delivery**       | `chatTypeId` sent in POST request body (Approach 3)                     |
| **Sidebar links**          | Constructed from `chatTypeId` + `chatId` returned by `getChatsByUserId` |

The URL carries `chatTypeId` for navigation and bookmarkability. The backend extracts `chatTypeId` from the request body — not from the URL — keeping the API RESTful and decoupled from the frontend's routing scheme.

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

### 6. Backend — New Endpoint for Chat Types (All Authenticated Users)

**File**: `apps/backend/src/adapters/primary/http/ai.controller.ts`

- **Problem**: The existing `GET /ai/chats/config` endpoint requires `admin` or `moderator` role. Regular users need to see chat types on the landing page.
- **Solution**: Add a new route `GET /ai/chat-types` with `authMiddleware` only (no role restriction). It reuses `GetChatDetailsUseCase` but returns a minimal payload (id, name, description, seoFriendlyId) suitable for the selection UI.
- **Alternative**: If you prefer not to add a new endpoint, relax the role constraint on the existing one. However, that would expose admin-level detail (seoFriendlyBase64Id, timestamps) to all users.

### 7. Backend — DI Container

**File**: `apps/backend/src/infrastructure/di/container.ts`

- No constructor signature changes — `SaveChatUseCase` already receives `(logger, aiRepository, auditLog)`. The new `chatTypeId` parameter is on the `execute()` method, not the constructor.
- If the new `GET /ai/chat-types` endpoint reuses `GetChatDetailsUseCase`, no new wiring is needed — the controller already has access to it.

### 8. Frontend — New Landing Page

**File**: `apps/frontend/src/app/ai/page.tsx`

- **Current**: Renders `AIChatView` directly with `useAIChat()` (no id → disabled chat).
- **Change**: Convert to a chat-type selection page. Fetch available chat types via a new hook/server action that calls `GET /ai/chat-types`. Display a list/grid of chat types. On selection, navigate to `/ai/{chatTypeId}/{uuidv7()}`.
- **New server action needed**: `getChatTypes.server.ts` calling the new `GET /ai/chat-types` endpoint (authenticated, no admin role required).
- **New hook needed**: `useChatTypes.ts` wrapping the server action in React Query.

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
│ → GET /api/v1/ai/chat-types (auth only, no admin role)             │
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
| 6   | `apps/backend/src/adapters/primary/http/ai.controller.ts`                   | Extract `chatTypeId` from body, add new endpoint, fix bug |
| 7   | `apps/frontend/src/app/ai/page.tsx`                                         | Rewrite as chat-type selection page                       |
| 8   | `apps/frontend/src/app/ai/[chatTypeId]/[chatId]/page.tsx`                   | New file (replaces `[id]/page.tsx`)                       |
| 9   | `apps/frontend/src/app/ai/[id]/page.tsx`                                    | Delete                                                    |
| 10  | `apps/frontend/src/view/hooks/useAIChat.ts`                                 | Accept and send `chatTypeId`                              |
| 11  | `apps/frontend/src/view/client-components/AIChatView.tsx`                   | Update sidebar links and types                            |
| 12  | `apps/frontend/src/view/hooks/useUserChats.ts`                              | Type change (automatic via schema)                        |
| 13  | `apps/frontend/src/infrastructure/serverActions/getChatsByUserId.server.ts` | Type change (automatic via schema)                        |
| 14  | `apps/frontend/src/infrastructure/serverActions/getChatTypes.server.ts`     | New server action                                         |
| 15  | `apps/frontend/src/view/hooks/queries/useChatTypes.ts`                      | New hook                                                  |

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
2. **Admin-only config endpoint**: Regular users currently cannot fetch chat types. A new `GET /ai/chat-types` endpoint is needed.
3. **Existing chat data**: Any existing chats in the database will have `NULL` or the placeholder `chatTypeId`. A migration script may be needed to backfill these with the correct `chatTypeId`.
4. **Single chat type today**: The implementation should work with one chat type but must not hard-code assumptions — the landing page naturally handles N chat types.

---

## Suggested Implementation Order

1. Shared package schema change (`AIUserIdResponseSchema`)
2. Backend port interface (`AIServicePort`)
3. Backend repository (`AIRepository`)
4. Backend use cases (`SaveChatUseCase`, `GetChatsByUserIdUseCase`)
5. Backend controller (`AIController` — body extraction, new endpoint, response shape)
6. Frontend server actions and hooks (new `getChatTypes`, update `useUserChats` types)
7. Frontend pages (`/ai` landing, `/ai/[chatTypeId]/[chatId]` chat page)
8. Frontend view components (`useAIChat` hook, `AIChatView` sidebar)
9. Delete old `/ai/[id]` route
10. Fix all tests
11. Typecheck and full test run
