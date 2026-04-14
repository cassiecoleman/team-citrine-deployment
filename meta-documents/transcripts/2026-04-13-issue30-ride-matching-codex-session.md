# Codex Transcript — Issue #30 Ride Matching Engine

Date: 2026-04-13
Branch: `feature/ride-realtime`
Issue: `#30` — Ride matching engine — assign nearest available driver

## Session goals

- Review issue `#30` requirements and current `ride-realtime` implementation surface
- Propose three implementation plans and select one
- Implement the selected Plan 2 approach:
  - create rides in `matching`
  - add dedicated `matchDriver(rideId)` logic
  - support nearest-driver selection
  - support trusted-driver preference
  - support child-safe filtering
  - cancel stale unmatched rides after 30 seconds
  - trigger matching from rider status polling
  - expose real matched-driver details on rider tracking screens
  - add/update documentation
  - add e2e coverage for request -> matched driver flow

## High-level transcript

### 1. Planning and branch correction

User asked for three plans to implement issue `#30` and to choose one.

Codex:
- fetched issue `#30`
- inspected `ultra-web/CLAUDE.md`
- reviewed ride scheduling, ride tracking, and schema files
- proposed three plans
- recommended Plan 1 or Plan 2

User selected Plan 2.

Codex then checked the current branch and noticed the workspace was on `feature/ride-matching-maps` instead of `feature/ride-realtime`. After confirming with the user, Codex switched to `feature/ride-realtime`.

### 2. TDD cycle: immediate rides should start in matching

Red:
- updated `ultra-web/src/features/ride-scheduling/__tests__/ride-actions.test.ts`
- changed expectation from `requested` to `matching`
- ran:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-actions.test.ts
```

Observed failure:
- `createRide()` still inserted `status: "requested"`

Green:
- updated `ultra-web/src/features/ride-scheduling/actions.ts`
- changed immediate ride creation to `status: "matching"`

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-actions.test.ts
```

Commit:
- `2198c75` `test(rides): start immediate ride requests in matching state`

### 3. TDD cycle: add nearest-driver matching

Red:
- added `ultra-web/src/features/ride-scheduling/__tests__/ride-matching.test.ts`
- first test required `matchDriver("ride-1")` to assign the nearest available driver
- ran:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Observed failure:
- `matchDriver` was not defined

Green:
- added `matchDriver()` to `ultra-web/src/features/ride-scheduling/actions.ts`
- added inline Haversine distance calculation
- loaded ride, available drivers, and driver locations
- ranked candidates by distance
- updated `rides.driver_id`, `rides.status`, `rides.matched_at`
- inserted `ride_status_history`

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Commit:
- `7dbd75d` `test(rides): assign the nearest available driver during matching`

### 4. TDD cycle: trusted-driver preference

Red:
- added a matcher test proving a trusted driver should win over a closer untrusted driver
- ran:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Observed failure:
- matcher still chose the physically closest driver

Green:
- updated `matchDriver()` to read `trusted_drivers`
- ranked trusted eligible drivers before untrusted drivers
- kept Haversine distance as the tiebreaker within each partition

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Commit:
- `2f9a38d` `test(rides): prefer trusted drivers during ride matching`

### 5. TDD cycle: timeout cancellation

Red:
- added a matcher test for timeout-based cancellation using `timeoutMs: 0`
- ran:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Observed failure:
- matcher returned `"No drivers are currently available."` instead of cancelling the ride

Green:
- updated `matchDriver()` to cancel the ride after timeout
- wrote `rides.status = "cancelled"`
- set `cancel_reason` and `cancelled_at`
- inserted timeout audit row into `ride_status_history`

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Commit:
- `63aef10` `test(rides): cancel unmatched rides after matching timeout`

### 6. TDD cycle: trigger matching from rider status polling

Red:
- updated `ultra-web/src/app/api/rides/[id]/status/route.test.ts`
- added a test expecting the route to call `matchDriver()` when a ride remained in `matching`
- ran:

```bash
npm test -- 'src/app/api/rides/[id]/status/route.test.ts'
```

Observed failure:
- route returned current status but never called `matchDriver`

Green:
- updated `ultra-web/src/app/api/rides/[id]/status/route.ts`
- when `getRideStatus(id)` returned `matching`, route now calls `matchDriver(id)`
- if matching succeeds, returns upgraded status immediately
- added defensive fallback for non-success matcher results

Verified:

```bash
npm test -- 'src/app/api/rides/[id]/status/route.test.ts'
```

Commit:
- `efcce56` `test(rides): trigger matching from ride status polling`

### 7. TDD cycle: stale default timeout after 30 seconds

Red:
- added a matcher test for a stale ride with `requested_at` older than 30 seconds
- ran:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Observed failure:
- default matcher path still returned `"No drivers are currently available."`

