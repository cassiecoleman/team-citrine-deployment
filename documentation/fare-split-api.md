# Fare Splitting API

## Overview

The fare split system lets a rider invite another rider to split a ride fare 50/50. The invitee can accept or decline within a 30-minute window.

## Auth Model (Pre-M2)

Authenticated actions accept an optional `userId` parameter. This is a **transitional pattern** — `userId` must be derived server-side by the caller, never from raw client input. When M2 auth (#17–#19) ships, these actions will be migrated to derive identity from the Supabase session/JWT internally. See `MASTER_PROMPT.md` "Server Action Auth Pattern" for details.

## Server Actions

All authenticated actions require a `userId` parameter (Supabase Auth user ID). Returns `SplitActionResult<T>` — either `{ success: true, data: T }` or `{ success: false, error: string }`.

### `createFareSplit(input, userId?): Promise<SplitActionResult<FareSplit>>`

Creates a `fare_splits` row with a 50/50 split and 30-minute expiry.

**Input:** `{ rideId: string (UUID), inviteeId: string (UUID), totalFare: number }`

- Validates input with Zod
- Calculates 50/50 split amounts
- Sets `expires_at` to 30 minutes from creation
- Fetches both rider names for the mapped response

### `acceptFareSplit(splitId, userId?): Promise<SplitActionResult<FareSplit>>`

Invitee accepts the fare split.

- Verifies caller is the invitee (not the inviter)
- Verifies split is still `pending`
- Sets `status` to `accepted` and `responded_at` to now

### `declineFareSplit(splitId, userId?): Promise<SplitActionResult<{ id, status }>>`

Invitee declines the fare split.

- Same identity and status checks as accept
- Sets `status` to `declined`

### `getFareSplitForRide(rideId, userId?): Promise<SplitActionResult<FareSplit | null>>`

Gets the fare split for a ride, if the caller is a participant (inviter or invitee).

## Database Table: `fare_splits`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ride_id | UUID FK | References rides.id |
| inviter_id | UUID FK | Rider who initiated the split |
| invitee_id | UUID FK | Rider invited to split |
| inviter_amount | NUMERIC(10,2) | Inviter's share |
| invitee_amount | NUMERIC(10,2) | Invitee's share |
| status | TEXT | pending / accepted / declined / expired |
| responded_at | TIMESTAMPTZ | When invitee responded |
| expires_at | TIMESTAMPTZ | Expiry for pending splits |

## Security

- **DB trigger** `enforce_fare_split_invitee_response` prevents invitees from modifying split amounts — they can only change status.
- **RLS policies** ensure only split participants can see/modify their own splits.
- Server actions verify caller identity before allowing accept/decline.

## Split Lifecycle

```
pending → accepted (invitee accepts)
pending → declined (invitee declines)
pending → expired  (30-minute window passes)
```

## Files

- `src/features/fare-split/actions.ts` — Server actions
- `src/features/fare-split/mappers.ts` — DB row → frontend type converter
- `src/features/fare-split/schemas.ts` — Zod validation schemas
- `src/features/fare-split/__tests__/fare-split-actions.test.ts` — Unit tests
- `e2e/rider-fare-split.spec.ts` — E2E tests
