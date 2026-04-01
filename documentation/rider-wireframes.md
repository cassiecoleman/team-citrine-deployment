# Ultra — Rider Wireframes & E2E Test Definitions

All wireframes target the 430px mobile shell. Each screen shows the ASCII layout followed by Playwright e2e test specs to validate the flow.

Routes reference the `(rider)` route group from `p2-route-structure.md`. US05 and US06 already have full storyboard wireframes in `storyboards_jacob_moore/`; this document defines their e2e tests and covers all remaining rider stories.

---

## Core Ride Flow (US11 → US17)

This is the primary rider journey: enter destination, book, wait for match, track driver, ride, complete.

---

### US11 — Enter a Destination and Preview on Map

**Route:** `(rider)/` (home page)

```
┌─────────────────────────────┐
│  Ultra                   [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │       [ MAP AREA ]      │   │
│  │                         │   │
│  │    [pin] You are here   │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [search] Where to?      │   │
│  └─────────────────────────┘   │
│                                 │
│  Saved Places                   │
│  ┌─────────────────────────┐   │
│  │ [home]  Home             │   │
│  │ [bldg]  Office           │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [ticket] Ride Pass       │   │
│  │ Save up to 25%      ->  │   │
│  └─────────────────────────┘   │
│                                 │
│  [home]  [search]  [ticket]  [user] │
└─────────────────────────────┘
```

**Key elements:**
- Map with current location pin
- "Where to?" search input
- Saved places shortcuts (Home, Office)
- Ride Pass discovery banner
- Bottom navigation tabs

**E2E Tests:** `e2e/us11-destination-entry.spec.ts`

```
test: home page loads with map visible
  → navigate to /
  → expect map container to be visible
  → expect "Where to?" input to be visible

test: typing a destination shows search results
  → click "Where to?" input
  → type "Metro General Hospital"
  → expect dropdown with matching results to appear

test: selecting a destination shows it on the map
  → select "Metro General Hospital" from results
  → expect map to show a destination pin
  → expect route line drawn on map

test: tapping a saved place fills the destination
  → click "Office" saved place
  → expect destination field to show office address
  → expect map to update with route

test: ride pass banner navigates to passes page
  → click Ride Pass banner
  → expect URL to be /passes

test: bottom nav tabs navigate correctly
  → click each tab
  → expect URL to change to /, /passes, /profile respectively
```

---

### US12 — Request an Immediate Ride

**Route:** `(rider)/book`

```
┌─────────────────────────────┐
│  [<] Confirm Ride        [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │  [pin]A · · · · [pin]B │   │
│  │       [ MAP + ROUTE ]   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] 742 Elm St (Home) │   │
│  │ [pin] Metro General     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Ride Estimate           │   │
│  │                         │   │
│  │ Distance    3.2 mi      │   │
│  │ Duration    ~12 min     │   │
│  │ Fare        $18.50      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [split] Split Fare      │   │
│  │   Save up to 50%        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [calendar] Schedule     │   │
│  │   Book for later        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │    Request Ride  $18.50 │   │
│  └─────────────────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- Map showing route between pickup and dropoff
- Pickup/dropoff address summary
- Fare estimate card (distance, duration, fare)
- Split Fare shortcut → navigates to `/book/split`
- Schedule shortcut → navigates to `/book/schedule`
- Primary CTA: "Request Ride" with fare amount

**E2E Tests:** `e2e/us12-request-ride.spec.ts`

```
test: booking page shows route summary after destination selected
  → navigate to /book (with pickup/dropoff in state)
  → expect pickup address to be visible
  → expect dropoff address to be visible
  → expect map with route to be visible

test: fare estimate is displayed
  → expect distance, duration, and fare to be visible
  → expect fare to be a dollar amount

test: request ride button submits and navigates to ride tracking
  → click "Request Ride"
  → expect URL to match /ride/[id]
  → expect matching/waiting screen to appear

test: split fare button navigates to split flow
  → click "Split Fare"
  → expect URL to be /book/split

test: schedule button navigates to schedule flow
  → click "Schedule"
  → expect URL to be /book/schedule
