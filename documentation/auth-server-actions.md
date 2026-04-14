# Auth Server Actions (Issue #17)

This document covers the server actions implemented in `ultra-web/src/features/auth/actions.ts`.

## Actions

- `signUp(input)`
- `signIn(input)`
- `signOut()`
- `resetPassword(input)`
- `getSession()`
- `getCurrentUser()`

## Input Models

### `signUp`

```ts
{
  email: string; // valid email
  password: string; // min 8 chars
  role?: 'rider' | 'driver' | 'admin'; // defaults to 'rider'
}
```

Behavior:
- Creates user with Supabase Admin API
- Stores role in `user_metadata`
- Inserts role row into `user_roles`
- Rolls back created auth user if role insert fails

### `signIn`

```ts
{
  email: string; // valid email
  password: string;
}
```

### `resetPassword`

```ts
{
  email: string; // valid email
}
```

## Output Shape

Actions return a typed response:

```ts
type AuthResponse<T = void> =
  | { success: true; data: T }
  | { success: true }
  | { success: false; error: string }
```

## Server/Auth Client Usage

- `createServiceRoleClient()` is used only where admin API access is required (`signUp`).
- `createServerAuthClient()` is used for session-aware server actions (`signIn`, `signOut`, `resetPassword`, `getSession`, `getCurrentUser`).
- `getSession()` relies on `auth.getUser()` for server-side identity validation.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (used for password reset redirect URL)

## Tests

Unit tests for these actions are in:

- `ultra-web/src/features/auth/__tests__/auth-actions.test.ts`

