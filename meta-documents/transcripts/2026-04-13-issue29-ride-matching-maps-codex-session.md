# Codex Transcript — Issue #29 Ride Matching Maps

- **Date:** 2026-04-13
- **Repository:** `ai4sd-s26-memphis/team-citrine`
- **Branch:** `feature/ride-matching-maps`
- **Primary issue:** #29 (Integrate Leaflet maps with real geocoding; US11, US08)
- **AI assistant:** Codex

## Session Goals

1. Sync `feature/ride-matching-maps` with `main`.
2. Review issue #29 and present three implementation plans.
3. Implement selected Plan 2 (hybrid P3->P4 bridge) using strict Red-Green TDD.
4. Add documentation and issue summary update.

## Key User Prompts (Condensed)

- Requested branch sync with `main`.
- Requested three implementation plans for issue #29 and recommendation.
- Chose implementation and requested full development.
- Requested issue comment in issue #22 style.
- Requested this transcript export and link in issue comment.

## Plan Options Presented

1. P3 MVP (stub-first, fastest).
2. Hybrid provider architecture (stub + real provider paths) **recommended/selected**.
3. Full real integration now (highest scope).

## Implementation Work Completed

### Maps Provider Layer

- Added `ultra-web/src/features/maps/geocoding-provider.ts`
  - `StubGeocodingProvider`
  - `NominatimGeocodingProvider`
  - `createGeocodingProvider()` env selector
- Added `ultra-web/src/features/maps/routing-provider.ts`
  - `StubRoutingProvider`
  - `OSRMRoutingProvider` (route parsing + ETA matrix parsing)
  - `createRoutingProvider()` env selector

### Reusable Leaflet Component

- Added `ultra-web/src/features/maps/components/RideMap.tsx`
  - OpenStreetMap tile layer
  - Pickup and dropoff markers
  - Optional route polyline
  - Optional realtime driver marker
  - `data-testid="ride-map"` for testability

### Booking Flow Integration

- Updated `ultra-web/src/app/(rider)/book/BookingClient.tsx`
  - Replaced static route placeholder with interactive map
  - Added destination search input/button
  - Wired geocoding + routing providers to update destination, route, distance, ETA
  - Added hidden form fields for pickup/dropoff values used by server action
  - Used dynamic import for map component to avoid server-side `window` reference
- Updated `ultra-web/src/app/(rider)/book/page.tsx`
  - `requestRideAction(formData)` now reads hidden pickup/dropoff fields and passes to `createRide`

### Realtime Tracking Map Integration

- Updated `ultra-web/src/features/ride-tracking/components/DriverEnRouteCard.tsx`
  - Added live route map with realtime driver marker
- Updated `ultra-web/src/features/ride-tracking/components/InProgressTracker.tsx`
  - Added live route map with realtime driver marker

### Documentation

- Added `documentation/ride-matching-maps.md`

## Tests Added/Updated

### Unit (Vitest)

- `ultra-web/src/features/maps/__tests__/geocoding-provider.test.ts`
- `ultra-web/src/features/maps/__tests__/routing-provider.test.ts`
- `ultra-web/src/app/(rider)/book/BookingClient.test.tsx`
- `ultra-web/src/features/ride-tracking/__tests__/driver-en-route-location.test.tsx`
- `ultra-web/src/features/ride-tracking/__tests__/in-progress-tracker-location.test.tsx`

### E2E (Playwright)

- Updated `ultra-web/e2e/rider-booking.spec.ts`
  - Added: destination search -> map preview -> request ride flow

## Verification Commands Run

- `npm test -- src/features/maps/__tests__/geocoding-provider.test.ts`
- `npm test -- src/features/maps/__tests__/routing-provider.test.ts`
- `npm test -- 'src/app/(rider)/book/BookingClient.test.tsx'`
- `npm test -- src/features/ride-tracking/__tests__/driver-en-route-location.test.tsx`
- `npm test -- src/features/ride-tracking/__tests__/in-progress-tracker-location.test.tsx`
- `npm test -- 'src/app/(rider)/book/BookingClient.test.tsx' src/features/maps/__tests__/geocoding-provider.test.ts src/features/maps/__tests__/routing-provider.test.ts src/features/ride-tracking/__tests__/driver-en-route-location.test.tsx src/features/ride-tracking/__tests__/in-progress-tracker-location.test.tsx`
- `npm run test:e2e -- e2e/rider-booking.spec.ts -g "searches destination and previews it on map before request"`
- `npm run test:e2e -- e2e/rider-booking.spec.ts`

## Commits Produced In This Session

- `dade618` test(maps): add stub geocoder test for known Memphis destination
- `0083e8d` test(maps): verify nominatim geocoding response normalization
- `b52daff` test(maps): default geocoder selection to stub mode
- `3e06c49` test(maps): add stub routing provider contract
- `474acc8` test(maps): parse osrm routes for eta and polyline
- `f84f7f8` test(maps): add osrm ETA matrix parsing support
- `da61e46` test(maps): default routing provider to stub mode
- `022205a` feat(maps): wire booking destination search to provider-based map preview
- `6307d4a` test(maps): add e2e destination search to map preview flow
- `b4fc094` feat(tracking): render live driver marker map on en-route card
- `4204906` feat(tracking): show live map marker during in-progress rides
- `5c5bb0a` docs(maps): document provider-based map, geocoding, and routing setup

## Issue Tracking Update

- Posted implementation summary comment on issue #29:
  - https://github.com/ai4sd-s26-memphis/team-citrine/issues/29#issuecomment-4240854990

---
Written by Codex.