```

---

### US13 — Waiting Screen While Driver Is Matched

**Route:** `(rider)/ride/[id]` — MATCHING state

```
┌─────────────────────────────┐
│  Ride Status             [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │       [ MAP AREA ]      │   │
│  │    [pin] Pickup         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    [spinner animation]  │   │
│  │                         │   │
│  │  Finding your driver... │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] 742 Elm St        │   │
│  │    -> Metro General     │   │
│  │ Est. fare: $18.50       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Cancel Request     │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────┘
```

**Key elements:**
- Map with pickup pin
- Animated spinner/pulse indicating search in progress
- "Finding your driver..." status text
- Pickup → dropoff summary with fare (per US13 acceptance notes)
- Cancel button (active during matching phase)

**E2E Tests:** `e2e/us13-matching.spec.ts`

```
test: matching screen shows spinner and status text
  → navigate to /ride/[mock-id] with MATCHING state
  → expect "Finding your driver" text to be visible
  → expect spinner/pulse animation to be present

test: pickup and destination summary visible during matching
  → expect pickup address to be visible
  → expect destination address to be visible
  → expect fare estimate to be visible

test: cancel button is available during matching
  → expect "Cancel Request" button to be visible and enabled
  → click "Cancel Request"
  → expect confirmation dialog or redirect to home

test: screen transitions to en-route when driver accepts
  → wait for mock driver acceptance (state change to EN_ROUTE)
  → expect "Finding your driver" to disappear
  → expect driver info card to appear
```

---

### US14 — Driver En Route After Acceptance

**Route:** `(rider)/ride/[id]` — EN_ROUTE state

```
┌─────────────────────────────┐
│  Ride Status             [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  [car]· · · · · [pin]  │   │
│  │       [ MAP AREA ]      │   │
│  │   Driver en route       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [badge] Driver En Route │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [user] John D.    4.8*  │   │
│  │ Toyota Prius · ABC-1234 │   │
│  │                         │   │
│  │ ETA: 5 min              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] 742 Elm St        │   │
│  │    -> Metro General     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌───────────┬─────────────┐   │
│  │  Contact  │   Safety    │   │
│  │  Driver   │   Share     │   │
│  └───────────┴─────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- Map showing driver position moving toward pickup pin
- "Driver En Route" status badge
- Driver card: name, rating, vehicle make/model, license plate
- ETA countdown
- Route summary
- Action buttons: Contact Driver, Safety Share (links to US04)

**E2E Tests:** `e2e/us14-driver-en-route.spec.ts`

```
test: driver info card appears after match
  → navigate to /ride/[mock-id] with EN_ROUTE state
  → expect driver name to be visible
  → expect driver rating to be visible
  → expect vehicle description to be visible
  → expect license plate to be visible

test: ETA is displayed and counts down
  → expect ETA text (e.g. "5 min") to be visible
  → wait 10 seconds
  → expect ETA value to have decreased

test: map shows driver position
  → expect map container to be visible
  → expect driver marker on map

test: status badge shows "Driver En Route"
  → expect badge with "Driver En Route" text

test: contact driver button is present
  → expect "Contact Driver" button to be visible

test: safety share button is present
  → expect "Safety Share" button to be visible
```

---

### US15 — Driver Has Arrived

**Route:** `(rider)/ride/[id]` — ARRIVED state

```
┌─────────────────────────────┐
│  Ride Status             [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  [car] at [pin]         │   │
│  │       [ MAP AREA ]      │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [badge] Driver Arrived  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Your driver is here!   │   │
│  │                         │   │
│  │ [user] John D.    4.8*  │   │
│  │ Toyota Prius            │   │
│  │ License: ABC-1234       │   │
│  │                         │   │
│  │ Look for a silver Prius │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌───────────┬─────────────┐   │
│  │  Contact  │   Safety    │   │
│  │  Driver   │   Share     │   │
│  └───────────┴─────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- Map with driver and pickup pin co-located
- Prominent "Driver Arrived" badge (per US15 acceptance notes: prominent on-screen status)
- "Your driver is here!" heading
- Driver details repeated for identification (name, vehicle, plate)
- Helpful text: "Look for a silver Prius"
- Same action buttons persist (no page navigation — per US15 acceptance notes)

**E2E Tests:** `e2e/us15-driver-arrived.spec.ts`

```
test: arrived state shows prominent arrival status
  → navigate to /ride/[mock-id] with ARRIVED state
  → expect "Driver Arrived" badge to be visible
  → expect "Your driver is here" text to be visible

