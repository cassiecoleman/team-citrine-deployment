import { createClient } from "@supabase/supabase-js";

import type { TestUser } from "./auth";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Demo fleet requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceRoleKey);
}

const DEMO_EMAIL_PREFIXES = ["demo-", "pw-demo-", "pw-livemap-", "e2e-"];

function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return DEMO_EMAIL_PREFIXES.some((p) => email.startsWith(p));
}

/**
 * Delete every demo/test user (plus their cascades) from the local
 * Supabase. Idempotent — safe to call before and after every run.
 *
 * "Demo" is identified by email prefix: demo-, pw-demo-, pw-livemap-,
 * e2e-. Matches what createDemoFleet emits and what the existing
 * Playwright helpers (createTestRider/Driver) emit. Will not touch
 * seed-* or rider1@ultra-app.test style accounts created by the
 * standalone seed scripts.
 */
export async function sweepDemoOrphans(): Promise<{
  deletedUsers: number;
  scannedPages: number;
}> {
  const sb = admin();
  let deleted = 0;
  let page = 1;
  const PER_PAGE = 200;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error || !data?.users?.length) break;

    const targets = data.users.filter((u) => isDemoEmail(u.email));
    for (const u of targets) {
      const { data: rider } = await sb
        .from("riders")
        .select("id")
        .eq("user_id", u.id)
        .maybeSingle();
      if (rider?.id) {
        await sb.from("rides").delete().eq("rider_id", rider.id);
        await sb.from("ride_passes").delete().eq("rider_id", rider.id);
        await sb.from("rider_profiles").delete().eq("rider_id", rider.id);
      }
      const { data: drv } = await sb
        .from("drivers")
        .select("id")
        .eq("user_id", u.id)
        .maybeSingle();
      if (drv?.id) {
        await sb.from("rides").delete().eq("driver_id", drv.id);
        await sb.from("driver_locations").delete().eq("driver_id", drv.id);
        await sb.from("drivers").delete().eq("user_id", u.id);
      }
      await sb.from("riders").delete().eq("user_id", u.id);
      await sb.from("user_roles").delete().eq("user_id", u.id);
      await sb.auth.admin.deleteUser(u.id).catch(() => {});
      deleted++;
    }

    if (data.users.length < PER_PAGE) break;
    page++;
  }
  return { deletedUsers: deleted, scannedPages: page };
}

export interface FleetUser extends TestUser {
  role: "rider" | "driver" | "admin";
  riderId?: string;
  driverId?: string;
  startLat: number;
  startLng: number;
  destLat?: number;
  destLng?: number;
}

export interface DemoFleet {
  riders: FleetUser[];
  drivers: FleetUser[];
  admin: FleetUser;
  cleanup: () => Promise<void>;
}

interface RiderSeed {
  name: string;
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
}

interface DriverSeed {
  name: string;
  startLat: number;
  startLng: number;
  vehicle?: { make: string; model: string; color: string; year: number; plate: string };
}

const PASSWORD = "demo-password-123";

