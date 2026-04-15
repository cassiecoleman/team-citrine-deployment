# Role-Based Middleware & Route Protection

## Overview

Next.js middleware intercepts every non-API request and enforces authentication and role-based access control. Unauthenticated users are redirected to `/login`. Authenticated users are restricted to routes matching their role.

## Public Routes (no auth required)

- `/login`
- `/register`
- `/auth/reset-password`
- `/api/webhooks`

## Role → Route Mapping

| Role | Allowed route prefixes |
|------|----------------------|
| rider | `/`, `/book`, `/passes`, `/profile`, `/safety`, `/ride`, `/receipt` |
| driver | `/driver`, `/queue`, `/trip` |
| admin | `/admin` (plus all rider/driver routes — admins have full access) |

## Role Home Pages (redirect targets)

| Role | Home path |
|------|-----------|
| rider | `/` |
| driver | `/driver` |
| admin | `/admin` |

If an authenticated user visits a route outside their role, they are redirected to their role's home page.

## How It Works

1. Middleware checks if the route is public → allow through
2. Creates a Supabase client from request/response cookies (`createMiddlewareAuthClient`)
3. Calls `supabase.auth.getUser()` to verify session
4. Looks up `user_roles` table for the user's role (filters `deleted_at IS NULL`)
5. Checks if the role can access the requested path
6. Redirects to `/login` (no session) or role home (wrong role)

## Auth Guard Utilities (`src/lib/auth-guards.ts`)

For use in server actions and server components:

- `requireAuth()` — returns the current user or throws `UnauthorizedError`
- `requireRole(role)` — returns the current user if they have the required role
- `getCurrentUserAndRole()` — returns `{ user, role }` from session + `user_roles` table

## Files

- `ultra-web/middleware.ts` — Next.js middleware entry point
- `ultra-web/src/lib/supabase-server.ts` — `createMiddlewareAuthClient()`, `createServerAuthClient()`
- `ultra-web/src/lib/auth-guards.ts` — Server-side auth utilities
- `ultra-web/src/lib/__tests__/middleware-auth.test.ts` — Unit tests for route mapping
- `ultra-web/src/lib/__tests__/auth-guards.test.ts` — Unit tests for auth guards
- `ultra-web/e2e/auth-middleware.spec.ts` — E2E tests for redirect behavior

## Notes

- API routes (`/api/*`) are excluded from middleware — they handle their own auth
- The middleware matcher pattern: `/((?!api|_next/static|_next/image|favicon.ico).*)`
