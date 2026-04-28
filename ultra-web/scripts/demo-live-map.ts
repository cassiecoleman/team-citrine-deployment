/**
 * Live Map demo orchestrator.
 *
 * Spawns 7 riders + 3 drivers + 1 admin via the service role, preloads
 * each user's current location, then in <2 minutes:
 *   1. Opens one Chromium window logged in as the admin and parks it on
 *      /admin/live-map.
 *   2. Stagger-fires 7 ride requests.
 *   3. Picks the nearest available driver per ride and simulates the
 *      driver-accept step.
 *   4. Animates each driver toward pickup, marks arrived, animates to
 *      dropoff, marks completed.
 *   5. Cleans up all created users + rides.
 *
 * Run: `npx tsx scripts/demo-live-map.ts`
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. The Next.js dev server
 * must be running at http://localhost:3000.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  clearRiderLocation,
  createDemoFleet,
  createMatchingRide,
  flagDriverForRide,
  setDriverLocation,
  setRideStatus,
  submitRideRating,
  sweepDemoOrphans,
  type FleetUser,
} from "../e2e/helpers/demo-fleet";
import { haversineMiles } from "../src/lib/geo";

config({ path: resolve(__dirname, "../.env.local") });

const APP_URL = process.env.ULTRA_APP_URL ?? "http://localhost:3000";

// Slow mode: stretches the demo so you can flip between admin tabs
// (/admin/rides, /admin/requests, /admin/completed, /admin/flags) and
// watch each panel populate. Toggle with `DEMO_SLOW=1`.
const SLOW = process.env.DEMO_SLOW === "1" || process.env.DEMO_SPEED === "slow";
const TICKS = SLOW ? 6 : 4;
const TICK_MS = SLOW ? 800 : 500;
const FINAL_HOLD_MS = 20_000;
const HARD_DEADLINE_MS = SLOW ? 360_000 : 115_000;

const RATING_COMMENTS = [
  { stars: 5, comment: "Smooth ride, friendly driver." },
  { stars: 5, comment: "On time and clean car!" },
  { stars: 4, comment: "Good ride. Music was loud." },
  { stars: 5, comment: "Helped with bags. Great service." },
  { stars: 3, comment: "Took the long way." },
];

const COMPLAINT = {
  reason: "safety" as const,
  details: "Driver was on their phone during the ride and ran a yellow light.",
};

const RIDER_SEEDS = [
  { name: "Aisha R.", startLat: 35.155, startLng: -90.06, destLat: 35.13, destLng: -89.97 },
  { name: "Ben K.", startLat: 35.165, startLng: -90.04, destLat: 35.11, destLng: -89.98 },
  { name: "Cami D.", startLat: 35.118, startLng: -90.075, destLat: 35.14, destLng: -89.99 },
  { name: "Dani S.", startLat: 35.145, startLng: -90.012, destLat: 35.10, destLng: -89.95 },
  { name: "Evan M.", startLat: 35.128, startLng: -90.085, destLat: 35.16, destLng: -89.96 },
  { name: "Faye L.", startLat: 35.172, startLng: -90.055, destLat: 35.12, destLng: -89.99 },
  { name: "Gigi T.", startLat: 35.115, startLng: -90.025, destLat: 35.17, destLng: -89.97 },
];

const DRIVER_SEEDS = [
  { name: "Marcus W.", startLat: 35.140, startLng: -90.050 },
  { name: "Nina J.", startLat: 35.155, startLng: -90.030 },
  { name: "Omar P.", startLat: 35.125, startLng: -90.060 },
];

async function main() {
  const start = Date.now();
  const log = (msg: string) =>
    console.log(`[${((Date.now() - start) / 1000).toFixed(1)}s] ${msg}`);

  if (SLOW) {
    log("SLOW mode active — animation ticks stretched.");
  }

  log("Pre-run sweep: removing any leftover demo users from previous runs…");
  const swept = await sweepDemoOrphans();
  log(`  swept ${swept.deletedUsers} orphan user${swept.deletedUsers === 1 ? "" : "s"}`);

  log("Seeding demo fleet (7 riders, 3 drivers, 1 admin)…");
  const fleet = await createDemoFleet({ riders: RIDER_SEEDS, drivers: DRIVER_SEEDS });

  const browsers: Browser[] = [];
  try {
    log(`Opening admin browser at ${APP_URL}/admin/live-map`);
    const adminBrowser = await chromium.launch({
      headless: false,
      args: ["--window-position=0,0", "--window-size=1100,900"],
    });
    browsers.push(adminBrowser);
    const adminContext = await adminBrowser.newContext({
      viewport: { width: 1100, height: 900 },
    });
    await injectSession(adminContext, fleet.admin);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${APP_URL}/admin/live-map`);
    await adminPage.bringToFront();
    await adminPage.waitForTimeout(1500);

    // Open 2 rider + 2 driver phone-width windows so the demo also
    // shows the user-facing UIs updating live alongside the admin map.
    // Drivers from the seed: drivers[0] = Marcus W., [1] = Nina J.
    // We pick rider[0] / rider[1] as the riders whose rides go to those
    // visible drivers so the UI flow is end-to-end visible.
    const visibleRiders: { user: FleetUser; page: Page }[] = [];
    const visibleDrivers: { user: FleetUser; page: Page }[] = [];

    const phoneWindows = [
      { user: fleet.riders[0]!, role: "rider" as const, dest: "/", x: 1110, y: 0 },
      { user: fleet.riders[1]!, role: "rider" as const, dest: "/", x: 1510, y: 0 },
      { user: fleet.drivers[0]!, role: "driver" as const, dest: "/driver", x: 1110, y: 460 },
      { user: fleet.drivers[1]!, role: "driver" as const, dest: "/driver", x: 1510, y: 460 },
    ];
    for (const w of phoneWindows) {
      const b = await chromium.launch({
        headless: false,
        args: [
          `--window-position=${w.x},${w.y}`,
          "--window-size=400,820",
        ],
      });
      browsers.push(b);
      const ctx = await b.newContext({
        viewport: { width: 390, height: 780 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      await injectSession(ctx, w.user);
      const page = await ctx.newPage();
      await page.goto(`${APP_URL}${w.dest}`);
      log(`  opened ${w.role} window for ${w.user.email.split("@")[0]} at ${w.dest}`);
      if (w.role === "rider") visibleRiders.push({ user: w.user, page });
      else visibleDrivers.push({ user: w.user, page });
    }
    await adminPage.bringToFront();
    await adminPage.waitForTimeout(1000);

    // Phase 1: visible riders fill in the LocationEntryCard so you can
    // see the form interaction. (The seed already populated their
    // current_lat/lng, but this re-saves them via the real UI.) Use
    // the Lat/Lng tab so we don't depend on Nominatim during the demo.
    log("Visible riders entering their location via LocationEntryCard…");
    for (const r of visibleRiders) {
      await r.page.bringToFront().catch(() => {});
      await r.page.getByRole("button", { name: /lat \/ lng/i }).click({ timeout: 5000 }).catch(() => {});
      await r.page.getByLabel(/latitude/i).fill(String(r.user.startLat), { timeout: 3000 }).catch(() => {});
      await r.page.getByLabel(/longitude/i).fill(String(r.user.startLng), { timeout: 3000 }).catch(() => {});
      await r.page.getByRole("button", { name: /save location/i }).click({ timeout: 3000 }).catch(() => {});
      await r.page
        .getByText(/saved 35\./i)
        .waitFor({ state: "visible", timeout: 3000 })
        .catch(() => {});
      await sleep(300);
    }
    await adminPage.bringToFront();

    // Build a pool of rides that need a driver. Each driver pulls
    // from the pool until it's empty.
    const ridePool: FleetUser[] = [...fleet.riders];
    const visibleRiderPages = new Map<string, Page>(
      visibleRiders.map((r) => [r.user.riderId!, r.page]),
    );

    // Phase 2: each visible driver does ONE ride end-to-end through
    // the UI (queue → trip → pickup confirmation). They take the
    // closest pending rider. After that they fall back into the
    // worker loop with everyone else.
    log("Phase 2 — visible drivers handling first ride via UI…");
    const uiPromises: Promise<void>[] = [];
    for (let i = 0; i < visibleDrivers.length; i++) {
      const driverPage = visibleDrivers[i]!.page;
      const driver = visibleDrivers[i]!.user;
      // Pick the nearest pending rider for this driver from the pool.
      const idx = nearestPendingIndex(driver, ridePool);
      if (idx === -1) continue;
      const rider = ridePool.splice(idx, 1)[0]!;
      uiPromises.push(
        runUiRide({
          driver,
          driverPage,
          rider,
          riderPage: visibleRiderPages.get(rider.riderId!),
          start,
          log,
        }),
      );
    }
    await Promise.all(uiPromises);
    await adminPage.bringToFront();

    // Phase 3: parallel driver worker loop. Each driver keeps pulling
    // the nearest pending rider, animates a full ride, marks the
    // rider as "left the app" by clearing their location, then loops.
    log(`Phase 3 — worker loop, ${ridePool.length} riders left in queue…`);
    const workerPromises = fleet.drivers.map((driver) =>
      runDriverWorker({
        driver,
        ridePool,
        visibleRiderPages,
        start,
        log,
      }),
    );
    await Promise.all(workerPromises);

    log(
      `Demo complete. Holding admin window for ${(FINAL_HOLD_MS / 1000).toFixed(0)}s — flip between /admin/rides, /admin/requests, /admin/completed, /admin/flags to see the data, then cleanup runs…`,
    );
    await adminPage.waitForTimeout(FINAL_HOLD_MS);
  } finally {
    for (const b of browsers) {
      await b.close().catch(() => {});
    }
    log("Cleaning up seeded users and rides…");
    await fleet.cleanup();
    log(`Total wall time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }
}

function nearestPendingIndex(
  driver: { startLat: number; startLng: number },
  pool: FleetUser[],
): number {
  if (pool.length === 0) return -1;
  let bestIdx = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < pool.length; i++) {
    const r = pool[i]!;
    const d = haversineMiles(driver.startLat, driver.startLng, r.startLat, r.startLng);
    if (d < bestDistance) {
      bestDistance = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

async function runUiRide(input: {
  driver: FleetUser;
  driverPage: Page;
  rider: FleetUser;
  riderPage?: Page;
  start: number;
  log: (msg: string) => void;
}) {
  const { driver, driverPage, rider, riderPage, log } = input;
  const trace = await createMatchingRide({
    riderId: rider.riderId!,
    pickupLat: rider.startLat,
    pickupLng: rider.startLng,
    dropoffLat: rider.destLat!,
    dropoffLng: rider.destLng!,
  });
  log(`  UI ride ${trace.rideId.slice(0, 8)}… ${driver.email.split("@")[0]} ↔ ${rider.email.split("@")[0]}`);

  if (riderPage) {
    riderPage.goto(`${APP_URL}/ride/${trace.rideId}`).catch(() => {});
  }

  await driverPage.goto(`${APP_URL}/queue`);
  await driverPage
    .getByRole("heading", { name: /Incoming assignment/i })
    .waitFor({ state: "visible", timeout: 8000 })
    .catch(() => {});
  await sleep(800);
  await driverPage.getByRole("link", { name: /Accept Trip/i }).click().catch(() => {});
  await driverPage.waitForURL(new RegExp(`/trip/${trace.rideId}$`), { timeout: 8000 }).catch(() => {});

  // Animate to pickup while driver page is on /trip/:id
  await animateMovement(driver.driverId!, driver.startLat, driver.startLng, rider.startLat, rider.startLng, TICKS, TICK_MS);

  await driverPage.getByRole("link", { name: /Advance to pickup confirmation/i }).click({ timeout: 5000 }).catch(() => {});
  await driverPage.waitForURL(new RegExp(`/trip/${trace.rideId}/pickup$`), { timeout: 5000 }).catch(() => {});
  await sleep(400);
  await driverPage
    .getByRole("button", { name: /Confirm the rider says the name on screen/i })
    .click()
    .catch(() => {});
  await sleep(300);
  await driverPage
    .getByRole("button", { name: /Confirm curbside pickup matches the app pin/i })
    .click()
    .catch(() => {});
  await sleep(300);
  await driverPage.getByRole("button", { name: /^Confirm Pickup$/i }).click().catch(() => {});

  await setRideStatus(trace.rideId, "in_progress", {
    pickup_at: new Date().toISOString(),
  });
  await animateMovement(driver.driverId!, rider.startLat, rider.startLng, rider.destLat!, rider.destLng!, TICKS, TICK_MS);

  await setRideStatus(trace.rideId, "completed", {
    completed_at: new Date().toISOString(),
    fare_final: 22.5,
  });
  await attachRideFeedback({
    rideId: trace.rideId,
    riderId: rider.riderId!,
    driverId: driver.driverId!,
    isFirstRide: true,
  });
  await clearRiderLocation(rider.riderId!);
  // Driver's "current position" for the next pickup is the dropoff.
  driver.startLat = rider.destLat!;
  driver.startLng = rider.destLng!;
  log(`  ✓ ${rider.email.split("@")[0]} delivered (driver ${driver.email.split("@")[0]} now at dropoff)`);
}

async function runDriverWorker(input: {
  driver: FleetUser;
  ridePool: FleetUser[];
  visibleRiderPages: Map<string, Page>;
  start: number;
  log: (msg: string) => void;
}) {
  const { driver, ridePool, visibleRiderPages, start, log } = input;
  while (ridePool.length > 0) {
    if (Date.now() - input.start > HARD_DEADLINE_MS) {
      console.warn("Hard deadline reached — driver worker stopping.");
      return;
    }
    const idx = nearestPendingIndex(driver, ridePool);
    if (idx === -1) return;
    const rider = ridePool.splice(idx, 1)[0]!;

    // In slow mode, hold each ride in `matching` for a beat so it
    // shows up in /admin/requests before being assigned.
    const trace = await createMatchingRide({
      riderId: rider.riderId!,
      pickupLat: rider.startLat,
      pickupLng: rider.startLng,
      dropoffLat: rider.destLat!,
      dropoffLng: rider.destLng!,
    });
    log(`  DB ride ${trace.rideId.slice(0, 8)}… ${driver.email.split("@")[0]} ↔ ${rider.email.split("@")[0]}`);
    if (SLOW) await sleep(2500);

    const riderPage = visibleRiderPages.get(rider.riderId!);
    if (riderPage) {
      riderPage.goto(`${APP_URL}/ride/${trace.rideId}`).catch(() => {});
    }

    await setRideStatus(trace.rideId, "driver_en_route", {
      driver_id: driver.driverId!,
      matched_at: new Date().toISOString(),
    });
    await animateMovement(driver.driverId!, driver.startLat, driver.startLng, rider.startLat, rider.startLng, TICKS, TICK_MS);
    await setRideStatus(trace.rideId, "arrived", {
      driver_arrived_at: new Date().toISOString(),
    });
    await sleep(400);
    await setRideStatus(trace.rideId, "in_progress", {
      pickup_at: new Date().toISOString(),
    });
    await animateMovement(driver.driverId!, rider.startLat, rider.startLng, rider.destLat!, rider.destLng!, TICKS, TICK_MS);
    await setRideStatus(trace.rideId, "completed", {
      completed_at: new Date().toISOString(),
      fare_final: 22.5,
    });
    await attachRideFeedback({
      rideId: trace.rideId,
      riderId: rider.riderId!,
      driverId: driver.driverId!,
      isFirstRide: false,
    });
    await clearRiderLocation(rider.riderId!);
    driver.startLat = rider.destLat!;
    driver.startLng = rider.destLng!;
    log(`  ✓ ${rider.email.split("@")[0]} delivered`);
  }
}

let complaintFiled = false;
let ratingIdx = 0;

async function attachRideFeedback(input: {
  rideId: string;
  riderId: string;
  driverId: string;
  isFirstRide: boolean;
}) {
  // File the one complaint on the first DB-driven ride so the admin
  // /flags tab has data. Visible-driver UI rides skip this so the
  // complaint shows up partway through the demo, not on the very
  // first transition.
  if (!complaintFiled && !input.isFirstRide) {
    await flagDriverForRide({
      rideId: input.rideId,
      riderId: input.riderId,
      driverId: input.driverId,
      reason: COMPLAINT.reason,
      details: COMPLAINT.details,
    });
    // Still leave a low rating with the complaint so the same ride
    // shows in /admin/completed with the bad score.
    await submitRideRating({
      rideId: input.rideId,
      riderId: input.riderId,
      driverId: input.driverId,
      riderGaveDriver: 1,
      riderComment: "Felt unsafe — see flag.",
      tipAmount: 0,
    });
    complaintFiled = true;
    return;
  }

  // 80% of completed rides get a 4-or-5 star rating + small tip.
  if (Math.random() < 0.8) {
    const review = RATING_COMMENTS[ratingIdx % RATING_COMMENTS.length]!;
    ratingIdx++;
    await submitRideRating({
      rideId: input.rideId,
      riderId: input.riderId,
      driverId: input.driverId,
      riderGaveDriver: review.stars,
      riderComment: review.comment,
      tipAmount: review.stars >= 5 ? 4 : 2,
    });
  }
}

async function animateMovement(
  driverId: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  ticks: number,
  tickMs: number,
) {
  for (let step = 1; step <= ticks; step++) {
    const t = step / ticks;
    const lat = fromLat + (toLat - fromLat) * t;
    const lng = fromLng + (toLng - fromLng) * t;
    await setDriverLocation(driverId, lat, lng);
    await sleep(tickMs);
  }
}

async function injectSession(ctx: BrowserContext, user: FleetUser) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error || !data.session) {
    throw new Error(`sign-in failed for ${user.email}: ${error?.message}`);
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  await ctx.addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: "bearer",
        user: data.session.user,
      }),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
