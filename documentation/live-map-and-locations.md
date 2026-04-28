# Live Locations & Admin Live Map

## Overview

Riders and drivers can set a current location (manually, via address or
lat/lng). Admins see every active rider and driver as live moving dots on
`/admin/live-map`, with a dotted "candidate" line drawn from each rider to
the nearest available driver.

This document covers the schema, server actions, RLS policies, and the two
demo pathways (`scripts/demo-live-map.ts` and `e2e/demo-live-map.spec.ts`).

## Data model

| Table              | Columns added / used                                                | Notes |
| ------------------ | ------------------------------------------------------------------- | ----- |
| `riders`           | `current_lat`, `current_lng`, `current_location_updated_at`         | Added in `20260427233007_add_rider_location_and_publish_realtime.sql` |
| `driver_locations` | (existing) `driver_id`, `lat`, `lng`, `source`, `recorded_at`       | One row per driver, `source = 'manual'` for user-entered |
| `user_roles`       | (existing) `role` ∈ `'rider' \| 'driver' \| 'admin'`                | Drives which table the location action writes to |

Both `riders` and `driver_locations` are added to `supabase_realtime`,
so the admin map subscribes to `postgres_changes` on both.

### RLS policies (no `FOR ALL` for end users)

All policies are granular per-operation:
- `Riders update own profile` (existing) — covers UPDATE on the new
  columns since RLS applies to rows, not columns.
- `Riders read own profile` (existing) — same for SELECT.
- `Admins read all riders` (existing) — used by `getActiveLiveLocations`
  via the service-role client, but the policy stays in place for any
  future anon-client admin views.
- `Drivers read assigned rider for active rides` **(new)** — SELECT-only,
  gated on an active ride between caller and rider.

## Server actions

In `src/features/location/actions.ts`:

```ts
updateMyLocation(input: { lat?, lng?, address? }, userId: string)
  → { success: true, data: { lat, lng, updatedAt } }
  | { success: false, error: string }

submitMyLocation(prev, input | FormData)   // useActionState-friendly wrapper
  // resolves caller from the Supabase session, no userId arg.

getActiveLiveLocations(userId: string)
  → { success: true, data: { riders: [...], drivers: [...] } }
  | { success: false, error: string }   // admin-only
```

Address inputs are geocoded via OpenStreetMap Nominatim
(`src/lib/geo.ts:geocodeAddress`). Nominatim is keyless and free; we
send a project-identifying `User-Agent` per their ToS.

## UI

- `LocationEntryCard` (`src/features/location/components/`) is mounted on
  the rider home page (`src/app/(rider)/page.tsx`) and the driver shift
  board (`src/app/(driver)/driver/page.tsx`). Two-tab segmented control
  switches between **Address** (default) and **Lat / Lng**.
- `LiveMapClient` (`src/features/admin-live-map/components/`) renders a
  Leaflet `MapContainer` with rider dots (blue, `#2563eb`), driver dots
  (orange, `#f97316`), and dashed match-candidate polylines. Subscribes
  to a single `admin-live-map` channel listening to `postgres_changes`
  on both location-bearing tables.
- The admin nav link is added in
  `src/features/admin-dashboard/components/AdminPageShell.tsx`.

## Demo pathways

### A. Standalone Node orchestrator
`npm run demo:live-map` (a wrapper for
`npx tsx scripts/demo-live-map.ts`). Spawns 7 riders + 3 drivers + 1
admin via service role, opens **one** Chromium window logged in as the
admin parked on `/admin/live-map`, then in ≤2 minutes:

1. Stagger-fires 7 ride requests (every 1.5 s).
2. Picks the nearest available driver per ride (haversine), simulates
   `acceptTrip` by transitioning ride status to `driver_en_route`.
3. Animates each driver to pickup over ~6 s in 750 ms ticks.
4. Marks `arrived` → `in_progress`, animates driver to dropoff,
   marks `completed`.
5. Cleans up all seeded users + rides in a `finally` block.

Hard-deadlines at 115 s so cleanup always has a margin.

### B. Playwright multi-context spec
`npm run test:e2e -- e2e/demo-live-map.spec.ts`. Boots **11** real
`BrowserContext`s, each cookie-injected with the appropriate Supabase
session, navigates them to `/`, `/driver`, or `/admin/live-map` in
parallel, and asserts each lands on its expected screen. Does not
animate the full ride lifecycle — that's the Node script's job.
Time-boxed at 120 s.

Both pathways share `e2e/helpers/demo-fleet.ts` for seeding + cleanup.

## Verification checklist

1. `npm test -- src/features/location src/features/admin-live-map src/lib`
   — 13 unit tests pass.
2. Apply migration to remote DB: `npm run db:push` (or via Supabase
   dashboard), then `npm run db:types` to regenerate
   `src/types/supabase.ts`.
3. `npm run dev`, log in as a rider, type
   "1150 West End Ave, Memphis, TN" in the LocationEntryCard, then
   switch to admin and confirm a blue dot at that address.
4. `npm run demo:live-map` completes in ≤120 s and ends with no
   `pw-demo-*` users left in the DB.
5. `npm run test:e2e -- e2e/admin-live-map.spec.ts` — single-flow proof.
6. `npm run test:e2e -- e2e/demo-live-map.spec.ts` — multi-context proof.

## Known gotchas

- **Nominatim rate limit**: 1 req/s, no key. Fine for the demo's
  one-off geocodes; if we ever load-test, cache or swap to AWS Location
  Service.
- **Realtime fan-out at 11 users**: each browser context = one
  WebSocket. Inside the Supabase free-tier connection cap, but watch.
- **Playwright `workers: 1`**: cross-test concurrency is serial, but
  within a single test we can spawn many contexts. Both demo specs
  spawn contexts inside one `test()`.
- **`db:types` was hand-edited** in this PR to keep TypeScript happy
  before the migration runs. Run `npm run db:types` against the remote
  DB before merging.
