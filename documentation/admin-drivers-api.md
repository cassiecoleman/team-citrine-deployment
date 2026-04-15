# Admin Drivers API (Issue #35)

Issue: #35
User stories: US21, US25

## Goal

Replace mock admin driver-table data with real Supabase-backed queries, including search, filter, sorting, and pagination.

## Planned Server Actions

- `getAllDrivers(params)` (admin only)
- Search by:
  - driver name
  - email
  - license plate
- Filter by:
  - status (`available`, `offline`, `on_trip`)
  - child-safe certification
- Sort by:
  - name
  - rating
  - status
  - joined date

## Request Parameters

```ts
type DriverTableQuery = {
  page?: number
  pageSize?: number
  search?: string
  status?: 'available' | 'offline' | 'on_trip' | 'all'
  childSafeOnly?: boolean
  sortBy?: 'name' | 'rating' | 'status' | 'joined_date'
  sortDir?: 'asc' | 'desc'
}
```

## Response Shape

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type DriverTableResult = {
  rows: Array<{
    id: string
    name: string
    email: string
    status: 'available' | 'offline' | 'on_trip'
    rating: number | null
    licensePlate: string | null
    childSafeCertified: boolean
    joinedAt: string
  }>
  total: number
  page: number
  pageSize: number
}
```

## Authorization

- Validate authenticated user in every action.
- Require admin role before querying driver table data.
- Return consistent `{ success: false, error }` on auth failure.

## Testing Plan

1. Unit tests (Vitest)
- access control: non-admin denied
- query builder behavior for search/filter/sort/pagination
- empty result handling

2. E2E test (Playwright)
- admin opens driver table
- admin searches by name
- admin applies status filter
- table results update accordingly

## Wiring Plan

- Replace mock actions in admin driver feature with real server actions.
- Keep UI components as-is; swap data source and parameter handling.
