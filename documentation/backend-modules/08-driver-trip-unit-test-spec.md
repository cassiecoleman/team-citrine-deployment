# Driver Trip Unit Test Specification

## Summary

This specification covers direct backend unit tests for the driver trip operations in `ultra-web/src/features/driver-trips/actions.ts`.

Relevant product context:

- US18 — Review and accept or reject a trip assignment
- US19 — Navigate to passenger after accepting a ride
- US20 — Confirm passenger pickup
- Ride lifecycle rules in `documentation/backend-modules/02-ride-lifecycle.md`
- Realtime location expectations in `documentation/backend-modules/04-realtime-location.md`
- Current API wiring in `documentation/backend-modules/07-ride-core-apis-p3.md`

These tests must stay isolated to the backend unit boundary and use mocks for Supabase and related external interfaces.

## acceptTrip

Purpose: validate trip-acceptance input, enforce driver ownership and active-trip guards, move a ride from `matching` to `driver_en_route`, and record audit history.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | empty `rideId` or `driverUserId` | `{ success: false, error: "Invalid trip acceptance request." }` |
| Reject missing driver account | valid ids, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject driver with active trip | valid ids, busy ride exists in `driver_en_route/arrived/in_progress` | `{ success: false, error: "You already have an active trip..." }` |
| Reject missing target ride | valid ids, ride lookup returns null/error | `{ success: false, error: "Unable to find the trip to accept." }` |
| Reject non-matching ride | current ride status not `matching` | `{ success: false, error: "Trip is not available to accept." }` |
| Reject conditional update failure | ride update returns error | `{ success: false, error: "Unable to accept this trip right now." }` |
| Reject race-lost update | ride update returns no row | `{ success: false, error: "Trip was already taken." }` |
| Reject history write failure | update succeeds, history insert returns error | `{ success: false, error: "Unable to record trip status history." }` |
| Accept matching ride | valid matching ride, update and history succeed | success payload with `driver_en_route`, assigned `driverId`, and correct `ride_status_history` row |

## rejectTrip

Purpose: validate rejection input, ensure the ride belongs to the driver, return the ride to `matching`, and record the rejection reason in audit history.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | empty `rideId` or `driverUserId` | `{ success: false, error: "Invalid trip rejection request." }` |
| Reject missing driver account | valid ids, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject missing ride | valid ids, ride lookup returns null/error | `{ success: false, error: "Unable to find the trip to reject." }` |
| Reject wrong driver | ride belongs to a different driver or no driver | `{ success: false, error: "Trip is not assigned to this driver." }` |
| Reject invalid ride status | ride status is not `matching` or `driver_en_route` | `{ success: false, error: "Trip cannot be rejected from its current status." }` |
| Reject update failure | ride update returns null/error | `{ success: false, error: "Unable to reject this trip right now." }` |
| Reject history write failure | ride update succeeds, history insert fails | `{ success: false, error: "Unable to record trip status history." }` |
| Use default rejection reason | `reason` omitted | success payload plus `change_reason: "Trip rejected by driver"` in history |
| Reject assigned ride successfully | assigned ride in valid status | success payload with status `matching` and cleared `driver_id` |

## arriveAtPickup

Purpose: mark an assigned `driver_en_route` ride as `arrived`, persist arrival time, and emit an audit history record.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject missing driver account | valid ids, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject update failure | ride update returns null/error | `{ success: false, error: "Unable to mark arrival — ride may not be en route." }` |
| Record arrival history on success | assigned ride updates to `arrived` | success payload and history insert with `from_status: "driver_en_route"` |
| Ignore history insert failure | ride update succeeds, history insert returns error | success payload still returned under current implementation |

## confirmPickup

