✅ useRegistrationForm (client-side hook) - handles form state and validation
✅ useRegisterUser (client-side hook) - React Query mutation that calls registerUser from application layer
✅ registerUser (application/actions) - does a fetch() to /api/register
✅ /api/register route (route.ts) - Next.js API route (server-side) that forwards to the backend

So the complete flow is:

Client → useRegistrationForm → useRegisterUser (React Query) → registerUser (fetch) → Server /api/register route → Backend API

The /api/register route then forwards the request to the backend using BACKEND_AI_CALLBACK_URL (port 3000).