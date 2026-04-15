# Ultra P3 Backend — Demo Script

**Format:** Teams meeting, webcams on, screen share. One person drives the demo (~8 min), then all three present reflections.

**Slides:** `meta-documents/ultra-p3-demo.pptx` (13 slides)

---

## Setup Before Recording

**Three browsers ready:**
- **Chrome** — Rider: `djacobmoore@icloud.com`
- **Safari** — Driver: `driver1@ultra-app.test` / `UltraDriver2026!`
- **Chrome Incognito** — Admin: `admin1@ultra-app.test` / `UltraAdmin2026!`

Dev server running: `cd ultra-web && npm run dev`

Have the slides open in a separate window to share between demo sections.

---

## Part 1: Backend Demo (~8 min)

**Jacob drives the screen share. Cassie and Derron chime in on their sections.**

### Slide 1-3: Intro (30 sec)

Share slides. Show title, tech stack, architecture.

> **Jacob:** "We're Team Citrine. We built Ultra, a ride-sharing app. I'll walk through the full backend — everything hits a real Supabase PostgreSQL database, no mock data. The frontend was already built; our job was replacing mocks with real server actions."

### Slide 4: Rider Flow (2.5 min)

Switch to Chrome (rider browser).

**Registration & Login**
- Show `/login` page briefly
> "Supabase Auth with email/password. Middleware checks your session cookie and routes you by role."

**Profile**
- Go to `/profile`
> "Real data — my name from the riders table, email from auth. I can edit inline."
- Click Edit, change phone, Save
> "Server action updates the riders table."
- Click Add Rider Profile, add "Emma", emergency "Rosa M."
> "Creates a rider_profiles row for child-safe rides."

**Request a Ride**
- Go to `/book`, click Request Ride
> "Inserts a ride with status 'matching'. This page subscribes to Supabase Realtime — watch it update live when the driver acts."
- Leave tab open showing "Finding your driver..."

**Ride Passes** (quick)
- Open `/passes` in a new tab
> "Two subscription plans. Purchase goes through Stripe test mode."
- Show the Stripe form briefly, don't submit

### Slide 5: Driver Flow (2 min)

Switch to Safari (driver browser).

> **Cassie** (or Jacob narrates): "Now the driver side."

**Login & Queue**
- Already logged in. Go to `/queue`
> "Here's Jacob's ride — real data from Supabase. Pickup, destination, fare."
- Point out rider's screen still says "Finding your driver..."
- Click Accept Trip
> "Watch the rider screen..."
- **Rider screen updates live to "Driver En Route"**
> "That's Supabase Realtime — no page refresh."

**Complete the Ride**
- Click "Simulate Drive to Rider"
- Click "Arrived at Pickup" → check both identity boxes → "Confirm Pickup"
- Click "Simulate Trip Completion"
> "Driver's back to the queue, ready for the next ride."
- **Rider screen shows completion page**

**Flag the Driver**
- Switch to Chrome rider, click "Report an Issue"
- Select "Unsafe driving", add "Ran a red light", submit
> "That just wrote to the driver_flags table. Let's see it from admin."

### Slide 6: Admin Panels (1.5 min)

Switch to Chrome Incognito (admin browser).

> **Derron** (or Jacob narrates): "Admin dashboard — all real Supabase data."

- `/admin/drivers` — "Driver fleet. Search, filter by status."
- `/admin/requests` — "Pending ride requests with status and type filters."
- `/admin/rides` — "Active rides in progress."
- `/admin/completed` — "Ride history."
- `/admin/flags` — "Here's the flag Jacob just submitted."
- Click Resolve on the flag
> "Resolved with timestamp and admin notes."

### Slide 7-8: Edge Cases (1 min)

Share slides, talk through a few highlights:

> "We handled race conditions with optimistic locking — if two drivers try to accept the same ride, only one wins. Fare split amounts are protected by a database trigger. All inputs go through Zod validation server-side."

**Live edge case demos** (pick 2-3):
- Open a private window, go to `/book` without logging in → redirected to `/login`
- Show empty driver queue when no rides are pending → "No ride requests right now"
- (Optional) Run tests live:

```bash
cd ultra-web && npx vitest run --reporter=verbose 2>&1 | tail -20
```

### Slide 9: Testing (30 sec)

> "190+ unit tests with Vitest, 30+ E2E tests with Playwright. TDD workflow — every test failed before we wrote the code."

---

## Part 2: Reflections (~5 min)

Share slides for each question. Each person presents one.

### Slide 10: Jacob — "How effective was the LLM?"

> "Really effective for the repetitive parts — Supabase queries, Zod schemas, RLS policies, type mappings. Claude generated all of that correctly on the first try most of the time."
>
> "The TDD cycle worked especially well. I'd tell Claude to write a failing test, confirm it failed, then it would write the minimum code to pass. That kept things focused."
>
> "Once we had one feature working — like ride scheduling — every subsequent feature followed the same pattern. Claude picked up on that and replicated it consistently."
>
> "In two weeks, it generated 8 database migrations, over 50 server actions, and 190+ tests."

### Slide 11: Cassie — "What was wrong? What was hard to fix?"

> "The biggest issue was the auth model. Claude kept accepting userId as a function parameter instead of reading from the session cookie. That's an identity spoofing risk. It took us several PRs to fix it everywhere — booking page, driver pages, ride completion."
>
> "Easier fixes: missing npm packages — leaflet and Stripe were referenced but never installed. Just needed `npm install`."
>
> "There was a race condition in fare split acceptance — it would read 'pending' status, then update by ID without rechecking. We fixed it with atomic WHERE predicates in the UPDATE."
>
> "The sneakiest bug was a demo state file that cached stale ride statuses. The completion page would show 'in progress' forever because it read from a temp file instead of the database."

### Slide 12: Derron — "How did you verify completeness?"

> "We mapped every user story to a GitHub issue and tracked them through PRs. Each PR got a code review — sometimes from us, sometimes from Claude."
>
> "The TDD workflow was key. Every behavior has a test that failed first. If it didn't fail, we rewrote the test."
>
> "We actually used Claude to write PR reviews too. It caught things like missing unit tests in the login PR, missing E2E tests in the middleware PR, and the auth model issues."
>
> "And tonight's demo proves it end-to-end — a rider can register, book a ride, a driver can accept and complete it, and an admin can monitor and resolve complaints. All against live Supabase."

### Slide 13: Thank You

> "That's Ultra — predictable, affordable rides. Thanks for watching."

---

## Accounts Quick Reference

| Role | Email | Password |
|------|-------|----------|
| Rider | djacobmoore@icloud.com | (your password) |
| Driver | driver1@ultra-app.test | UltraDriver2026! |
| Admin | admin1@ultra-app.test | UltraAdmin2026! |

## Troubleshooting

- **Ride stuck in "matching"**: Driver → `/queue` → refresh
- **Page shows mock data**: Restart `npm run dev`
- **"No rider profile found"**: Re-register the account
- **Stripe form**: Card `4242 4242 4242 4242`, exp `12/34`, CVC `123`
- **Admin can't see flags**: Make sure you flagged a driver after ride completion