Purpose: validate pickup confirmation input, ensure the ride belongs to the driver, move the ride to `in_progress`, and record the transition in history.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | empty `rideId` or `driverUserId` | `{ success: false, error: "Invalid pickup confirmation request." }` |
| Reject missing driver account | valid ids, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject missing ride | valid ids, ride lookup returns null/error | `{ success: false, error: "Unable to find the trip to confirm pickup." }` |
| Reject wrong driver | ride belongs to another driver or no driver | `{ success: false, error: "Trip is not assigned to this driver." }` |
| Reject invalid status | ride status not `driver_en_route` or `arrived` | `{ success: false, error: "Trip must be en route or arrived." }` |
| Reject update failure | update returns null/error | `{ success: false, error: "Unable to confirm pickup right now." }` |
| Reject history write failure | update succeeds, history insert fails | `{ success: false, error: "Unable to record trip status history." }` |
| Confirm pickup from en route | current status `driver_en_route` | success payload with `in_progress` and history row |
| Confirm pickup from arrived | current status `arrived` | success payload with `in_progress` and `from_status: "arrived"` |

## completeTrip

Purpose: validate completion input, ensure the ride belongs to the driver and is in progress, mark it completed with the final fare, record history, and restore driver availability.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | empty ids or negative fare | `{ success: false, error: "Invalid trip completion request." }` |
| Reject missing driver account | valid ids, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject missing ride | valid ids, ride lookup returns null/error | `{ success: false, error: "Unable to find the trip to complete." }` |
| Reject wrong driver | ride belongs to another driver or no driver | `{ success: false, error: "Trip is not assigned to this driver." }` |
| Reject invalid status | ride status not `in_progress` | `{ success: false, error: "Trip is not in progress." }` |
| Reject update failure | ride update returns null/error | `{ success: false, error: "Unable to complete this trip right now." }` |
| Reject history write failure | ride update succeeds, history insert fails | `{ success: false, error: "Unable to record trip status history." }` |
| Return fallback fare | ride update returns `fare_final: null` | success payload uses input `fareFinal` |
| Complete trip successfully | ride update and history succeed | success payload with `completed`, stored fare, and driver status update to `available` |

## toggleDriverAvailability

Purpose: validate availability requests, resolve the driver account, and change driver availability between `available` and `offline`.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | empty `driverUserId` or unsupported `nextStatus` | `{ success: false, error: "Invalid availability request." }` |
| Reject missing driver account | valid input, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Set driver offline | valid input, update invoked | success payload with status `offline` |
| Set driver available | valid input, update invoked | success payload with status `available` |
| Preserve current unchecked update behavior | driver update call does not report result | success payload still returned under current implementation |

## updateDriverLocation

Purpose: validate realtime location payloads, resolve the driver, throttle updates faster than three seconds, upsert location rows, and return the persisted location model.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject invalid payload | invalid lat/lng, heading, or datetime | `{ success: false, error: "Invalid driver location payload." }` |
| Reject missing driver account | valid input, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Throttle fast update | latest location within 3 seconds | success payload with `throttled: true` and no upsert |
| Continue after latest-location lookup error | latest lookup errors but driver exists | function proceeds to upsert under current implementation |
| Reject upsert failure | upsert returns null/error | `{ success: false, error: "Unable to update driver location." }` |
| Default timestamp and null heading | no `recordedAt` and no `heading` provided | success payload uses generated ISO timestamp and `heading: null` |
| Persist fresh update | valid payload with stale or missing previous location | success payload with `throttled: false` and returned DB fields |

## getAssignedTrips

Purpose: load matching rides visible to the driver queue and map each row into a `TripAssignment`.

| Test purpose | Inputs | Expected result |
| --- | --- | --- |
| Reject missing driver id | empty `driverUserId` | `{ success: false, error: "Driver user id is required." }` |
| Reject missing driver account | valid id, driver lookup returns null/error | `{ success: false, error: "Driver account was not found." }` |
| Reject rides query failure | matching-rides query returns null/error | `{ success: false, error: "Unable to load assigned trips right now." }` |
| Return empty queue | driver exists, matching-rides query returns empty array | success payload with empty list |
| Map rider name from object join | `riders: { name }` | mapped `riderName` uses joined name |
| Map rider name from array join | `riders: [{ name }]` | mapped `riderName` uses first joined name |
| Fall back when rider join missing | `riders: null` or empty array | mapped `riderName` is `"Rider"` |
