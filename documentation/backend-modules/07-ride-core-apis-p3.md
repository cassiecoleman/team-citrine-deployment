# Module 7: Ride Core APIs (P3)

## Scope

Implements issue #21 for US01, US02, US11, US12 using Supabase-backed server actions in:

- `ultra-web/src/features/ride-scheduling/actions.ts`
- `ultra-web/src/app/(rider)/book/page.tsx`
- `ultra-web/src/app/(rider)/book/schedule/page.tsx`

## Implemented Actions

- `createRide(input, userId?)`
- `scheduleRide(input, userId?)`
- `createRecurringRide(input, userId?)`
- `cancelRide(rideId, reason)`
- `getRideById(rideId)`
- `getRidesForRider(userId, pagination)`

All actions return a consistent shape:

- Success: `{ success: true, data: ... }`
- Failure: `{ success: false, error: string }`

## Validation + Auth

- Uses Zod validation in `ride-scheduling/actions.ts` for:
- Location payloads
- Schedule timestamp format
- Recurrence rule presence
- Cancellation payload
- Pagination bounds
- Auth guard behavior:
- Rider-initiated create/schedule/list actions require `userId`
- Rider profile lookup is enforced via `riders.user_id -> riders.id`

## Data Model + Migration Dependency

This feature depends on merged migration commit `8e1aacd`, especially:

- `ultra-web/supabase/migrations/20260408221235_create_rides_schema.sql`

Used columns:

- `rides.rider_id`
- `rider_id` lookup by `riders.user_id`
- `pickup_*`, `dropoff_*`
- `status`
- `scheduled_for`
- `is_recurring`
- `recurrence_rule`
- `cancel_reason`
- `cancelled_at`

## Booking UI Wiring

- `/book` now submits through a server action (`requestRideAction`) and attempts real `createRide`.
- `/book/schedule` submits through a server action (`submitScheduleAction`) and routes to:
- `scheduleRide` for one-time rides
- `createRecurringRide` for recurring rides

Current auth fallback for local dev without full session wiring:

- Uses `ULTRA_DEFAULT_USER_ID` when present.
- If action fails, user is redirected back to a safe route.

## Environment Variables

Required (already used elsewhere in repo):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for local booking flow:

- `ULTRA_DEFAULT_USER_ID`

## Verification

- Unit (targeted): `npm test -- src/features/ride-scheduling/__tests__/ride-actions.test.ts`
- E2E (targeted): `npm run test:e2e -- e2e/rider-booking.spec.ts`
