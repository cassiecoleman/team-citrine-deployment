# Admin Active & Completed Rides API (Issue #37)

This feature replaces mock admin rides/completed data with real Supabase-backed server actions and server-rendered table pages.

## Routes

- `/admin/rides`
  - Source: `src/app/(admin)/admin/rides/page.tsx`
  - Data action: `getActiveRides(query)`
- `/admin/completed`
  - Source: `src/app/(admin)/admin/completed/page.tsx`
  - Data action: `getCompletedRides(query)`

## Server Actions

- `src/features/admin-dashboard/rides-actions.ts`
  - `getActiveRides()`
    - statuses: `driver_en_route`, `arrived`, `in_progress`
    - includes search, status filter, date range filter, started_at sort
  - `getCompletedRides()`
    - status: `completed`
    - includes search, date range, fare range, completed/fare sort
    - includes pagination metadata (`total`, `page`, `pageSize`, `totalPages`)

## Authorization

Both actions require:
- authenticated session via `createServerAuthClient()`
- active `admin` role in `user_roles` (`deleted_at IS NULL`)

## Data Sources

- `rides` table (primary)
- `riders` table for rider display names
- `drivers` table for driver display names

## Query Parameters

### `/admin/rides`
- `search`
- `status` (`all`, `driver en route`, `arrived`, `in progress`)
- `dateFrom`
- `dateTo`
- `sort` (`started_desc`, `started_asc`)

### `/admin/completed`
- `search`
- `dateFrom`
- `dateTo`
- `fareMin`
- `fareMax`
- `sort` (`completed_desc`, `completed_asc`, `fare_desc`, `fare_asc`)
- `page`

## Local Fallback

If Supabase env/auth is unavailable in local/e2e contexts, both pages gracefully fall back to seeded admin mock data while preserving the same search/filter/sort logic.

## Tests

- Unit
  - `src/features/admin-dashboard/__tests__/admin-rides.helpers.test.ts`
  - `src/features/admin-dashboard/__tests__/admin-rides.actions.test.ts`
- E2E
  - `e2e/admin.spec.ts` (active rides → completed rides → search)
