# Ride Pass Subscription API

## Overview

The ride pass system lets riders purchase weekly ride bundles at a discounted rate. Plans are static (not stored in DB); purchased passes are tracked in the `ride_passes` table.

## Server Actions

All authenticated actions require a `userId` parameter (Supabase Auth user ID). Returns `PassActionResult<T>` — either `{ success: true, data: T }` or `{ success: false, error: string }`.

### `getAvailablePasses(): Promise<RidePassPlan[]>`

Returns the static plan catalog. No auth required.

**Plans:**
| Plan ID | Tier | Rides/Week | Price/Week | Price/Ride |
|---------|------|------------|------------|------------|
| plan-5 | weekly-5 | 5 | $75 | $15 |
| plan-10 | weekly-10 | 10 | $140 | $14 |

### `purchasePass(planId, userId?): Promise<PassActionResult<ActiveRidePass>>`

Creates a `ride_passes` row. Stripe integration stubbed for M5.

- Validates `planId` against plan catalog
- Looks up rider by `userId`
- Sets `expires_at` to 7 days from purchase
- Sets `rides_remaining` equal to plan's `ridesPerWeek`

### `getActivePassForUser(userId?): Promise<PassActionResult<ActiveRidePass | null>>`

Fetches the rider's most recent active pass, or null if none.

### `decrementPassRide(passId, userId?): Promise<PassActionResult<{ ridesRemaining: number }>>`

Reduces `rides_remaining` by 1. Sets status to `exhausted` when it reaches 0. Uses optimistic concurrency via `version` column to prevent double-decrement.

### `cancelPass(passId, reason, userId?): Promise<PassActionResult<{ id, status }>>`

Sets pass status to `cancelled` with reason and timestamp. Only works on active passes.

## Database Table: `ride_passes`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| rider_id | UUID FK | References riders.id |
| plan_name | TEXT | Plan tier (e.g., "weekly-5") |
| plan_description | TEXT | Human-readable description |
| rides_total | INT | Total rides in the plan |
| rides_remaining | INT | Rides left to use |
| price_paid | NUMERIC(10,2) | Amount paid |
| status | TEXT | active / expired / cancelled / exhausted |
| stripe_subscription_id | TEXT | Stripe ID (null for M3) |
| purchased_at | TIMESTAMPTZ | When purchased |
| expires_at | TIMESTAMPTZ | Expiration date |
| cancelled_at | TIMESTAMPTZ | When cancelled (null if active) |
| cancellation_reason | TEXT | Why cancelled |
| version | INT | Optimistic concurrency version |

## Type Mapping

Frontend `RidePassPlan` (static catalog) maps to DB `ride_passes` row via:
- `plan.tier` → `plan_name`
- `plan.ridesPerWeek` → `rides_total` / `rides_remaining`
- `plan.pricePerWeek` → `price_paid`
- `rides_total - rides_remaining` → `usedRides`

## Files

- `src/features/ride-pass/actions.ts` — Server actions
- `src/features/ride-pass/plan-catalog.ts` — Static plan definitions
- `src/features/ride-pass/mappers.ts` — DB row → frontend type converter
- `src/features/ride-pass/schemas.ts` — Zod validation schemas
- `src/features/ride-pass/__tests__/ride-pass-actions.test.ts` — Unit tests
- `e2e/rider-pass.spec.ts` — E2E tests
