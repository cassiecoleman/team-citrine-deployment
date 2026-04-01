# Driver Wireframes — Ultra Ride-Sharing App

**Team Citrine** | Spring 2026

---

## Scope

This document captures the driver-facing wireframes implemented in this branch for the following user stories:

- **US18** — Review and accept or reject a trip assignment
- **US19** — Navigate to passenger after accepting a ride
- **US20** — Confirm passenger pickup

These screens are implemented in the app under the `(driver)` route group:

- `/driver`
- `/queue`
- `/trip/[id]`
- `/trip/[id]/pickup`

---

## Screen 1: Driver Home / Shift Dashboard

**Route:** `/driver`

**Purpose:** Give the driver a quick shift summary and direct access to the queue or the current trip.

**Key interface elements**

- Driver name and shift window
- Online status badge
- Trips today and earnings summary
- Acceptance and completion metrics
- Primary actions for reviewing queue or opening the active trip

```text
┌───────────────────────────┐
│ Driver Home          bell │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ DRIVER SHIFT          │ │
│ │ Marcus W.      ONLINE │ │
│ │ 7:00 AM - 3:00 PM     │ │
│ │                       │ │
│ │ Trips today   Earnings│ │
│ │     8         $142.50 │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────┐ ┌─────────┐ │
│ │Acceptance │ │Complete │ │
│ │   96%     │ │   99%   │ │
│ └───────────┘ └─────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Ready for your next   │ │
│ │ pickup                │ │
│ │                       │ │
│ │ [ Review Queue ]      │ │
│ │ [ Open Active Trip ]  │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

---

## Screen 2: Trip Assignment Queue

**Route:** `/queue`

**Purpose:** Present a driver with the offered fare, trip time, mileage, route summary, and a clear accept/reject choice.

**Key interface elements**

- Incoming assignment header
- Rider name and pickup urgency
- Offered fare
- Estimated trip time
- Mileage
- Pickup and dropoff route summary
- Reject and accept actions

```text
┌───────────────────────────┐
│ Trip Queue           bell │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ INCOMING ASSIGNMENT   │ │
│ │ Aisha R.      5 min   │ │
│ │ Blue awning pickup    │ │
│ │                       │ │
│ │ Fare    Time   Miles  │ │
│ │ $24.75  26m    7.4    │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ ROUTE                 │ │
│ │ Pickup                │ │
│ │ Community Clinic      │ │
│ │ 1150 West End Ave     │ │
│ │                       │ │
│ │ Dropoff               │ │
│ │ Metro General Hosp.   │ │
│ │ 245 River Pkwy        │ │
│ └───────────────────────┘ │
│                           │
│ [ Reject ] [ Accept Trip ]│
└───────────────────────────┘
```

---

## Screen 3: Navigation to Passenger

**Route:** `/trip/[id]`

**Purpose:** Help the driver navigate to the pickup point and keep the rider, route, and readiness details visible in one screen.

**Key interface elements**

- En route status header
- Pickup ETA and offered fare
- Turn-by-turn map preview placeholder
- Rider name and rating
- Pickup and dropoff cards
- Arrival-readiness checklist
- "Arrived at Pickup" CTA

```text
┌───────────────────────────┐
│ Navigate to Rider    bell │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ EN ROUTE TO RIDER     │ │
│ │ 2 turns away          │ │
│ │ 5 min to Aisha R.     │ │
│ │                $24.75 │ │
│ │                       │ │
│ │    [ MAP PREVIEW ]    │ │
│ │ Community → Hospital  │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Aisha R.              │ │
│ │ Rider rating 4.8      │ │
│ │ Pickup pin ready      │ │
│ │                       │ │
│ │ Pickup: Community Cl. │ │
│ │ Dropoff: Metro Gen.   │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ BEFORE ARRIVAL        │ │
│ │ ✓ Hazards ready       │ │
│ │ ✓ Back seat clear     │ │
│ │ ✓ App PIN ready       │ │
│ └───────────────────────┘ │
│                           │
│ [ Arrived at Pickup ]     │
└───────────────────────────┘
```

---

## Screen 4: Pickup Confirmation

**Route:** `/trip/[id]/pickup`

**Purpose:** Confirm that the correct passenger entered the vehicle before the trip begins.

**Key interface elements**

- At-pickup status banner
- Passenger name card
- Pickup and destination summary
- Identity-check instructions
- Back to map action
- Confirm pickup action

```text
┌───────────────────────────┐
│ Passenger Pickup     bell │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ AT PICKUP PIN         │ │
│ │ Confirm passenger     │ │
│ │ before start          │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │        ( user )       │ │
│ │ Passenger name        │ │
│ │ Aisha R.              │ │
│ │ Pickup: Community Cl. │ │
│ │ Dest: Metro General   │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Identity check steps  │ │
│ │ 1. Confirm rider name │ │
│ │ 2. Match pickup pin   │ │
│ │ 3. Start after check  │ │
│ └───────────────────────┘ │
│                           │
│ [ Back to Map ] [ Confirm│ │
│                 Pickup ] │
└───────────────────────────┘
```

---

## Implementation Reference

These wireframes correspond to the driver UI implemented in:

- `ultra-web/src/app/(driver)/driver/page.tsx`
- `ultra-web/src/app/(driver)/queue/page.tsx`
- `ultra-web/src/app/(driver)/trip/[id]/page.tsx`
- `ultra-web/src/app/(driver)/trip/[id]/pickup/page.tsx`

And the supporting feature components in:

- `ultra-web/src/features/driver-trips/components/DriverShiftBoard.tsx`
- `ultra-web/src/features/driver-trips/components/TripAssignmentCard.tsx`
- `ultra-web/src/features/driver-trips/components/TripNavigationView.tsx`
- `ultra-web/src/features/driver-trips/components/PickupConfirmationCard.tsx`
