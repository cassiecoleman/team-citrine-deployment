# Ultra — Admin Wireframes & E2E Test Definitions

This document mirrors `rider-wireframes.md` style for admin operations supporting US21–US25.
All wireframes target the desktop-first admin shell and the `(admin)` route group from `p2-route-structure.md`.

---

## Admin Dashboard Flow (US21 → US25)

Admin wireframes include:
- `/drivers` (US21)
- `/requests` (US22)
- `/rides` (US23)
- `/completed` (US24 + US25)

Each page includes sidebar nav and table filters/search.

---

### Admin shell

**Route:** `(admin)/layout` (applies to all admin routes)

```
┌──────────────────────────────────────────────────────────────────┐
│ Ultra Admin                | Dashboard | Drivers | Requests | ...  │
├──────────────────────────────────────────────────────────────────┤
│ Sidebar (navigation)      │ Content area: [child route content] │
│ - Drivers                 │                                    │
│ - Active Requests         │                                    │
│ - Active Rides            │                                    │
│ - Completed Rides         │                                    │
│                           │                                    │
└──────────────────────────────────────────────────────────────────┘
```

Key elements:
- Persistent left sidebar nav
- Top-level content pane
- Role hint (admin) and quick action links

E2E tests: `e2e/admin/layout.spec.ts`

```
test: admin layout shows links and renders child pages
  → visit /drivers
  → expect sidebar links to contain Drivers, Requests, Rides, Completed
  → expect driver table content to be visible
  → click "Active Requests" and verify /requests content appears
```

---

### US21 — All Drivers table

**Route:** `(admin)/drivers`

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard > Drivers                                   │
├─────────────────────────────────────────────────────────────┤
│ [Search ▭] [Status ▾ All] [Export]                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Driver ID | Name        | Status  | Rating | Last Active   │
│ D-001     | Maria Lopez | Active  | 4.9    | 5m ago        │
│ D-002     | Jonah Reid  | Offline | 4.7    | 42m ago       │
│ D-003     | Preeti S.   | Active  | 4.8    | 2m ago        │
└─────────────────────────────────────────────────────────────┘
```

Key elements:
- Search by driver ID/name
- Status filter (All/Active/Offline)
- Table with driver metadata

E2E tests: `e2e/admin/us21-drivers.spec.ts`

```
test: driver table supports search and filter
  → visit /drivers
  → expect row D-001 to be visible
  → type "Preeti" in search, expect only Preeti row
  → select "Offline", expect no offline rows or D-002 shown
```

---

### US22 — Active unfilled ride requests

**Route:** `(admin)/requests`

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard > Active Requests                            │
├─────────────────────────────────────────────────────────────┤
│ [Search ▭] [Zone ▾ All] [Refresh]                            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Request ID | Pickup         | Dropoff       | Requested | Zone│
│ R-4401     | 1401 Taylor    | Ward High     | 08:03     | West│
│ R-4410     | 2000 Lake Ave  | Downtown Plz  | 08:08     | Ctr│
└─────────────────────────────────────────────────────────────┘
```

Key elements:
- Search by request ID/pickup/dropoff
- Zone filter (All/West/Central/East)
- Table showing unfilled requests

E2E tests: `e2e/admin/us22-requests.spec.ts`

```
test: active requests table search and zone filter
  → visit /requests
  → search for "Ward" and expect R-4401 shown
  → filter zone to "West" and expect only West rows
```

---

### US23 — Active in-progress rides

**Route:** `(admin)/rides`

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard > Active Rides                               │
├─────────────────────────────────────────────────────────────┤
│ [Search ▭] [Status ▾ All] [Refresh]                           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Ride ID | Rider      | Driver      | Status     | ETA      │
│ T-9201  | June Park  | Maria L.    | En Route   | 7m       │
│ T-9205  | Carlos V.  | Preeti S.   | In Progress| 12m      │
└─────────────────────────────────────────────────────────────┘
```

Key elements:
- Search by ride ID/rider/driver
- Status filter (All/En Route/In Progress/Assigned)
- Real-time status overview

E2E tests: `e2e/admin/us23-rides.spec.ts`

```
test: active rides table search and status filter
  → visit /rides
  → type "Carlos" and expect one row
  → select "En Route" and expect only en-route rows
```

---

### US24 & US25 — Completed rides with search/filter

**Route:** `(admin)/completed`

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard > Completed Rides                            │
├─────────────────────────────────────────────────────────────┤
│ [Search ▭] [Date ▾ Today] [Export]                           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Ride ID | Rider      | Driver     | Fare   | Completed At  │
│ C-7801  | Maya B.    | Jonah R.   | $13.30 | 09:30         │
│ C-7802  | Derek Y.   | Maria L.   | $18.75 | 09:34         │
└─────────────────────────────────────────────────────────────┘
```

Key elements:
- Search by ride ID/rider/driver
- Date filter (Today/Yesterday/Last 7 Days)
- Completed trips history

E2E tests: `e2e/admin/us24-completed.spec.ts`

```
test: completed rides table search and date filter
  → visit /completed
  → type "Derek" and expect C-7802 shown
  → select "Yesterday" and verify entries update
```

---

## Notes

- This file is the admin counterpart to `rider-wireframes.md`.
- It is intentionally kept in classic wireframe + test spec format for engineering handoff.
