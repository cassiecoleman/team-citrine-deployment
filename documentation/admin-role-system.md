# Admin Role System — Issue #16

## Overview

The admin role system provides role-based access control (RBAC) for Ultra's three user types: `rider`, `driver`, and `admin`. Roles are stored in the `user_roles` table (created in migration `20260408221130_create_riders_schema.sql`) and enforced via RLS policies and server-action guards.

## Database Schema

The `user_roles` table stores one role per auth user:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK → auth.users, UNIQUE) | One role per user |
| `role` | TEXT CHECK (`rider`, `driver`, `admin`) | Enforced at DB level |
| `created_by` | UUID (FK → auth.users) | Audit: who assigned the role |
| `updated_by` | UUID (FK → auth.users) | Audit: who last changed it |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |
| `deleted_at` | TIMESTAMPTZ | Soft delete |
| `version` | INT | Optimistic locking |

## Server Actions

All admin actions are in `src/features/admin-dashboard/admin-actions.ts`.

| Action | Auth | Description |
|--------|------|-------------|
| `createAdminUser(email, password)` | Admin only | Creates auth user + assigns admin role. Rolls back on failure. |
| `updateUserRole(userId, role)` | Admin only | Changes a user's role. Validates role enum via Zod. |
| `getAdminUsers()` | Admin only | Lists all users with admin role, sorted by created_at desc. |
| `deleteAdminUser(userId)` | Admin only | Soft-deletes the role (sets `deleted_at`). Does not delete the auth user. |
| `getCurrentUserRole()` | Any authenticated | Returns the calling user's role. No admin check required. |

## Authorization

Every admin mutation calls `requireAdminRole()` which:
1. Gets the current user from Supabase Auth session
2. Queries `user_roles` for that user's role
3. Throws `"Unauthorized: Admin role required"` if not admin

## Seeding Admin Accounts

Run the seed script to create 3 test admin accounts:

```bash
npx tsx scripts/seed-admins.ts
```

| Email | Password |
|-------|----------|
| admin1@ultra-app.test | UltraAdmin2026! |
| admin2@ultra-app.test | UltraAdmin2026! |
| admin3@ultra-app.test | UltraAdmin2026! |

The script is idempotent — it skips accounts that already exist.

## Tests

3 real-DB integration tests in `src/features/admin-dashboard/__tests__/admin-role-system.test.ts`:
1. Admin user can be assigned admin role via user_roles table
2. Role assignment respects CHECK constraint (rejects invalid roles)
3. user_id has UNIQUE constraint (one role per user)