test: vehicle details are displayed for identification
  → expect driver name to be visible
  → expect vehicle make/model to be visible
  → expect license plate to be visible
  → expect vehicle description helper text to be visible

test: screen remains on same ride page (no navigation)
  → expect URL to still match /ride/[id]
  → expect same page layout as en-route (no redirect)

test: transitions to in-progress state
  → wait for state change to IN_PROGRESS
  → expect "Driver Arrived" badge to disappear
  → expect "In Progress" or trip-tracking UI to appear
```

---

### US16 — Track My Ride In Progress

**Route:** `(rider)/ride/[id]` — IN_PROGRESS state

```
┌─────────────────────────────┐
│  Ride Status             [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  [car]· · · · · [flag] │   │
│  │       [ MAP AREA ]      │   │
│  │  Route to destination   │   │
│  │                         │   │
│  │                         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [badge] Ride In Progress│   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] -> Metro General  │   │
│  │                         │   │
│  │ ETA: 8 min              │   │
│  │ Distance left: 2.1 mi   │   │
│  │                         │   │
│  │ ██████████░░░░  60%     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   Share Trip            │   │
│  └─────────────────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- Map takes up more vertical space (60/40 split) — rider wants to follow along
- Car marker moving along route toward destination flag
- "Ride In Progress" status badge
- Destination with ETA countdown and remaining distance
- Progress bar showing trip completion percentage
- Share Trip button (ties into US04)

**E2E Tests:** `e2e/us16-in-ride-tracking.spec.ts`

```
test: in-progress state shows ride tracking UI
  → navigate to /ride/[mock-id] with IN_PROGRESS state
  → expect "Ride In Progress" badge to be visible
  → expect map to be visible with larger viewport

test: ETA and distance are displayed
  → expect ETA text to be visible
  → expect remaining distance to be visible

test: progress bar reflects trip completion
  → expect progress bar element to be visible
  → expect progress percentage to be > 0

test: share trip button is visible
  → expect "Share Trip" button to be visible

test: transitions to complete when ride ends
  → wait for state change to COMPLETED
  → expect URL to change to /ride/[id]/complete
```

---

### US17 — Ride Summary, Tip Driver, and Rate Ride

**Route:** `(rider)/ride/[id]/complete`

```
┌─────────────────────────────┐
│  Ride Complete           [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │      [check circle]     │   │
│  │   Ride Complete!        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] Elm St -> Metro   │   │
│  │ 3.2 mi · 14 min        │   │
│  ├─────────────────────────┤   │
│  │ Fare          $18.50    │   │
│  │ Service fee    $1.50    │   │
│  │ ─────────────────────   │   │
│  │ Total         $20.00    │   │
│  │ [card] Visa ··4821      │   │
│  └─────────────────────────┘   │
│                                 │
│  Rate your driver              │
│  ┌─────────────────────────┐   │
│  │ [user] John D.          │   │
│  │                         │   │
│  │  [*] [*] [*] [*] [ ]   │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  Tip                           │
│  ┌──────┬──────┬──────┬────┐   │
│  │  $1  │  $2  │  $5  │ Other│ │
│  └──────┴──────┴──────┴────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [flag] Report an Issue  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Done             │   │
│  └─────────────────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- "Ride Complete!" confirmation header
- Fare breakdown card (fare, service fee, total, payment method)
- Star rating for driver (tappable 1-5 stars)
- Tip selection: preset amounts + custom "Other"
- "Report an Issue" link (ties into US07 — flag driver)
- "Done" CTA → returns to home

**E2E Tests:** `e2e/us17-ride-complete.spec.ts`

```
test: completion screen shows fare breakdown
  → navigate to /ride/[mock-id]/complete
  → expect "Ride Complete" heading to be visible
  → expect fare amount to be visible
  → expect total amount to be visible
  → expect payment method to be visible

