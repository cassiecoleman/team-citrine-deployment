# Driver Location Realtime (Issue #28 / US08)

## Summary

Implemented persistent realtime driver location updates using Supabase `driver_locations` + `postgres_changes` subscriptions for rider tracking screens.

## Data Model

Table used: `public.driver_locations`

Relevant columns:
- `driver_id` (unique FK to `drivers.id`)
- `lat` (double precision)
- `lng` (double precision)
- `heading` (double precision, nullable)
- `recorded_at` (timestamp)
- `updated_at` (timestamp via trigger)

## Security (RLS)

Migration added:
- `ultra-web/supabase/migrations/20260413162000_tighten_driver_location_rls.sql`

Policy updates:
- Drop broad rider read policy.
- Add rider SELECT policy limited to active rides where `rides.rider_id` maps to `auth.uid()`.
- Add explicit admin SELECT policy.
- Keep existing service role access.

## Server Action API

File:
- `ultra-web/src/features/driver-trips/actions.ts`

Action:
- `updateDriverLocation(input)`

Input shape:
- `driverUserId: string`
- `lat: number` (`-90..90`)
- `lng: number` (`-180..180`)
- `heading?: number` (`0..360`)
- `recordedAt?: string` (ISO datetime)

Behavior:
- Validates input with Zod.
- Resolves `driver_id` from `drivers.user_id`.
- Throttles writes if last update is `< 3 seconds` old.
- Upserts location by `driver_id`.
- Returns `{ success: false, error: string }` on validation/DB failures.

## Rider Realtime Subscription

Hook:
- `ultra-web/src/features/ride-tracking/use-driver-location.ts`

Behavior:
- Subscribes to `public.driver_locations` changes filtered by `driver_id`.
- Updates local state with latest `lat/lng/heading`.
- Reconnects on channel error/timeout/close.
- Cleans up subscription on unmount.

## UI Wiring

Updated components:
- `DriverEnRouteCard` shows live location text.
- `InProgressTracker` replaces placeholder-only map block with live location readout.

`getRideStatus()` now maps real `driver_id` from `rides` so rider UI subscribes to the correct driver location stream.

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Tests Added

Unit (Vitest):
- `driver-trip-operations.test.ts`
  - upsert location update
  - throttle under 3 seconds
- `use-driver-location.test.tsx`
  - realtime subscription + payload mapping
- `in-progress-tracker-location.test.tsx`
  - in-progress UI live location rendering
- `driver-en-route-location.test.tsx`
  - en-route UI live location rendering
- `ride-tracking-actions.test.ts`
  - preserves DB `driver_id` in ride model

E2E (Playwright):
- `e2e/rider-ride-tracking.spec.ts`
  - `driver location updates live on rider tracking cards`
