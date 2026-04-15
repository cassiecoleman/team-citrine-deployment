# Admin Requests API (Issue #36)

This feature replaces the mock admin requests table with a real server-side data path backed by Supabase.

## Route

- Page: `/admin/requests`
- Source: `src/app/(admin)/admin/requests/page.tsx`

## Backend Action

- Action: `fetchAdminRequests(query)`
- Source: `src/features/admin-dashboard/requests-actions.ts`

### Authorization

- Requires an authenticated user via `createServerAuthClient()`.
- Requires an active `admin` role in `user_roles` (`deleted_at IS NULL`).

### Data source

- Reads from `rides` where:
  - `deleted_at IS NULL`
  - `status IN ('requested', 'matching', 'driver_assigned')`
- Reads rider names from `riders` (`id`, `name`) for matching `rider_id` values.

## Supported query params

- `search`: search across request id, rider name, pickup, and dropoff
- `status`: `all`, `pending`, `matching`, `assigned` (also accepts db aliases `requested`, `driver_assigned`)
- `requestType`: `all`, `immediate`, `scheduled`
- `childSafe`: `all`, `required`, `not_required`
- `sort`: `requested_desc`, `requested_asc`, `scheduled_asc`, `scheduled_desc`

## Local fallback behavior

When Supabase environment variables are missing in local/e2e runs, the page gracefully falls back to `adminRequests` mock constants while still applying the same filtering/sorting logic.

## Tests

- Unit:
  - `src/features/admin-dashboard/__tests__/admin-requests.actions.test.ts`
  - `src/features/admin-dashboard/__tests__/admin-requests.authorization.test.ts`
- E2E:
  - `e2e/admin.spec.ts`
