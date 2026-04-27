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
import { chromium, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  createDemoFleet,
  createMatchingRide,
  setDriverLocation,
  setRideStatus,
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

  log("Seeding demo fleet (7 riders, 3 drivers, 1 admin)…");
  const fleet = await createDemoFleet({ riders: RIDER_SEEDS, drivers: DRIVER_SEEDS });

  let browser;
  try {
    log(`Opening admin browser at ${APP_URL}/admin/live-map`);
    browser = await chromium.launch({ headless: false });
    const adminContext = await browser.newContext();
    await injectSession(adminContext, fleet.admin);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${APP_URL}/admin/live-map`);
    await adminPage.waitForTimeout(2000);

    const rides: Array<RideTrace & { driverId: string; driver: FleetUser; rider: FleetUser }> = [];

    log("Firing 7 ride requests staggered every 1.5s…");
    for (let i = 0; i < fleet.riders.length; i++) {
      const rider = fleet.riders[i]!;
      const trace = await createMatchingRide({
        riderId: rider.riderId!,
        pickupLat: rider.startLat,
        pickupLng: rider.startLng,
        dropoffLat: rider.destLat!,
        dropoffLng: rider.destLng!,
      });
      const driver = pickNearestAvailable(rider, fleet.drivers, rides);
      log(`  rider ${rider.email.split("@")[0]} → driver ${driver.email.split("@")[0]}`);
      rides.push({ ...trace, driverId: driver.driverId!, driver, rider });
      // Simulate driver accept: assign + transition to driver_en_route
      await setRideStatus(trace.rideId, "driver_en_route", {
        driver_id: driver.driverId!,
        matched_at: new Date().toISOString(),
      });
      await sleep(1500);
    }

    log("Animating drivers toward pickups…");
    await animatePhase(rides, "to_pickup", start);

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

    log("Demo complete. Holding admin window for 4s before cleanup…");
    await adminPage.waitForTimeout(4000);
  } finally {
    if (browser) await browser.close();
    log("Cleaning up seeded users and rides…");
    await fleet.cleanup();
    log(`Total wall time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }
}

function pickNearestAvailable(
  rider: FleetUser,
  drivers: FleetUser[],
  taken: Array<{ driverId: string }>,
): FleetUser {
  const takenIds = new Set(taken.map((t) => t.driverId));
  const available = drivers.filter((d) => !takenIds.has(d.driverId!));
  const pool = available.length > 0 ? available : drivers;
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