export async function createDemoFleet(input: {
  riders: RiderSeed[];
  drivers: DriverSeed[];
  emailPrefix?: string;
}): Promise<DemoFleet> {
  // Always sweep orphans BEFORE seeding — guarantees the demo starts
  // from a clean slate even if a previous run crashed mid-flight.
  await sweepDemoOrphans();

  const sb = admin();
  const ts = Date.now();
  const prefix = input.emailPrefix ?? "demo";
  const createdUserIds: string[] = [];
  const createdRideIds: string[] = [];

  async function makeUser(role: "rider" | "driver" | "admin", index: number) {
    const email = `${prefix}-${role}-${index}-${ts}@ultra.test`;
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create demo ${role} #${index}: ${error?.message}`);
    }
    createdUserIds.push(data.user.id);
    await sb.from("user_roles").insert({ user_id: data.user.id, role });
    return { userId: data.user.id, email, password: PASSWORD };
  }

  // Riders
  const riders: FleetUser[] = [];
  for (let i = 0; i < input.riders.length; i++) {
    const seed = input.riders[i]!;
    const u = await makeUser("rider", i);
    const { data: riderRow, error: rErr } = await sb
      .from("riders")
      .insert({
        user_id: u.userId,
        name: seed.name,
        current_lat: seed.startLat,
        current_lng: seed.startLng,
        current_location_updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (rErr || !riderRow) throw new Error(`rider row insert: ${rErr?.message}`);
    riders.push({
      ...u,
      role: "rider",
      riderId: riderRow.id as string,
      startLat: seed.startLat,
      startLng: seed.startLng,
      destLat: seed.destLat,
      destLng: seed.destLng,
    });
  }

  // Drivers
  const drivers: FleetUser[] = [];
  for (let i = 0; i < input.drivers.length; i++) {
    const seed = input.drivers[i]!;
    const u = await makeUser("driver", i);
    const plateSuffix = `${ts.toString().slice(-5)}-${i}`;
    const v = seed.vehicle ?? {
      make: "Toyota",
      model: "Camry",
      color: "Blue",
      year: 2022,
      plate: `ULT-${plateSuffix}`,
    };
    const { data: drvRow, error: dErr } = await sb
      .from("drivers")
      .insert({
        user_id: u.userId,
        name: seed.name,
        status: "available",
        rating: 4.9,
        total_ratings: 12,
        vehicle_make: v.make,
        vehicle_model: v.model,
        vehicle_color: v.color,
        vehicle_year: v.year,
        license_plate: v.plate,
      })
      .select("id")
      .single();
    if (dErr || !drvRow) throw new Error(`driver row insert: ${dErr?.message}`);
    await sb.from("driver_locations").upsert(
      {
        driver_id: drvRow.id as string,
        lat: seed.startLat,
        lng: seed.startLng,
        source: "manual",
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" },
    );
    drivers.push({
      ...u,
      role: "driver",
      driverId: drvRow.id as string,
      startLat: seed.startLat,
      startLng: seed.startLng,
    });
  }

  // Admin
  const adminUser = await makeUser("admin", 0);
  const adminFleet: FleetUser = {
    ...adminUser,
    role: "admin",
    startLat: 35.135,
    startLng: -90.045,
  };

  return {
    riders,
    drivers,
    admin: adminFleet,
    cleanup: async () => {
      for (const rideId of createdRideIds) {
        await sb.from("ride_status_history").delete().eq("ride_id", rideId);
        await sb.from("ride_ratings").delete().eq("ride_id", rideId);
        await sb.from("driver_flags").delete().eq("ride_id", rideId);
        await sb.from("rides").delete().eq("id", rideId);
      }
      for (const userId of createdUserIds) {
        const { data: rider } = await sb
          .from("riders")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (rider?.id) {
          await sb.from("rides").delete().eq("rider_id", rider.id);
          await sb.from("ride_passes").delete().eq("rider_id", rider.id);
          await sb.from("rider_profiles").delete().eq("rider_id", rider.id);
        }
        const { data: drv } = await sb
          .from("drivers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (drv?.id) {
          await sb.from("rides").delete().eq("driver_id", drv.id);
          await sb.from("driver_locations").delete().eq("driver_id", drv.id);
          await sb.from("drivers").delete().eq("user_id", userId);
        }
        await sb.from("riders").delete().eq("user_id", userId);
        await sb.from("user_roles").delete().eq("user_id", userId);
        await sb.auth.admin.deleteUser(userId).catch(() => {});
      }
      // Belt-and-suspenders: sweep any orphan demo users that weren't
      // tracked in createdUserIds (e.g. from a sibling spec or an
      // earlier crashed run that this process didn't see).
      await sweepDemoOrphans();
    },
  };
}

export interface RideTrace {
  rideId: string;
  riderId: string;
  driverId?: string;
}

export async function createMatchingRide(input: {
  riderId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  pickupAddress?: string;
  dropoffAddress?: string;
}): Promise<RideTrace> {
  const sb = admin();
  const { data, error } = await sb
    .from("rides")
    .insert({
      rider_id: input.riderId,
      pickup_address: input.pickupAddress ?? "Pickup",
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      dropoff_address: input.dropoffAddress ?? "Dropoff",
      dropoff_lat: input.dropoffLat,
      dropoff_lng: input.dropoffLng,
      fare_estimate: 22.5,
      estimated_duration_min: 18,
      distance_miles: 5,
      status: "matching",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`createMatchingRide: ${error?.message}`);
  }
  return { rideId: data.id as string, riderId: input.riderId };
}

export async function setRideStatus(
  rideId: string,
  status:
    | "matching"
    | "driver_en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled",
  patch: Partial<{
    driver_id: string;
    matched_at: string;
    driver_arrived_at: string;
    pickup_at: string;
    completed_at: string;
    fare_final: number;
  }> = {},
): Promise<void> {
  const sb = admin();
  await sb.from("rides").update({ status, ...patch }).eq("id", rideId);
  await sb.from("ride_status_history").insert({
    ride_id: rideId,
    new_status: status,
    change_source: "demo",
    change_reason: `demo transition to ${status}`,
  });
}

export async function setDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const sb = admin();
  await sb.from("driver_locations").upsert(
    {
      driver_id: driverId,
      lat,
      lng,
      source: "simulated",
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "driver_id" },
  );
}
