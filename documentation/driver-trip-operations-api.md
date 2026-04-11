# Driver Trip Operations API (Issue #22)

This feature implements Supabase-backed server actions for US18, US19, and US20.

## Files

- `ultra-web/src/features/driver-trips/actions.ts`
- `ultra-web/src/app/(driver)/driver/page.tsx`
- `ultra-web/src/app/(driver)/queue/page.tsx`
- `ultra-web/src/app/(driver)/trip/[id]/page.tsx`
- `ultra-web/src/app/(driver)/trip/[id]/pickup/page.tsx`

## Server Actions

- `getAssignedTrips(driverUserId)`
  - Reads `rides` where `status = matching`
  - Maps rows into `TripAssignment` objects for queue UI

- `acceptTrip({ rideId, driverUserId })`
  - Resolves `drivers.id` from `drivers.user_id`
  - Validates current ride status is `matching`
  - Updates `rides.status` to `driver_en_route`
  - Sets `rides.driver_id` and `rides.matched_at`

- `rejectTrip({ rideId, driverUserId, reason? })`
  - Resolves `drivers.id` from `drivers.user_id`
  - Returns ride to `matching`
  - Clears `rides.driver_id`

- `confirmPickup({ rideId, driverUserId })`
  - Resolves `drivers.id` from `drivers.user_id`
  - Updates `rides.status` to `in_progress`
  - Sets `rides.pickup_at`

- `completeTrip({ rideId, driverUserId, fareFinal })`
  - Resolves `drivers.id` from `drivers.user_id`
  - Updates `rides.status` to `completed`
  - Sets `rides.fare_final` and `rides.completed_at`
  - Sets `drivers.status` back to `available`

- `getDriverStatus(driverUserId)`
  - Returns driver identity + status + active trip id if one exists

- `toggleDriverAvailability({ driverUserId, nextStatus })`
  - Supports `available` and `offline` status updates

## Driver UI Wiring

- `/driver`
  - Reads current status from backend-backed action
  - Availability toggle routes through query params and calls `toggleDriverAvailability`

- `/queue`
  - Loads assignments from `getAssignedTrips`
  - Reject flow routes through query params and calls `rejectTrip`

- `/trip/[id]`
  - Accept flow calls `acceptTrip` when opening trip details

- `/trip/[id]/pickup`
  - Confirm flow routes through query params and calls `confirmPickup`

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional local driver fallback:
  - `ULTRA_DEFAULT_DRIVER_USER_ID`
  - `ULTRA_DEFAULT_USER_ID`

When fallback IDs are not present in local development, UI keeps mock-compatible behavior.

## Test Plan

- Unit:
  - `npx vitest run --config vitest.backend.config.mts src/features/driver-trips/__tests__/driver-trip-operations.test.ts src/features/driver-trips/__tests__/driver-trips.actions.test.ts`
- E2E:
  - `npm run test:e2e -- e2e/driver-flows.spec.ts`