test: star rating is interactive
  → expect 5 star elements to be visible
  → click the 4th star
  → expect 4 stars to be filled/highlighted

test: tip buttons are visible and selectable
  → expect $1, $2, $5, Other buttons to be visible
  → click "$2"
  → expect $2 button to be highlighted/selected

test: report an issue navigates or opens modal
  → click "Report an Issue"
  → expect issue reporting UI to appear (modal or inline form)

test: done button returns to home
  → click "Done"
  → expect URL to be /
```

---

## Scheduling (US01, US02)

Both stories share the schedule page. US01 adds a recurring toggle; US02 is a single advance booking.

---

### US01 — Schedule a Recurring Ride / US02 — Book a Ride in Advance

**Route:** `(rider)/book/schedule`

```
┌─────────────────────────────┐
│  [<] Schedule Ride       [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │ [pin] 742 Elm St (Home) │   │
│  │ [pin] Lincoln Elementary│   │
│  └─────────────────────────┘   │
│                                 │
│  Pickup Date                   │
│  ┌─────────────────────────┐   │
│  │ [calendar] Apr 1, 2026  │   │
│  └─────────────────────────┘   │
│                                 │
│  Pickup Time                   │
│  ┌─────────────────────────┐   │
│  │ [clock] 7:30 AM         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Recurring Ride           │   │
│  │                 [toggle] │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌ (shown when toggle ON) ──┐  │
│  │ Repeat on                │  │
│  │ [M] [T] [W] [T] [F] S  S│  │
│  │  *   *   *   *   *       │  │
│  │                          │  │
│  │ Rider Profile            │  │
│  │ [chevron] Emma (age 9)   │  │
│  │                          │  │
│  │ Until                    │  │
│  │ [calendar] Jun 5, 2026   │  │
│  └──────────────────────────┘  │
│                                 │
│  Est. fare: $12.00/ride        │
│                                 │
│  ┌─────────────────────────┐   │
│  │   Confirm Schedule      │   │
│  └─────────────────────────┘   │
└─────────────────────────────┘
```

**Key elements:**
- Pickup and dropoff addresses
- Date picker (up to 7 days ahead per US02)
- Time picker
- Recurring ride toggle (US01)
  - Day-of-week selectors (M-F default for school rides)
  - Rider profile selector (ties into US10 — child profiles)
  - End date for recurrence
- Fare estimate per ride
- "Confirm Schedule" CTA

**E2E Tests:** `e2e/us01-us02-schedule-ride.spec.ts`

```
test: schedule page loads with pickup and dropoff
  → navigate to /book/schedule (with addresses in state)
  → expect pickup address to be visible
  → expect dropoff address to be visible

test: date picker allows selecting up to 7 days ahead
  → click date picker
  → expect dates within next 7 days to be selectable
  → expect dates beyond 7 days to be disabled
  → select a date
  → expect date field to update

test: time picker allows selecting a pickup time
  → click time picker
  → select 7:30 AM
  → expect time field to show "7:30 AM"

test: recurring toggle reveals day selectors
  → expect recurring toggle to be visible and OFF
  → click recurring toggle
  → expect day-of-week buttons (M T W T F S S) to appear

test: selecting recurring days highlights them
  → toggle recurring ON
  → click M, W, F buttons
  → expect M, W, F to be highlighted/selected

test: rider profile selector is visible when recurring is on
  → toggle recurring ON
  → expect rider profile dropdown to be visible
  → click profile selector
  → expect child profile options to appear

test: confirm schedule submits and shows confirmation
  → fill in date, time
  → click "Confirm Schedule"
  → expect confirmation message or redirect to home

test: recurring schedule submit includes selected days
  → toggle recurring ON, select M-W-F, select end date
  → click "Confirm Schedule"
  → expect confirmation showing recurring details
```

---

## Safety (US03, US04, US09)

---

### US03 — Assign a Trusted Driver for Child Rides

**Route:** `(rider)/safety/trusted-drivers`

```
┌─────────────────────────────┐
│  [<] Trusted Drivers     [bell] │
│─────────────────────────────│
│                                 │
│  Drivers approved for your     │
│  children's rides              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [user] Maria S.   4.9*  │   │
│  │ 142 rides · Verified    │   │
│  │ [shield] Background chk │   │
│  │          [Remove]       │   │
│  ├─────────────────────────┤   │
│  │ [user] Carlos R.  4.7*  │   │
│  │ 87 rides · Verified     │   │
│  │ [shield] Background chk │   │
│  │          [Remove]       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [plus] Add Trusted      │   │
│  │        Driver           │   │
│  └─────────────────────────┘   │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  Verification Required         │
│  When a trusted driver is      │
│  assigned to your child's      │
│  ride, they must verify their  │
│  identity via PIN before the   │
│  ride begins.                  │
│                                 │
│  [home]  [search]  [ticket]  [user] │
└─────────────────────────────┘
```

**Key elements:**
- List of currently approved/trusted drivers
- Each driver shows: name, rating, ride count, verification badge
- Remove button per driver
- "Add Trusted Driver" button (search from past drivers)
- Informational text about PIN verification requirement

**E2E Tests:** `e2e/us03-trusted-drivers.spec.ts`

```
test: trusted drivers page loads with driver list
  → navigate to /safety/trusted-drivers
  → expect heading "Trusted Drivers" to be visible
  → expect at least one driver card to be visible

test: each driver shows name, rating, and verification status
  → expect driver name text to be visible
  → expect star rating to be visible
  → expect verification badge to be visible

test: add trusted driver button opens search
  → click "Add Trusted Driver"
  → expect search/selection UI to appear (modal or inline)

test: remove button removes a driver from list
  → count number of driver cards
  → click "Remove" on first driver
  → expect confirmation prompt
  → confirm removal
  → expect driver count to decrease by 1

test: verification info text is displayed
  → expect text about PIN verification to be visible
```

---

### US04 — Share a Live Trip with an Emergency Contact

**Route:** `(rider)/profile/safety`

```
┌─────────────────────────────┐
│  [<] Safety Settings     [bell] │
│─────────────────────────────│
│                                 │
│  Emergency Contacts            │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [user] Rosa M. (Mom)    │   │
│  │ +1 (555) 123-4567       │   │
│  │ Auto-share: [toggle ON] │   │
│  ├─────────────────────────┤   │
│  │ [user] David M. (Uncle) │   │
│  │ +1 (555) 987-6543       │   │
│  │ Auto-share: [toggle OFF]│   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [plus] Add Emergency    │   │
│  │        Contact          │   │
│  └─────────────────────────┘   │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  Live Trip Sharing             │
│  ┌─────────────────────────┐   │
│  │ Auto-share all child    │   │
│  │ rides        [toggle ON]│   │
│  ├─────────────────────────┤   │
│  │ Include live map link   │   │
│  │              [toggle ON]│   │
│  ├─────────────────────────┤   │
│  │ Notify on arrival       │   │
│  │              [toggle ON]│   │
│  └─────────────────────────┘   │
│                                 │
│  [home]  [search]  [ticket]  [user] │
└─────────────────────────────┘
```

**Key elements:**
- Emergency contacts list with phone numbers
- Per-contact auto-share toggle (whether they get the live link)
- Add Emergency Contact button
- Live Trip Sharing settings section:
  - Auto-share all child rides toggle
  - Include live map link toggle
  - Notify on arrival toggle

**E2E Tests:** `e2e/us04-safety-sharing.spec.ts`

```
test: safety settings page loads with contacts
  → navigate to /profile/safety
  → expect "Emergency Contacts" heading to be visible
  → expect at least one contact card

test: each contact shows name, phone, and auto-share toggle
  → expect contact name to be visible
  → expect phone number to be visible
  → expect auto-share toggle to be visible

test: auto-share toggle can be switched
  → find a toggle that is OFF
  → click it
  → expect it to switch to ON

test: add emergency contact button opens form
  → click "Add Emergency Contact"
  → expect name and phone input fields to appear

test: live trip sharing settings are displayed
  → expect "Live Trip Sharing" section to be visible
  → expect auto-share child rides toggle
  → expect live map link toggle
  → expect notify on arrival toggle

test: trip sharing toggles are interactive
  → click "Auto-share all child rides" toggle
  → expect toggle state to change
```

---

### US09 — Receive Ride Status Alerts via SMS

**Route:** `(rider)/profile/notifications`

```
┌─────────────────────────────┐
│  [<] Notifications       [bell] │
│─────────────────────────────│
│                                 │
│  SMS Alerts                    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Phone: +1 (555) 123-456│   │
│  │            [Edit]       │   │
│  └─────────────────────────┘   │
│                                 │
│  Receive SMS when:             │
│  ┌─────────────────────────┐   │
│  │ Ride confirmed          │   │
│  │              [toggle ON]│   │
│  ├─────────────────────────┤   │
│  │ Driver arrives          │   │
│  │              [toggle ON]│   │
│  ├─────────────────────────┤   │
│  │ Trip ends               │   │
│  │              [toggle ON]│   │
│  ├─────────────────────────┤   │
│  │ Trip cancelled          │   │
│  │              [toggle ON]│   │
│  └─────────────────────────┘   │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  In-App Notifications          │
│  ┌─────────────────────────┐   │
│  │ Push notifications      │   │
│  │             [toggle OFF]│   │
│  ├─────────────────────────┤   │
│  │ Ride Pass reminders     │   │
│  │              [toggle ON]│   │
│  └─────────────────────────┘   │
│                                 │
│  [home]  [search]  [ticket]  [user] │
└─────────────────────────────┘
```

**Key elements:**
- Phone number display with edit option
- SMS toggle for each event type: ride confirmed, driver arrives, trip ends, trip cancelled
- Separate in-app notification preferences section

**E2E Tests:** `e2e/us09-sms-notifications.spec.ts`

```
test: notification settings page loads
  → navigate to /profile/notifications
  → expect "SMS Alerts" heading to be visible
  → expect phone number to be displayed

test: all SMS event toggles are displayed
  → expect "Ride confirmed" toggle to be visible
  → expect "Driver arrives" toggle to be visible
  → expect "Trip ends" toggle to be visible
  → expect "Trip cancelled" toggle to be visible

test: SMS toggles are interactive
  → click "Driver arrives" toggle to turn it OFF
  → expect toggle state to change to OFF
  → click again to turn it back ON
  → expect toggle state to change to ON

test: edit phone number opens edit form
  → click "Edit" next to phone number
  → expect phone number input to appear

test: in-app notification settings are displayed
  → expect "In-App Notifications" section to be visible
  → expect "Push notifications" toggle
  → expect "Ride Pass reminders" toggle
```

---

## Pricing — E2E Tests Only (US05, US06)

Wireframes for US05 and US06 already exist in `storyboards_jacob_moore/`. Below are the Playwright test definitions.

---

### US05 — Lock In a Predictable Weekly Rate

**Routes:** `(rider)/passes`, `(rider)/passes/review`, `(rider)/passes/active`

**E2E Tests:** `e2e/us05-ride-pass.spec.ts`

```
test: ride pass banner on home page navigates to passes
  → navigate to /
  → click Ride Pass banner
  → expect URL to be /passes

test: passes page shows route and plan cards
  → navigate to /passes
  → expect route summary (Home -> Office) to be visible
  → expect at least one plan card to be visible
  → expect plan card to show price, ride count, per-ride cost

test: spending comparison chart is displayed
  → expect spending chart section to be visible
  → expect "Avg now" bar to be visible
  → expect "With pass" bar to be visible

test: selecting a plan navigates to review page
  → click "Subscribe" on a plan card
  → expect URL to be /passes/review

test: review page shows plan details and payment method
  → navigate to /passes/review
  → expect route, schedule, price, and cancellation policy to be visible
  → expect payment method (Visa ··4821) to be visible

test: subscribe button processes subscription
  → click "Subscribe $75/wk" button
  → expect redirect to /passes/active or Stripe flow

test: active pass page shows status and savings tracker
  → navigate to /passes/active
  → expect "Active" badge to be visible
  → expect pass details (rides, price, renewal date) to be visible
  → expect savings tracker to be visible

test: book first ride button navigates to booking
  → click "Book First Ride"
  → expect URL to match /book
```

---

### US06 — Split a Fare with Another Rider

**Routes:** `(rider)/book/split`, `(rider)/book/split/confirm`

**E2E Tests:** `e2e/us06-fare-split.spec.ts`

```
test: split fare button on booking page navigates to split flow
  → navigate to /book (with destination set)
  → click "Split Fare"
  → expect URL to be /book/split

test: split page shows contact list
  → navigate to /book/split
  → expect "Invite a Co-Rider" heading to be visible
  → expect at least one contact in list

test: selecting a contact shows fare breakdown
  → click on a contact name
  → expect fare breakdown card to appear
  → expect "Your half" and co-rider half to be displayed
  → expect savings amount to be visible

test: send invite button transitions to confirm page
  → select a contact
  → click "Send Invite"
  → expect URL to be /book/split/confirm

test: confirm page shows both riders and split cost
  → navigate to /book/split/confirm
  → expect both rider names with checkmarks
  → expect per-person cost to be visible
  → expect map with both pickup pins

test: confirm and book submits shared ride
  → click "Confirm & Book"
  → expect redirect to /ride/[id] (matching state)

test: receipt shows split fare details
  → navigate to /receipt (after ride complete)
  → expect total fare and per-person breakdown
  → expect savings highlight to be visible
```

---

## Account (US07, US10)

---

### US07 — Rate and Flag a Driver

This overlaps with US17 (the completion screen). The additional behavior is the "Report an Issue" flow, accessible from the completion screen.

**Route:** `(rider)/ride/[id]/complete` → Report Issue modal/section

```
┌─────────────────────────────┐
│  [<] Report an Issue     [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │ [user] John D.          │   │
│  │ Ride on Mar 31, 7:01 AM │   │
│  └─────────────────────────┘   │
│                                 │
│  What went wrong?              │
│  ┌─────────────────────────┐   │
│  │ ( ) Unsafe driving      │   │
│  │ ( ) Driver was rude     │   │
│  │ ( ) Wrong route taken   │   │
│  │ ( ) Vehicle condition   │   │
│  │ ( ) Safety concern      │   │
│  │     for my child        │   │
│  │ ( ) Other               │   │
│  └─────────────────────────┘   │
│                                 │
│  Details (optional)            │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [text area]           │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   Submit Report         │   │
│  └─────────────────────────┘   │
│                                 │
│  This will be reviewed by      │
│  Ultra's safety team within    │
│  24 hours.                     │
│                                 │
└─────────────────────────────┘
```

**Key elements:**
- Driver name and ride date/time for context
- Radio button list of issue categories (includes child-safety-specific option)
- Optional text area for details
- Submit button
- Info text about review timeline

**E2E Tests:** `e2e/us07-rate-flag-driver.spec.ts`

```
test: report an issue is accessible from completion screen
  → navigate to /ride/[mock-id]/complete
  → click "Report an Issue"
  → expect issue reporting UI to appear

test: issue categories are displayed as selectable options
  → expect "Unsafe driving" option to be visible
  → expect "Safety concern for my child" option to be visible
  → expect "Other" option to be visible

test: selecting a category highlights it
  → click "Unsafe driving"
  → expect "Unsafe driving" to be selected/checked

test: details text area accepts input
  → type "Driver was on phone during ride" in text area
  → expect text area to contain the typed text

test: submit report sends and confirms
  → select a category
  → type details
  → click "Submit Report"
  → expect confirmation message (e.g. "Report submitted")

test: star rating on completion screen is functional
  → navigate to /ride/[mock-id]/complete
  → click 2nd star (low rating)
  → expect 2 stars filled
  → expect "Report an Issue" to remain accessible
```

---

### US10 — Manage Multiple Rider Profiles Under One Account

**Route:** `(rider)/profile`

```
┌─────────────────────────────┐
│  [<] My Profile          [bell] │
│─────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │ [avatar]                │   │
│  │ Maria Johnson           │   │
│  │ maria@email.com         │   │
│  │ +1 (555) 123-4567       │   │
│  │              [Edit]     │   │
│  └─────────────────────────┘   │
│                                 │
│  Rider Profiles                │
│                                 │
│  ┌────────────┬────────────┐   │
│  │ [avatar]   │ [avatar]   │   │
│  │ Emma, 9    │ Lucas, 6   │   │
│  │            │            │   │
│  │ Emergency: │ Emergency: │   │
│  │ Rosa M.    │ Rosa M.    │   │
│  │   [Edit]   │   [Edit]   │   │
│  └────────────┴────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [plus] Add Rider Profile│   │
│  └─────────────────────────┘   │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [shield] Safety Settings│   │
│  ├─────────────────────────┤   │
│  │ [bell] Notifications    │   │
│  ├─────────────────────────┤   │
│  │ [card] Payment Methods  │   │
│  ├─────────────────────────┤   │
│  │ [log-out] Sign Out      │   │
│  └─────────────────────────┘   │
│                                 │
│  [home]  [search]  [ticket]  [user] │
└─────────────────────────────┘
```

**Key elements:**
- Parent account card (name, email, phone, edit)
- Rider profiles grid (child photo, name, age, emergency contact)
- Edit button per child profile
- "Add Rider Profile" button
- Quick links: Safety Settings (→ US04), Notifications (→ US09), Payment, Sign Out

**E2E Tests:** `e2e/us10-rider-profiles.spec.ts`

```
test: profile page shows parent account info
  → navigate to /profile
  → expect parent name to be visible
  → expect email to be visible
  → expect phone number to be visible

test: child rider profiles are displayed
  → expect at least one child profile card
  → expect child name and age to be visible
  → expect emergency contact name on each card

test: add rider profile button opens form
  → click "Add Rider Profile"
  → expect form with name, age, photo upload, emergency contact fields

test: edit child profile opens editable form
  → click "Edit" on a child profile
  → expect form pre-filled with child's info
  → expect name, age, emergency contact to be editable

test: save edited profile updates the card
  → click "Edit" on child profile
  → change emergency contact name
  → click "Save"
  → expect updated contact name on the card

test: quick links navigate correctly
  → click "Safety Settings"
  → expect URL to be /profile/safety
  → go back
  → click "Notifications"
  → expect URL to be /profile/notifications

test: sign out clears session and redirects
  → click "Sign Out"
  → expect redirect to login page or landing page
```

---

## E2E Test File Summary

| File | Stories | Route(s) |
|------|---------|----------|
| `e2e/us11-destination-entry.spec.ts` | US11 | `/` |
| `e2e/us12-request-ride.spec.ts` | US12 | `/book` |
| `e2e/us13-matching.spec.ts` | US13 | `/ride/[id]` (MATCHING) |
| `e2e/us14-driver-en-route.spec.ts` | US14 | `/ride/[id]` (EN_ROUTE) |
| `e2e/us15-driver-arrived.spec.ts` | US15 | `/ride/[id]` (ARRIVED) |
| `e2e/us16-in-ride-tracking.spec.ts` | US16 | `/ride/[id]` (IN_PROGRESS) |
| `e2e/us17-ride-complete.spec.ts` | US17 | `/ride/[id]/complete` |
| `e2e/us01-us02-schedule-ride.spec.ts` | US01, US02 | `/book/schedule` |
| `e2e/us03-trusted-drivers.spec.ts` | US03 | `/safety/trusted-drivers` |
| `e2e/us04-safety-sharing.spec.ts` | US04 | `/profile/safety` |
| `e2e/us09-sms-notifications.spec.ts` | US09 | `/profile/notifications` |
| `e2e/us05-ride-pass.spec.ts` | US05 | `/passes`, `/passes/review`, `/passes/active` |
| `e2e/us06-fare-split.spec.ts` | US06 | `/book/split`, `/book/split/confirm` |
| `e2e/us07-rate-flag-driver.spec.ts` | US07 | `/ride/[id]/complete` (report) |
| `e2e/us10-rider-profiles.spec.ts` | US10 | `/profile` |

---

*Document version: 1.0 | Project: Ultra Ride-Sharing App*