Green:
- added timeout-age computation based on `requested_at`
- refactored timeout cancellation into a shared helper
- fixed early return path when available-driver query returned an empty list

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Commit:
- `335de8c` `test(rides): expire stale matching rides after 30 seconds`

### 8. TDD cycle: real driver details on rider tracking screens

Red:
- strengthened `ultra-web/src/features/ride-tracking/__tests__/ride-tracking-actions.test.ts`
- required joined `drivers(...)` data to override fallback mock details
- ran:

```bash
npm test -- src/features/ride-tracking/__tests__/ride-tracking-actions.test.ts
```

Observed failure:
- rider screen still showed fallback driver `"Marcus W."`

Green:
- updated `ultra-web/src/features/ride-tracking/actions.ts`
- selected joined `drivers(id,name,rating,vehicle_make,vehicle_model,license_plate)`
- mapped DB values into rider-facing `ride.driver`

Verified:

```bash
npm test -- src/features/ride-tracking/__tests__/ride-tracking-actions.test.ts
```

Commit:
- `2682def` `test(tracking): show matched driver details from the database`

### 9. TDD cycle: explicit child-safe matching rule

Red:
- added matcher test proving child-safe rides must assign a child-safe driver

Green:
- existing filter logic already satisfied the case once explicitly tested

Verified:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
```

Commit:
- `db7714b` `test(rides): cover child-safe driver matching rules`

### 10. Documentation update

- updated `documentation/backend-modules/03-matching-dispatch.md`
- documented current issue `#30` implementation
- noted verification scope and Playwright environment limitation at the time

Commit:
- `f0fadbd` `docs(rides): document realtime matching dispatch flow`

### 11. Playwright/browser follow-up and demo ride auth fix

Codex added a booking e2e test for:
- request ride
- land on active ride route
- reach matched driver view
- show driver details

Playwright could not be executed from the Codex environment because Chromium launch was blocked by the local sandbox. The user ran the Playwright suite locally and reported two failures:

1. `e2e/rider-booking.spec.ts`
2. `e2e/rider-driver-connected-flow.spec.ts`

Codex diagnosed the connected-flow failure as a real route-level regression:
- the status polling API required auth
- the `new-ride` demo flow used by the connected rider/driver test expected unauthenticated polling against the demo ride state

Red:
- added a route test proving unauthenticated `new-ride` polling should still return status
- ran:

```bash
npm test -- 'src/app/api/rides/[id]/status/route.test.ts'
```

Observed failure:
- route still returned `401`

Green:
- updated `ultra-web/src/app/api/rides/[id]/status/route.ts`
- allowed `id === "new-ride"` to bypass auth for demo-state polling only

Verified:

```bash
npm test -- 'src/app/api/rides/[id]/status/route.test.ts'
```

Commit:
- `d1f989f` `fix(tracking): allow demo ride polling without auth`

Codex also softened the booking e2e to assert the important acceptance result:
- rider reaches `Driver En Route`
- rider sees driver details

Instead of requiring the transient `Finding your driver` text to still be present at assertion time.

The user reran:

```bash
npx playwright test e2e/rider-booking.spec.ts e2e/rider-driver-connected-flow.spec.ts
```

and confirmed both tests passed.

Commit:
- `714cada` `test(rides): cover request to matched driver booking flow`

## Files touched

- `ultra-web/src/features/ride-scheduling/actions.ts`
- `ultra-web/src/features/ride-scheduling/__tests__/ride-actions.test.ts`
- `ultra-web/src/features/ride-scheduling/__tests__/ride-matching.test.ts`
- `ultra-web/src/app/api/rides/[id]/status/route.ts`
- `ultra-web/src/app/api/rides/[id]/status/route.test.ts`
- `ultra-web/src/features/ride-tracking/actions.ts`
- `ultra-web/src/features/ride-tracking/__tests__/ride-tracking-actions.test.ts`
- `ultra-web/e2e/rider-booking.spec.ts`
- `documentation/backend-modules/03-matching-dispatch.md`

## Final verification referenced in session

Codex directly ran and saw passing results for:

```bash
npm test -- src/features/ride-scheduling/__tests__/ride-actions.test.ts
npm test -- src/features/ride-scheduling/__tests__/ride-matching.test.ts
npm test -- 'src/app/api/rides/[id]/status/route.test.ts'
npm test -- src/features/ride-tracking/__tests__/ride-tracking-actions.test.ts
```

User locally ran and confirmed passing results for:

```bash
npx playwright test e2e/rider-booking.spec.ts e2e/rider-driver-connected-flow.spec.ts
```

## Sign-off

Transcript prepared by Codex.
