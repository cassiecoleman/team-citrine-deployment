# Ride Status Realtime (Issue #27)

## Scope

This document covers the realtime rider-tracking implementation for US13-US16 on branch `feature/ride-realtime`.

## What Was Implemented

- Added rider status normalization adapter:
  - `driver_en_route` (DB) maps to `en_route` (UI)
  - `requested` maps to `matching` for waiting state
- Added realtime subscription hook:
  - File: `ultra-web/src/features/ride-tracking/use-ride-status.ts`
  - Subscribes to `rides` updates via Supabase channel filtered by `id`
  - Auto-reconnects on `CHANNEL_ERROR`, `TIMED_OUT`, and `CLOSED`
  - Unsubscribes channel on unmount
- Updated `RideStatusPage` to consume hook state instead of timer-based fake transitions.
- Updated `getRideStatus` to load initial ride state from Supabase `rides` row (with existing mock fallback if Supabase config is not present).

## Status Transition Support

Rider UI status flow now supports:

1. `matching`
2. `driver_en_route` (rendered as `en_route`)
3. `arrived`
4. `in_progress`
5. `completed` (redirects to `/ride/{id}/complete`)

## Tests Added

### Unit (Vitest)

- `ride-status-adapter.test.ts`
  - status normalization and basic view-model behavior
- `use-ride-status.test.tsx`
  - realtime subscription lifecycle
  - update application from `postgres_changes` payloads
  - reconnect behavior
- `ride-status-page-realtime.test.tsx`
  - hook-driven rendering in `RideStatusPage`
  - redirect on completed status
- `ride-tracking-actions.test.ts`
  - `getRideStatus` DB mapping behavior

### E2E (Playwright)

- `e2e/rider-ride-tracking.spec.ts`
  - added `status updates live on the ride page`
  - verifies live transitions in the tracking UI

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

When service role config is missing, `getRideStatus` uses the existing mock fallback path to keep local UX functional.
