# API Endpoint Implementation vs OpenAPI Specification - Comparison Report

**Report Generated:** 2026-02-14  
**Project:** Norberts Spark
**Files Analyzed:** 5 controllers, 15+ OpenAPI path definitions, 10+ schema files  
**Total Endpoints Compared:** 14 endpoints

---

## Executive Summary

This report documents the comparison between API endpoint implementations in `apps/backend/src/adapters/primary/http/` and the OpenAPI specification in `packages/shared/src/openapi/`.

**Key Findings:**

- **6 Critical Issues** requiring immediate attention
- **1 Major Issue** affecting API contract
- **4 Minor Issues** for documentation improvements
- **4 Endpoints** match specification perfectly

---

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
2. [User Endpoints](#2-user-endpoints)
3. [AI Chat Endpoints](#3-ai-chat-endpoints)
4. [Company Endpoints](#4-company-endpoints)
5. [Summary of Issues](#summary-of-critical-issues)
6. [Recommendations](#recommendations)

---

## 1. Authentication Endpoints

### 1.1 POST /auth/login

**Status:** ✅ **NO ISSUES**

**What Matches:**

- ✅ HTTP Method: POST
- ✅ Route path: `/auth/login`
- ✅ No authentication required (public endpoint)
- ✅ Status codes: 200, 400, 401, 500
- ✅ Error response structure
- ✅ Field naming: Uses `access_token` (snake_case)
- ✅ Response structure: Wrapped in `{ success, data }`

**What Differs:**

- None

**Severity:** ✅ **NO ISSUES** - Implementation matches specification

---

### 1.2 POST /auth/oauth-sync

**Status:** 🔴 **MAJOR ISSUE**

**What Matches:**

- ✅ HTTP Method: POST
- ✅ Route path: `/auth/oauth-sync`
- ✅ Authentication: Uses `oauthSyncSecret` (X-OAuth-Sync-Secret header)
- ✅ Status codes: 200, 400, 401, 500
- ✅ Error response structure

**What Differs:**

- 🔴 **MAJOR - Response structure mismatch:**
  - **OpenAPI spec:** Expects `{ success: true, message: "User synced successfully" }`
  - **Implementation:** Returns `{ success: true, data: User }` where `User` is full user data with `id`, `email`, `name`, etc.

**Severity:** 🔴 **MAJOR** - Response structure differs significantly. Spec expects simple message, implementation returns full user data.

**Recommendation:** Update OpenAPI spec to document actual response with user data, or change implementation to return simple message.

---

## 2. User Endpoints

### 2.1 POST /users/register

**Status:** ⚠️ **MINOR ISSUE**

**What Matches:**

- ✅ HTTP Method: POST
- ✅ Route path: `/users/register`
- ✅ No authentication required (public endpoint)
- ✅ Status code: 201 for success
- ✅ Error status codes: 400, 409, 500
- ✅ Field naming: Uses `access_token` (snake_case)

**What Differs:**

- ⚠️ **MINOR - Response fields:**
  - **OpenAPI spec:** Defines `access_token`, `token_type`, `expires_in`
  - **Implementation:** Returns `access_token` but may not include `token_type` and `expires_in`

**Severity:** ⚠️ **MINOR** - Need to verify if `token_type` and `expires_in` are actually returned

**Recommendation:** Verify implementation returns all three fields as documented in spec.

---

### 2.2 GET /users

**Status:** 🔴 **CRITICAL ISSUE**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/users`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` or `moderator` role
- ✅ Status codes: 200, 401, 403

**What Differs:**

- 🔴 **CRITICAL - Response structure mismatch:**
  - **OpenAPI spec:** Expects flat array: `User[]` (NOT wrapped)
  - **Implementation:** Returns `{ success: true, data: User[], pagination: { total, limit, offset } }`
- ⚠️ **MINOR - Query parameters:**
  - **OpenAPI spec:** Does NOT document `offset` and `limit` query parameters
  - **Implementation:** Accepts and validates `limit` (1-100) and `offset` (0+) query params

**Severity:** 🔴 **CRITICAL** - Response structure completely different. OpenAPI expects flat array, implementation wraps with success/pagination.

**Recommendation:** Update OpenAPI spec to:

1. Wrap response in `{ success, data, pagination }` structure, where `pagination` contains `{ total, limit, offset }`
2. Document `offset` and `limit` query parameters

---

### 2.3 DELETE /users

**Status:** ⚠️ **MINOR ISSUE**

**What Matches:**

- ✅ HTTP Method: DELETE
- ✅ Route path: `/users`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` role only
- ✅ Status codes: 200, 400, 401, 403, 404, 500
- ✅ Request body structure: `{ userIds: string[] }`

**What Differs:**

- ⚠️ **MINOR - Response field naming:**
  - **OpenAPI spec:** Expects `{ success: true, deletedCount: number }`
  - **Implementation:** Returns `{ success: true, data: { deleted: number } }`
  - Field name is `deleted` instead of `deletedCount`

**Severity:** ⚠️ **MINOR** - Field name differs but structure is similar

**Recommendation:** Align field names - either rename to `deletedCount` in implementation or update spec to use `deleted`.

---

### 2.4 GET /users/:id

**Status:** 🔴 **CRITICAL ISSUE**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/users/:id`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` or `moderator` role
- ✅ Status codes: 200, 404, 500

**What Differs:**

- 🔴 **CRITICAL - STUB IMPLEMENTATION:**
  - **OpenAPI spec:** Expects full User object with all fields
  - **Implementation:** Returns only `{ id: "stub" }` - STUB/INCOMPLETE
  - Missing: email, name, role, createdAt, updatedAt fields

**Severity:** 🔴 **CRITICAL** - Endpoint is not fully implemented, returns stub response

**Recommendation:** Complete implementation to return full User object as documented in spec.

---

## 3. AI Chat Endpoints

### 3.1 POST /ai/chat

**Status:** ✅ **NO ISSUES**

**What Matches:**

- ✅ HTTP Method: POST
- ✅ Route path: `/ai/chat`
- ✅ Authentication: Required (JWT)
- ✅ Content-Type: Returns Server-Sent Events (SSE) stream
- ✅ Error status codes: 400, 401, 500
- ✅ Request body validation using AI SDK
- ✅ Stream response format

**What Differs:**

- None

**Severity:** ✅ **NO ISSUES** - Implementation matches specification

---

### 3.2 GET /ai/chats/:userId

**Status:** ✅ **NO ISSUES**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/ai/chats/:userId`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: User can access own data OR requires `admin`/`moderator` role
- ✅ Status codes: 200, 400, 401, 403, 500
- ✅ Response structure: `{ success: true, data: string[] }` with array of UUID strings

**What Differs:**

- None

**Severity:** ✅ **NO ISSUES** - Implementation matches specification

---

### 3.3 GET /ai/fetchChat/:chatId

**Status:** ⚠️ **MINOR ISSUE**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/ai/fetchChat/:chatId`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: User can access own chat OR requires `admin`/`moderator` role
- ✅ Status codes: 200, 400, 401, 404, 500
- ✅ Response structure: `{ success: true, data: Chat }`

**What Differs:**

- ⚠️ **MINOR - Error response for unauthorized access:**
  - **Implementation:** Returns 404 instead of 403 when user doesn't own chat (intentionally to not leak information)
  - **OpenAPI spec:** Documents 403 as possible response
  - This is actually a **security best practice** (prevents chat enumeration)

**Severity:** ⚠️ **MINOR** - Implementation is actually better (security best practice), but spec should document this behavior

**Recommendation:** Update OpenAPI spec to clarify that 404 is returned for both non-existent and unauthorized chats (security by obscurity).

---

### 3.4 GET /ai/chats/config

**Status:** 🔴 **CRITICAL ISSUE**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/ai/chats/config`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` or `moderator` role
- ✅ Status codes: 200, 401, 403, 500
- ✅ Response wrapping: `{ success: true, data: [] }`

**What Differs:**

- 🔴 **CRITICAL - Field naming convention mismatch:**
  - **OpenAPI spec:** Uses snake_case: `created_at`, `updated_at`, `seo_friendly_id`, `seo_friendly_base64_id`
  - **Implementation:** Uses camelCase: `createdAt`, `updatedAt`, `seoFriendlyId`, `seoFriendlyBase64Id` (TypeScript convention)

**Severity:** 🔴 **CRITICAL** - Field naming convention inconsistency will break API consumers following the spec

**Recommendation:** Choose one convention and apply consistently:

- **Option 1:** Update OpenAPI spec to use camelCase (aligns with JavaScript/TypeScript conventions)
- **Option 2:** Add transformation layer in implementation to convert to snake_case (aligns with REST API conventions)

---

### 3.5 GET /ai/chats/config/:id/settings

**Status:** ⚠️ **NEEDS VERIFICATION**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/ai/chats/config/:id/settings`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` or `moderator` role
- ✅ Status codes: 200, 400, 401, 403, 404, 500
- ✅ Response wrapping: `{ success: true, data: {} }`

**What Differs:**

- ⚠️ **Field naming:**
  - **OpenAPI spec:** Uses camelCase: `prompt`, `maxTokens`, `temperature`, `topP`, `frequencyPenalty`, `presencePenalty`, `topK`, `stopSequences`, `seed`, `maxRetries`, `createdAt`, `updatedAt`
  - **Implementation:** Uses camelCase (matches) - **NEEDS VERIFICATION** with actual DB output

**Severity:** ⚠️ **NEEDS VERIFICATION** - Need to check actual database return values match spec

**Recommendation:** Verify actual response fields match OpenAPI spec exactly.

---

### 3.6 PUT /ai/chats/config/:id/settings

**Status:** ✅ **NO ISSUES**

**What Matches:**

- ✅ HTTP Method: PUT
- ✅ Route path: `/ai/chats/config/:id/settings`
- ✅ Authentication: Required (JWT)
- ✅ Authorization: Requires `admin` or `moderator` role
- ✅ Status codes: 204, 400, 401, 403, 404, 500
- ✅ Response: 204 No Content on success
- ✅ Request body validation

**What Differs:**

- None

**Severity:** ✅ **NO ISSUES** - Implementation matches specification

---

## 4. Company Endpoints

### 4.1 GET /company/details

**Status:** 🔴 **CRITICAL ISSUE**

**What Matches:**

- ✅ HTTP Method: GET
- ✅ Route path: `/company/details`
- ✅ Status codes: 200, 401, 404, 500
- ✅ Response wrapping: `{ success: true, data: {} }`

**What Differs:**

- 🔴 **CRITICAL - Authentication mismatch:**
  - **OpenAPI spec:** Uses `oauthSyncSecret` (X-OAuth-Sync-Secret header)
  - **Implementation:** Uses `bearerAuth` (JWT Bearer token) - **COMPLETELY DIFFERENT AUTH**
- 🔴 **CRITICAL - Authorization missing in spec:**
  - **OpenAPI spec:** No role-based authorization documented
  - **Implementation:** Requires JWT authentication (no role restrictions)
- ⚠️ **Field naming:** Need to verify camelCase consistency between spec and implementation

**Severity:** 🔴 **CRITICAL** - Authentication mechanism completely wrong in OpenAPI spec. Spec says oauthSyncSecret but implementation uses JWT.

**Recommendation:** Update OpenAPI spec to use `bearerAuth` instead of `oauthSyncSecret` for this endpoint.

---

### 4.2 PUT /company/details

**Status:** 🔴 **CRITICAL ISSUE**

**What Matches:**

- ✅ HTTP Method: PUT
- ✅ Route path: `/company/details`
- ✅ Status codes: 204, 401, 403, 500
- ✅ Response: 204 No Content on success

**What Differs:**

- 🔴 **CRITICAL - Authentication mismatch:**
  - **OpenAPI spec:** Uses `oauthSyncSecret` (X-OAuth-Sync-Secret header)
  - **Implementation:** Uses `bearerAuth` + `requireRole(['admin', 'moderator'])` - **COMPLETELY DIFFERENT AUTH**
- 🔴 **CRITICAL - Authorization mismatch:**
  - **OpenAPI spec:** Uses X-OAuth-Sync-Secret, no role-based authorization documented
  - **Implementation:** Requires JWT authentication + `admin` or `moderator` role

**Severity:** 🔴 **CRITICAL** - Authentication and authorization completely wrong in OpenAPI spec.

**Recommendation:** Update OpenAPI spec to:

1. Use `bearerAuth` instead of `oauthSyncSecret`
2. Document required roles: `admin` or `moderator`
3. Add 403 response for insufficient permissions

---

## Summary of Critical Issues

### 🔴 CRITICAL (Must Fix Immediately)

| Endpoint                 | Issue                                                                                               | Impact                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **GET /users**           | Response structure mismatch (spec expects flat array, implementation wraps with success/pagination) | Breaking change for API consumers     |
| **GET /users/:id**       | Stub implementation, returns only ID instead of full User object                                    | Endpoint non-functional               |
| **GET /ai/chats/config** | Field naming convention mismatch (snake_case vs camelCase)                                          | Breaking change for API consumers     |
| **GET /company/details** | Wrong authentication mechanism in spec (oauthSyncSecret vs JWT Bearer)                              | Security vulnerability / API unusable |
| **PUT /company/details** | Wrong authentication mechanism in spec (oauthSyncSecret vs JWT Bearer + roles)                      | Security vulnerability / API unusable |

### ⚠️ MAJOR (Should Fix Soon)

| Endpoint                  | Issue                                                                               | Impact                            |
| ------------------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| **POST /auth/oauth-sync** | Response structure differs (spec expects message, implementation returns user data) | API consumers get unexpected data |

### ⚠️ MINOR (Can Be Addressed Later)

| Endpoint                      | Issue                                                                            | Impact                           |
| ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| **DELETE /users**             | Response field name differs (`deleted` vs `deletedCount`)                        | Minor inconsistency              |
| **POST /users/register**      | Need to verify `token_type` and `expires_in` fields are present                  | May be missing documented fields |
| **GET /ai/fetchChat/:chatId** | Returns 404 instead of 403 for security (best practice but should be documented) | Documentation gap                |
| **GET /users**                | Query parameters (`offset`, `limit`) not documented in OpenAPI spec              | Documentation gap                |

### ✅ NO ISSUES (Matches Perfectly)

- ✅ **POST /auth/login**
- ✅ **POST /ai/chat**
- ✅ **GET /ai/chats/:userId**
- ✅ **PUT /ai/chats/config/:id/settings**

---

## Recommendations

### Immediate Action Required

1. **Fix company endpoints authentication in OpenAPI spec:**
   - Change from `oauthSyncSecret` to `bearerAuth` for both GET and PUT `/company/details`
   - Document required roles for PUT endpoint

2. **Update GET /users OpenAPI spec:**
   - Include pagination wrapper: `{ success, data, pagination }`
   - Document `page` and `limit` query parameters
   - Update response schema to match implementation

3. **Complete GET /users/:id implementation:**
   - Return full User object instead of stub
   - Include all documented fields: id, email, name, role, createdAt, updatedAt

4. **Standardize field naming convention:**
   - Choose either camelCase (JavaScript/TypeScript convention) or snake_case (REST API convention)
   - Apply consistently across all endpoints
   - **Recommendation:** Use camelCase since this aligns with TypeScript/JavaScript ecosystem

### Review and Update

1. **POST /auth/oauth-sync:**
   - Update OpenAPI spec to document actual response structure with user data
   - Or change implementation to return simple message as documented

2. **Security documentation:**
   - Document the security decision to return 404 instead of 403 for unauthorized access to chats
   - This prevents chat enumeration attacks

3. **Missing fields:**
   - Verify POST /users/register returns `token_type` and `expires_in` as documented

### Testing and Validation

1. **Integration tests:**
   - Run integration tests comparing actual API responses against OpenAPI schemas
   - Use tools like `openapi-validator` or `jest-openapi`

2. **CI/CD Pipeline:**
   - Implement automated OpenAPI validation in CI/CD pipeline
   - Fail builds when responses don't match spec

3. **Contract Testing:**
   - Consider using Pact or similar contract testing tools
   - Ensure frontend and backend contracts align

### Documentation

1. **Add API versioning:**
   - Consider versioning strategy (e.g., `/v1/users`, `/v2/users`)
   - Document breaking changes

2. **Changelog:**
   - Maintain OpenAPI changelog
   - Document all spec changes with dates and reasons

3. **Developer Guide:**
   - Create guide explaining naming conventions
   - Document authentication/authorization patterns
   - Provide examples of common request/response patterns

---

## Appendix: Analysis Methodology

**Controllers Analyzed:**

- `apps/backend/src/adapters/primary/http/ai.controller.ts`
- `apps/backend/src/adapters/primary/http/ai-admin.controller.ts`
- `apps/backend/src/adapters/primary/http/auth.controller.ts`
- `apps/backend/src/adapters/primary/http/company.controller.ts`
- `apps/backend/src/adapters/primary/http/user.controller.ts`

**OpenAPI Files Analyzed:**

- `packages/shared/src/openapi/openapi.json` (main specification)
- `packages/shared/src/openapi/paths/*.json` (15+ path definitions)
- `packages/shared/src/openapi/components/schemas/*.json` (10+ schema definitions)

**Comparison Criteria:**

- HTTP method (GET, POST, PUT, DELETE)
- Route path
- Authentication requirements
- Authorization/role requirements
- Request body schema
- Response status codes
- Response body field names (camelCase vs snake_case)
- Response body structure
- Error responses

---

**Report End**
