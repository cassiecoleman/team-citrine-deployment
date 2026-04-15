# Ultra Demo Script — Team Citrine

## Setup Before Demo

**Three browsers open:**
- **Chrome** — Rider (Jacob): `djacobmoore@icloud.com`
- **Safari** — Driver (Cassie): `driver1@ultra-app.test` / `UltraDriver2026!`
- **Chrome Incognito** — Admin (Derron): `admin1@ultra-app.test` / `UltraAdmin2026!`

Make sure `npm run dev` is running in `ultra-web/`.

---

## Part 1: Jacob — Rider Backend (3 min)

**Jacob talks while demoing on Chrome.**

> "I'm going to walk through the rider experience. Everything you're about to see hits a real Supabase PostgreSQL database — no mock data."

### 1. Registration & Login
- Go to `/register` (show the page briefly)
> "We built email/password auth with Supabase Auth. When a rider registers, we create their auth account, assign the rider role, and provision a riders row in one transaction — so every downstream feature has a profile to work with."
- Go to `/login`, sign in
> "The middleware checks your session cookie on every request and redirects you to the right dashboard based on your role — riders land here, drivers go to /driver, admins to /admin."

### 2. Profile Management
- Go to `/profile`
> "This is real data — that's my name and email pulled from the riders table and auth session. I can edit my name and phone inline."
- Click **Edit**, change phone to something, click **Save**
> "That just updated the riders table in Supabase via a server action."
- Click **Add Rider Profile**, add a child named "Emma", emergency contact "Rosa M."
> "This creates a rider_profiles row with is_child=true. Parents can manage multiple child profiles for child-safe rides."

### 3. Request a Ride
- Go to `/book`
> "The booking page uses Leaflet maps with OpenStreetMap tiles and Nominatim geocoding. The fare estimate is displayed before you commit."
- Click **Request Ride**
> "That just inserted a ride into Supabase with status 'matching'. The rider page now subscribes to Supabase Realtime — when the driver accepts, this page updates live without refreshing."
- **Leave this tab open** — it should show "Finding your driver..."

### 4. Ride Passes & Payments
> "We also built ride pass subscriptions. Let me show that real quick."
- Open a new tab to `/passes`
> "These are two plans — weekly-5 and weekly-10. The purchase flow goes through Stripe in test mode."
- Click a plan, show the Stripe checkout form (don't need to complete)
> "And on the profile page, riders can manage their saved payment methods through Stripe."

**Jacob says:** "I'll hand it to Cassie for the driver side — watch my rider screen update in real time."

---

## Part 2: Cassie — Driver Backend (3 min)

**Cassie talks while demoing on Safari.**

### 5. Driver Login
- Already logged in as driver. Go to `/driver`
> "When a driver logs in, the middleware routes them to the driver dashboard. The session cookie tells the system who I am — no environment variables or hardcoded IDs."

### 6. View Queue & Accept Ride
- Go to `/queue`
> "Here's the ride Jacob just requested — real data from Supabase. His pickup address, destination, and fare estimate."
- **Point to Jacob's rider screen** — should still say "Finding your driver..."
- Click **Accept Trip**
> "That updated the ride status to driver_en_route and assigned my driver ID. Watch Jacob's screen..."
- **Jacob's screen should update to show "Driver En Route" with Cassie's driver info**
> "That update happened through Supabase Realtime — no page refresh needed on the rider side."

### 7. Complete the Ride Flow
- On the trip page, click **"Simulate Drive to Rider"**
> "Since we don't have real GPS in the demo, we built simulation buttons that advance the ride through each status."
- Click **"Arrived at Pickup"** → confirm identity checks → **"Confirm Pickup"**
> "The pickup confirmation has a two-step identity verification — the driver confirms the rider's name and a pickup PIN."
- Click **"Simulate Trip Completion"**
> "The ride is now complete. The driver's status goes back to 'available' and I'm returned to the queue, ready for the next ride."
- **Jacob's screen should show the completion page**

### 8. Flag the Driver (Jacob)
**Jacob quickly does this part:**
- On the completion page, click **Report an Issue**
- Select "Unsafe driving", add details, submit
> "That just wrote to the driver_flags table in Supabase. Let's see it from the admin side."

**Cassie says:** "Derron, take it from here with the admin view."

---

## Part 3: Derron — Admin Panels (2-3 min)

**Derron talks while demoing on Chrome Incognito.**

### 9. Admin Dashboard
- Go to `/admin`
> "The admin dashboard gives a bird's-eye view of the whole system. Let me walk through the data tables — all of these query real Supabase data."

### 10. Drivers Table
- Go to `/admin/drivers`
> "Here's our driver fleet. We can search by name, filter by status — available, offline, on a trip. This is the drivers table with real data."

### 11. Ride Requests
- Go to `/admin/requests`
> "Pending ride requests. Admins can filter by status, request type — immediate vs scheduled — and child-safe requirements."

### 12. Active & Completed Rides
- Go to `/admin/rides`
> "Active rides currently in progress. This table shows rider, driver, origin, and status."
- Go to `/admin/completed`
> "Completed ride history. You can see the ride Jacob and Cassie just finished."

### 13. Driver Flags
- Go to `/admin/flags`
> "And here's the flag Jacob just submitted — the complaint about the driver. I can filter by status and reason category."
- Click **Resolve** on the flag
> "Resolved. The admin can add notes and the flag gets timestamped with who reviewed it."

---

## Wrap-up (30 sec)

**Jacob:**
> "To summarize — we built the full backend for Ultra using Next.js server actions and Supabase. The rider can register, book rides, manage profiles and payment methods. The driver sees real ride requests and can accept and complete them. The admin monitors everything in real time. All of this is backed by PostgreSQL with row-level security, and the frontend updates live through Supabase Realtime."

---

## Accounts Quick Reference

| Role | Email | Password |
|------|-------|----------|
| Rider | djacobmoore@icloud.com | (your password) |
| Driver | driver1@ultra-app.test | UltraDriver2026! |
| Admin | admin1@ultra-app.test | UltraAdmin2026! |

## If Something Goes Wrong

- **Ride stuck in "matching"**: Driver browser → `/queue` → refresh
- **Page shows mock data**: Restart dev server (`npm run dev`)
- **"No rider profile found"**: The user's `riders` row is missing — re-register
- **Stripe form errors**: Use card `4242 4242 4242 4242`, exp `12/34`, CVC `123`
