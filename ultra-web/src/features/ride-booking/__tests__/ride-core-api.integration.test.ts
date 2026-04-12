// @vitest-environment node

import { afterAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { acceptTrip, confirmPickup, rejectTrip } from "@/features/driver-trips/actions";
import { cancelRide, getRideById } from "@/features/ride-scheduling/actions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv =
  Boolean(supabaseUrl) &&
  Boolean(serviceRoleKey) &&
  !String(supabaseUrl).includes("your-project-ref") &&
  !String(serviceRoleKey).includes("your-service-role-key");

const runIntegration =
  hasSupabaseEnv && process.env.RUN_SUPABASE_INTEGRATION === "true"
    ? describe
    : describe.skip;

const supabase = createClient(supabaseUrl ?? "", serviceRoleKey ?? "");

const uid = Date.now();
const authUserIds: string[] = [];
const createdIds: { table: string; id: string }[] = [];

async function createAuthUser(prefix: string): Promise<string> {
  const email = `${prefix}-${uid}-${Math.random().toString(36).slice(2, 8)}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create auth user: ${error?.message ?? "unknown error"}`);
  }

  authUserIds.push(data.user.id);
  return data.user.id;
}

async function createRider(prefix: string) {
  const userId = await createAuthUser(`${prefix}-rider`);
  const { data, error } = await supabase
    .from("riders")
    .insert({ user_id: userId, name: `${prefix} rider` })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create rider: ${error?.message ?? "unknown error"}`);
  }

  createdIds.push({ table: "riders", id: data.id });
  return { userId, riderId: data.id };
}

async function createDriver(prefix: string) {
  const userId = await createAuthUser(`${prefix}-driver`);
  const { data, error } = await supabase
    .from("drivers")
    .insert({ user_id: userId, name: `${prefix} driver`, status: "available" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create driver: ${error?.message ?? "unknown error"}`);
  }

  createdIds.push({ table: "drivers", id: data.id });
  return { userId, driverId: data.id };
}

async function createRideForRider(
  riderId: string,
  status: string,
  driverId?: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("rides")
    .insert({
      rider_id: riderId,
      driver_id: driverId ?? null,
      pickup_lat: 35.1495,
      pickup_lng: -90.049,
      pickup_address: "123 Beale St, Memphis, TN",
      dropoff_lat: 35.1174,
      dropoff_lng: -89.9711,
      dropoff_address: "456 Elvis Presley Blvd, Memphis, TN",
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ride: ${error?.message ?? "unknown error"}`);
  }

  createdIds.push({ table: "rides", id: data.id });
  return data.id;
}

afterAll(async () => {
  for (const { table, id } of createdIds.reverse()) {
    await supabase.from(table).delete().eq("id", id);
  }

  for (const authUserId of authUserIds.reverse()) {
    await supabase.auth.admin.deleteUser(authUserId);
  }
});

runIntegration("ride core API integration", () => {
  it("prevents riders from fetching rides they do not own", async () => {
    const owner = await createRider("ride-owner");
    const otherRider = await createRider("ride-other");
    const rideId = await createRideForRider(owner.riderId, "requested");

    const result = await getRideById(rideId, otherRider.userId);

    expect(result).toEqual({
      success: false,
      error: "You can only access your own rides.",
    });
  });

  it("prevents riders from cancelling rides they do not own", async () => {
    const owner = await createRider("cancel-owner");
    const otherRider = await createRider("cancel-other");
    const rideId = await createRideForRider(owner.riderId, "requested");

    const result = await cancelRide(rideId, "Not my ride", otherRider.userId);

    expect(result).toEqual({
      success: false,
      error: "You can only cancel your own rides.",
    });
  });

  it("prevents pickup confirmation for unassigned drivers", async () => {
    const rider = await createRider("pickup-rider");
    const driver = await createDriver("pickup-driver");
    const rideId = await createRideForRider(rider.riderId, "driver_en_route");

    const result = await confirmPickup({
      rideId,
      driverUserId: driver.userId,
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not assigned to this driver.",
    });
  });

  it("rejects trip rejection from invalid statuses", async () => {
    const rider = await createRider("reject-rider");
    const driver = await createDriver("reject-driver");
    const rideId = await createRideForRider(rider.riderId, "completed", driver.driverId);

    const result = await rejectTrip({
      rideId,
      driverUserId: driver.userId,
      reason: "Late update",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip cannot be rejected from its current status.",
    });
  });

  it("allows only one driver to accept a matching trip", async () => {
    const rider = await createRider("accept-rider");
    const firstDriver = await createDriver("accept-first");
    const secondDriver = await createDriver("accept-second");
    const rideId = await createRideForRider(rider.riderId, "matching");

    const firstResult = await acceptTrip({
      rideId,
      driverUserId: firstDriver.userId,
    });
    expect(firstResult.success).toBe(true);

    const secondResult = await acceptTrip({
      rideId,
      driverUserId: secondDriver.userId,
    });

    expect(secondResult.success).toBe(false);
    if (!secondResult.success) {
      expect(secondResult.error).toMatch(/Trip is not available|Trip was already taken/);
    }
  });
});
