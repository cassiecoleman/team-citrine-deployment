# Ultra Web — Route Group Structure

## Architecture Decision

Single Next.js app with three route groups: `(rider)`, `(driver)`, `(admin)`. Shared backend via `app/api/`. Matches the modular monolith approach from the architecture document.

---

## App Directory

```
src/app/
  layout.tsx                        # root layout (auth provider, fonts, globals)
  page.tsx                          # landing page / redirect
  globals.css

  api/
    rides/
      route.ts                      # GET (list rides), POST (create ride request)
      [id]/
        route.ts                    # GET (ride detail), PATCH (update ride status)
    drivers/
      route.ts                      # GET (list all drivers)
      [id]/
        route.ts                    # GET (driver detail), PATCH (update driver)
    trips/
      route.ts                      # GET (driver's assigned trips)
      [id]/
        route.ts                    # PATCH (accept/reject, update trip status)
    tracking/
      [rideId]/
        route.ts                    # GET (current location), POST (driver location update)
    payments/
      [rideId]/
        route.ts                    # POST (process payment, tip)

  (rider)/
    layout.tsx                      # rider shell — mobile-first, bottom nav, map context
    page.tsx                        # destination entry + map preview         [US11]
    book/
      page.tsx                      # confirm route & request immediate ride  [US12]
      schedule/
        page.tsx                    # schedule recurring / advance ride       [US01, US02]
      split/
        page.tsx                    # fare split invite                       [US06]
        confirm/
          page.tsx                  # confirm shared ride                     [US06]
    ride/
      [id]/
        page.tsx                    # live ride status screen                 [US13, US14, US15, US16]
                                    #   state-driven UI:
                                    #     MATCHING    → waiting spinner       [US13]
                                    #     EN_ROUTE    → driver on map         [US14]
                                    #     ARRIVED     → driver arrived alert  [US15]
                                    #     IN_PROGRESS → in-ride tracking      [US16]
        complete/
          page.tsx                  # fare summary, tip, rating              [US17]
    passes/
      page.tsx                      # browse weekly ride passes              [US05]
      active/
        page.tsx                    # active pass details                    [US05]
      review/
        page.tsx                    # review pass before purchase            [US05]
    profile/
      page.tsx                      # rider profile, child profiles          [US10]
    receipt/
      page.tsx                      # ride receipt                           [existing]

  (driver)/
    layout.tsx                      # driver shell — shift-oriented, large tap targets
    page.tsx                        # driver home / go online
    queue/
      page.tsx                      # trip assignment card (accept/reject)   [US18]
                                    #   shows: offered fare, est. time, mileage
    trip/
      [id]/
        page.tsx                    # map navigation to passenger            [US19]
        pickup/
          page.tsx                  # confirm passenger entered vehicle      [US20]
                                    #   shows: passenger name, confirm button

  (admin)/
    layout.tsx                      # admin shell — sidebar nav, desktop-first
    page.tsx                        # dashboard overview / redirect
    drivers/
      page.tsx                      # all drivers table                      [US21]
    requests/
      page.tsx                      # active unfilled ride requests table    [US22]
    rides/
      page.tsx                      # active in-progress rides table         [US23]
    completed/
      page.tsx                      # completed rides history table          [US24]
                                    # [US25] filter + search built into each table page
```

---

## Features Directory

```
src/features/
  ride-booking/                     # US11, US12 — destination entry, ride request
    actions.ts
    components/
    __tests__/
  ride-tracking/                    # US13, US14, US15, US16 — ride lifecycle screens
    actions.ts
    components/
    __tests__/
  ride-completion/                  # US17 — fare summary, tip, rating
    actions.ts
    components/
    __tests__/
  driver-trips/                     # US18, US19, US20 — queue, navigation, pickup
    actions.ts
    components/
    __tests__/
  admin-dashboard/                  # US21–US25 — tables, filters, search
    actions.ts
    components/
    __tests__/
  fare-split/                       # existing — US06
  ride-pass/                        # existing — US05
  navigation/                       # existing
```

---

## User Story → Route Mapping

| Story | Title | Route | Feature Module |
|-------|-------|-------|----------------|
| US01 | Schedule Recurring Ride | `(rider)/book/schedule` | ride-booking |
| US02 | Book Ride in Advance | `(rider)/book/schedule` | ride-booking |
| US05 | Weekly Ride Pass | `(rider)/passes` | ride-pass |
| US06 | Split Fare | `(rider)/book/split` | fare-split |
| US10 | Manage Rider Profiles | `(rider)/profile` | — |
| US11 | Enter Destination + Map | `(rider)/` (home) | ride-booking |
| US12 | Request Immediate Ride | `(rider)/book` | ride-booking |
| US13 | Waiting for Driver Match | `(rider)/ride/[id]` | ride-tracking |
| US14 | Driver En Route | `(rider)/ride/[id]` | ride-tracking |
| US15 | Driver Arrived | `(rider)/ride/[id]` | ride-tracking |
| US16 | In-Ride Tracking | `(rider)/ride/[id]` | ride-tracking |
| US17 | Ride Complete + Tip + Rate | `(rider)/ride/[id]/complete` | ride-completion |
| US18 | Accept/Reject Trip | `(driver)/queue` | driver-trips |
| US19 | Navigate to Passenger | `(driver)/trip/[id]` | driver-trips |
| US20 | Confirm Passenger Pickup | `(driver)/trip/[id]/pickup` | driver-trips |
| US21 | All Drivers Table | `(admin)/drivers` | admin-dashboard |
| US22 | Unfilled Requests Table | `(admin)/requests` | admin-dashboard |
| US23 | Active Rides Table | `(admin)/rides` | admin-dashboard |
| US24 | Completed Rides Table | `(admin)/completed` | admin-dashboard |
| US25 | Filter & Search Tables | all `(admin)/*` pages | admin-dashboard |

---

## Key Design Decisions

1. **Ride status is one page, not four.** US13–US16 all render at `(rider)/ride/[id]`. The component reads ride state and renders the appropriate UI (waiting → en route → arrived → in progress). No navigation between states — the screen updates reactively.

2. **US25 (filter/search) is not a separate route.** Search and filter controls are built into each admin table page.

3. **Existing routes move into `(rider)/`.** Current `book/`, `passes/`, `profile/`, `receipt/` routes become `(rider)/book/`, `(rider)/passes/`, etc. URLs stay the same (route groups don't create URL segments).

4. **API routes are role-agnostic.** All three portals hit the same `api/` endpoints. Authorization is handled by middleware checking the user's role against the requested resource.

---

*Document version: 1.0 | Project: Ultra Ride-Sharing App*
