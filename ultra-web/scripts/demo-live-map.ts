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
  createDemoFleet,
  createMatchingRide,
  setDriverLocation,
  setRideStatus,
  sweepDemoOrphans,
  type FleetUser,
  type RideTrace,
} from "../e2e/helpers/demo-fleet";
import { haversineMiles } from "../src/lib/geo";

config({ path: resolve(__dirname, "../.env.local") });

const APP_URL = process.env.ULTRA_APP_URL ?? "http://localhost:3000";
const HARD_DEADLINE_MS = 115_000; // leave a 5s margin under the 2-minute cap

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

    const rides: Array<RideTrace & { driverId: string; driver: FleetUser; rider: FleetUser; visibleDriverPage?: Page }> = [];

    // Phase 2: assign visible drivers to ride[0] and ride[1] explicitly,
    // then create those two rides FIRST so the visible drivers can see
    // their own offer in /queue. The remaining 5 rides get DB-driven
    // matching after.
    log("Phase 2 — UI-driven accepts for the 2 visible drivers…");
    for (let i = 0; i < visibleDrivers.length; i++) {
      const driver = visibleDrivers[i]!.user;
      const driverPage = visibleDrivers[i]!.page;
      const rider = fleet.riders[i]!;
      const riderPage = visibleRiders[i]?.page;
      const trace = await createMatchingRide({
        riderId: rider.riderId!,
        pickupLat: rider.startLat,
        pickupLng: rider.startLng,
        dropoffLat: rider.destLat!,
        dropoffLng: rider.destLng!,
      });
      log(`  ride ${trace.rideId.slice(0, 8)}… → driver ${driver.email.split("@")[0]} (UI)`);
      rides.push({
        ...trace,
        driverId: driver.driverId!,
        driver,
        rider,
        visibleDriverPage: driverPage,
      });

      // Visible rider navigates to their tracking page so they see
      // the matching → driver_en_route → arrived → in_progress
      // transitions live (the page polls /api/rides/:id/status).
      if (riderPage) {
        riderPage.goto(`${APP_URL}/ride/${trace.rideId}`).catch(() => {});
      }

      await driverPage.bringToFront().catch(() => {});
      await driverPage.goto(`${APP_URL}/queue`);
      await driverPage
        .getByRole("heading", { name: /Incoming assignment/i })
        .waitFor({ state: "visible", timeout: 8000 })
        .catch(() => {});
      await sleep(1200);
      await driverPage.getByRole("link", { name: /Accept Trip/i }).click();
      await driverPage.waitForURL(new RegExp(`/trip/${trace.rideId}$`), { timeout: 8000 }).catch(() => {});
      await sleep(800);
    }
    await adminPage.bringToFront();

    // Phase 3: create the remaining 5 ride requests, DB-assign them to
    // non-visible drivers (driver-2) using the existing nearest pick.
    log("Phase 3 — DB-driven rides for the remaining 5 riders (staggered 1s)…");
    for (let i = visibleDrivers.length; i < fleet.riders.length; i++) {
      const rider = fleet.riders[i]!;
      const trace = await createMatchingRide({
        riderId: rider.riderId!,
        pickupLat: rider.startLat,
        pickupLng: rider.startLng,
        dropoffLat: rider.destLat!,
        dropoffLng: rider.destLng!,
      });
      const driver = pickNearestAvailable(rider, fleet.drivers, rides, /* allowReuse */ true);
      log(`  ride ${trace.rideId.slice(0, 8)}… → driver ${driver.email.split("@")[0]} (DB)`);
      rides.push({ ...trace, driverId: driver.driverId!, driver, rider });
      await setRideStatus(trace.rideId, "driver_en_route", {
        driver_id: driver.driverId!,
        matched_at: new Date().toISOString(),
      });
      await sleep(1000);
    }

    log("Animating drivers toward pickups…");
    await animatePhase(rides, "to_pickup", start);

    // Phase 4: visible drivers click through pickup confirmation.
    log("Phase 4 — visible drivers confirming pickup via UI…");
    for (const ride of rides) {
      if (!ride.visibleDriverPage) continue;
      const dp = ride.visibleDriverPage;
      await dp.bringToFront().catch(() => {});
      await dp.getByRole("link", { name: /Advance to pickup confirmation/i }).click().catch(() => {});
      await dp.waitForURL(new RegExp(`/trip/${ride.rideId}/pickup$`), { timeout: 5000 }).catch(() => {});
      await sleep(700);
      await dp
        .getByRole("button", { name: /Confirm the rider says the name on screen/i })
        .click()
        .catch(() => {});
      await sleep(400);
      await dp
        .getByRole("button", { name: /Confirm curbside pickup matches the app pin/i })
        .click()
        .catch(() => {});
      await sleep(400);
      await dp.getByRole("button", { name: /^Confirm Pickup$/i }).click().catch(() => {});
      await sleep(800);
    }
    await adminPage.bringToFront();

    log("All drivers arrived. Starting in-progress phase…");
    for (const ride of rides) {
      await setRideStatus(ride.rideId, "in_progress", {
        pickup_at: new Date().toISOString(),
      });
    }

    await animatePhase(rides, "to_dropoff", start);

    log("All rides completed. Marking final state…");
    for (const ride of rides) {
      await setRideStatus(ride.rideId, "completed", {
        completed_at: new Date().toISOString(),
        fare_final: 22.5,
      });
    }

    log("Demo complete. Holding admin window for 30s — watch the map, then cleanup runs…");
    await adminPage.waitForTimeout(30000);
  } finally {
    for (const b of browsers) {
      await b.close().catch(() => {});
    }
    log("Cleaning up seeded users and rides…");
    await fleet.cleanup();
    log(`Total wall time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }
}

function pickNearestAvailable(
  rider: FleetUser,
  drivers: FleetUser[],
  taken: Array<{ driverId: string }>,
  allowReuse = false,
): FleetUser {
  const takenIds = new Set(taken.map((t) => t.driverId));
  const available = drivers.filter((d) => !takenIds.has(d.driverId!));
  const pool = allowReuse ? drivers : available.length > 0 ? available : drivers;
  let best = pool[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const d of pool) {
    const dist = haversineMiles(rider.startLat, rider.startLng, d.startLat, d.startLng);
    if (dist < bestDistance) {
      best = d;
      bestDistance = dist;
    }
  }
  return best;
}

async function animatePhase(
  rides: Array<RideTrace & { driverId: string; driver: FleetUser; rider: FleetUser }>,
  phase: "to_pickup" | "to_dropoff",
  startEpoch: number,
) {
  const TICKS = 8;
  const TICK_MS = 750;
  for (let step = 1; step <= TICKS; step++) {
    if (Date.now() - startEpoch > HARD_DEADLINE_MS) {
      console.warn("Hard deadline reached — skipping remaining animation ticks.");
      return;
    }
    await Promise.all(
      rides.map((ride) => {
        const fromLat = ride.driver.startLat;
        const fromLng = ride.driver.startLng;
        const toLat = phase === "to_pickup" ? ride.rider.startLat : ride.rider.destLat!;
        const toLng = phase === "to_pickup" ? ride.rider.startLng : ride.rider.destLng!;
        const t = step / TICKS;
        const lat = fromLat + (toLat - fromLat) * t;
        const lng = fromLng + (toLng - fromLng) * t;
        return setDriverLocation(ride.driverId, lat, lng);
      }),
    );
    await sleep(TICK_MS);
  }
  // Snap to destination + mark "arrived" if this was the pickup phase
  for (const ride of rides) {
    const toLat = phase === "to_pickup" ? ride.rider.startLat : ride.rider.destLat!;
    const toLng = phase === "to_pickup" ? ride.rider.startLng : ride.rider.destLng!;
    await setDriverLocation(ride.driverId, toLat, toLng);
    if (phase === "to_pickup") {
      await setRideStatus(ride.rideId, "arrived", {
        driver_arrived_at: new Date().toISOString(),
      });
    }
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
