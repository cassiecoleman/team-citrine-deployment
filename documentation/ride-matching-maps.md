# Ride Matching Maps (Issue #29)

## Summary

This feature replaces booking and tracking map placeholders with interactive Leaflet maps, adds provider-based geocoding and routing abstractions, and introduces a deterministic P3-safe default (`stub`) with real-provider support (`nominatim`, `osrm`) behind environment flags.

## What Changed

- Added reusable map UI component:
  - `ultra-web/src/features/maps/components/RideMap.tsx`
  - OpenStreetMap tile layer
  - Pickup/dropoff markers
  - Optional route polyline
  - Optional realtime driver marker
- Added geocoding provider module:
  - `ultra-web/src/features/maps/geocoding-provider.ts`
  - `StubGeocodingProvider` (default for P3)
  - `NominatimGeocodingProvider` (real geocoder path)
  - `createGeocodingProvider()` env-based selector
- Added routing provider module:
  - `ultra-web/src/features/maps/routing-provider.ts`
  - `StubRoutingProvider` (default for P3)
  - `OSRMRoutingProvider` (route + matrix ETA parsing)
  - `createRoutingProvider()` env-based selector
- Updated rider booking flow:
  - `ultra-web/src/app/(rider)/book/BookingClient.tsx`
  - `ultra-web/src/app/(rider)/book/page.tsx`
  - Destination search input
  - Provider-backed route preview + ETA update
  - Hidden form fields persist selected destination into ride request
- Updated ride tracking flows:
  - `ultra-web/src/features/ride-tracking/components/DriverEnRouteCard.tsx`
  - `ultra-web/src/features/ride-tracking/components/InProgressTracker.tsx`
  - Live map marker rendering from realtime driver location hook

## Environment Variables

- `NEXT_PUBLIC_GEO_PROVIDER`:
  - `stub` (default)
  - `nominatim`
- `NEXT_PUBLIC_ROUTING_PROVIDER`:
  - `stub` (default)
  - `osrm`

If not set, both providers default to `stub`.

## Dependencies

Installed in `ultra-web/package.json`:

- `leaflet`
- `react-leaflet`
- `@types/leaflet`

## Test Coverage Added

- Unit tests:
  - `ultra-web/src/features/maps/__tests__/geocoding-provider.test.ts`
  - `ultra-web/src/features/maps/__tests__/routing-provider.test.ts`
  - `ultra-web/src/app/(rider)/book/BookingClient.test.tsx`
  - `ultra-web/src/features/ride-tracking/__tests__/driver-en-route-location.test.tsx`
  - `ultra-web/src/features/ride-tracking/__tests__/in-progress-tracker-location.test.tsx`
- E2E:
  - `ultra-web/e2e/rider-booking.spec.ts`
  - New test: destination search -> map preview -> request ride
