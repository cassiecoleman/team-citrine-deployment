/**
 * Loadtest setup — seeds the users k6 will hammer.
 *
 * Run before every loadtest run:
 *   cd ultra-web && npm run loadtest:setup
 *
 * Writes credentials + Supabase JWTs to `loadtest/seeded.json` (which
 * is git-ignored). The k6 scripts read that file via `open()` at
 * script-init time.
 *
 * All emails use the `loadtest-` prefix so `sweepDemoOrphans()` from
 * `e2e/helpers/demo-fleet.ts` cleans them up if a run crashes.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../ultra-web/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error(
    "Loadtest setup needs NEXT_PUBLIC_SUPABASE_URL, " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in " +
      "ultra-web/.env.local",
  );
  process.exit(1);
}

const RIDER_COUNT = Number(process.env.LOADTEST_RIDERS ?? 25);
const DRIVER_COUNT = Number(process.env.LOADTEST_DRIVERS ?? 5);
const PASSWORD = "loadtest-password-123";

interface Seeded {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
}

interface SeededFile {
  supabaseUrl: string;
  anonKey: string;
  admin: Seeded;
  riders: Array<Seeded & { riderId: string }>;
  drivers: Array<Seeded & { driverId: string }>;
}

async function main() {
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  const anonClient = createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ts = Date.now();

  async function makeUser(role: "rider" | "driver" | "admin", index: number) {
    const email = `loadtest-${role}-${index}-${ts}@ultra.test`;
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`createUser ${role} ${index}: ${error?.message}`);
    }
    await sb.from("user_roles").insert({ user_id: data.user.id, role });

    // Sign in via anon client to mint an access token usable by k6.
    const session = await anonClient.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    if (session.error || !session.data.session) {
      throw new Error(`signIn ${email}: ${session.error?.message}`);
    }
    return {
      email,
      password: PASSWORD,
      userId: data.user.id,
      accessToken: session.data.session.access_token,
      refreshToken: session.data.session.refresh_token,
    };
  }

  console.log(`Seeding ${RIDER_COUNT} riders, ${DRIVER_COUNT} drivers, 1 admin…`);

  const admin = await makeUser("admin", 0);

  const riders: SeededFile["riders"] = [];
  for (let i = 0; i < RIDER_COUNT; i++) {
    const u = await makeUser("rider", i);
    const { data: row, error } = await sb
      .from("riders")
      .insert({
        user_id: u.userId,
        name: `Loadtest Rider ${i}`,
        current_lat: 35.135 + (Math.random() - 0.5) * 0.05,
        current_lng: -90.045 + (Math.random() - 0.5) * 0.05,
        current_location_updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(`riders insert: ${error?.message}`);
    riders.push({ ...u, riderId: row.id as string });
  }

  const drivers: SeededFile["drivers"] = [];
  for (let i = 0; i < DRIVER_COUNT; i++) {
    const u = await makeUser("driver", i);
    const plate = `LT-${ts.toString().slice(-5)}-${i}`;
    const { data: row, error } = await sb
      .from("drivers")
      .insert({
        user_id: u.userId,
        name: `Loadtest Driver ${i}`,
        status: "available",
        rating: 4.9,
        total_ratings: 10,
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
        vehicle_color: "Blue",
        vehicle_year: 2022,
        license_plate: plate,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(`drivers insert: ${error?.message}`);
    await sb.from("driver_locations").upsert(
      {
        driver_id: row.id as string,
        lat: 35.135 + (Math.random() - 0.5) * 0.05,
        lng: -90.045 + (Math.random() - 0.5) * 0.05,
        source: "manual",
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" },
    );
    drivers.push({ ...u, driverId: row.id as string });
  }

  const out: SeededFile = {
    supabaseUrl: SUPABASE_URL!,
    anonKey: ANON_KEY!,
    admin,
    riders,
    drivers,
  };

  const path = resolve(__dirname, "../seeded.json");
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(
    `Wrote ${path} — ${riders.length} riders, ${drivers.length} drivers, 1 admin.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
