"use server";

import {
  getDemoQueueRideId,
  setDemoRideStatus,
} from "@/lib/demo-ride-state";
import { mockDelay } from "@/lib/mock-delay";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import type {
  ActiveDriverTrip,
  DriverShiftSummary,
  TripAssignment,
} from "./types";

type RideActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const shiftSummary: DriverShiftSummary = {
  driverName: "Marcus W.",
  status: "online",
  shiftWindow: "7:00 AM - 3:00 PM",
  acceptanceRate: 96,
  completionRate: 99,
  todayTrips: 8,
  earningsToday: 142.5,
  activeTripId: "new-ride",
  pendingQueueCount: 3,
  nextBreakLabel: "Break window opens after 2 more trips",
};

const queuedTrip: TripAssignment = {
  id: "new-ride",
  riderName: "Aisha R.",
  pickupLabel: "Community Clinic",
  pickupAddress: "1150 West End Ave",
  dropoffLabel: "Metro General Hospital",
  dropoffAddress: "245 River Pkwy",
  offeredFare: 24.75,
  estimatedTripTimeMin: 26,
  mileageMi: 7.4,
  pickupEtaMin: 5,
  note: "Rider requested curbside pickup by the blue awning.",
  urgencyLabel: "Medical appointment",
  accessibilityNotes: [
    "Rider prefers the side door nearest the blue awning",
    "Allow extra trunk room for a folded walker",
  ],
};

const activeTrip: ActiveDriverTrip = {
  id: "new-ride",
  riderName: "Aisha R.",
  riderRating: 4.8,
  pickupLabel: queuedTrip.pickupLabel,
  pickupAddress: queuedTrip.pickupAddress,
  dropoffLabel: queuedTrip.dropoffLabel,
  dropoffAddress: queuedTrip.dropoffAddress,
  offeredFare: queuedTrip.offeredFare,
  mileageMi: queuedTrip.mileageMi,
  pickupEtaMin: queuedTrip.pickupEtaMin,
  routeProgressLabel: "2 turns away from pickup",
  vehicleChecklist: [
    "Hazards ready for curb pickup",
    "Back seat clear for rider belongings",
    "App PIN ready for verbal confirmation",
  ],
  pickupCode: "4821",
  riderPhone: "(555) 014-2048",
  accessibilityNotes: queuedTrip.accessibilityNotes,
  nextTurn: "Turn right on River Pkwy in 0.4 mi",
  destinationEtaMin: 18,
};

export async function getRuntimeDriverUserId(
  driverUserId?: string,
): Promise<string | undefined> {
  // 1. Explicit parameter or env var
  const configuredDriverUserId = resolveConfiguredDriverUserId(driverUserId);
  if (configuredDriverUserId) {
    return configuredDriverUserId;
  }

  // 2. Try logged-in session
  try {
    const authClient = await createServerAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      // Verify this user is actually a driver
      const supabase = createServiceRoleClient();
      const { data: driver } = await supabase
        .from("drivers")
        .select("user_id")
        .eq("user_id", user.id)
        .single();
      if (driver) {
        return user.id;
      }
    }
  } catch {
    // Session not available (e.g. no cookies in this context)
  }

  // 3. Fallback: first driver in DB (dev convenience)
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasSupabaseConfig) {
    return undefined;
  }

  const supabase = createServiceRoleClient();
  const fallbackDriverResult = await supabase
    .from("drivers")
    .select("user_id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (fallbackDriverResult.error || !fallbackDriverResult.data?.length) {
    return undefined;
  }

  return fallbackDriverResult.data[0]?.user_id ?? undefined;
}

function resolveConfiguredDriverUserId(driverUserId?: string): string | undefined {
  return (
    driverUserId ??
    process.env.ULTRA_DEFAULT_DRIVER_USER_ID ??
    process.env.ULTRA_DEFAULT_USER_ID
  );
}

export async function getDriverShiftSummary(
  driverUserId?: string,
): Promise<DriverShiftSummary> {
  const resolvedUserId = driverUserId ?? resolveConfiguredDriverUserId();
  if (!resolvedUserId) {
    await mockDelay();
    return shiftSummary;
  }

  const statusResult = await getDriverStatus(resolvedUserId);
  if (!statusResult.success) {
    await mockDelay();
    return shiftSummary;
  }

  const assignedTripsResult = await getMatchingQueue(resolvedUserId);
  const pendingQueueCount = assignedTripsResult.success ? assignedTripsResult.data.length : 0;

  return {
    ...shiftSummary,
    driverName: statusResult.data.driverName,
    status: statusResult.data.status === "offline" ? "offline" : "online",
    activeTripId: statusResult.data.activeTripId ?? shiftSummary.activeTripId,
    pendingQueueCount,
  };
}

export async function getQueuedTrip(driverUserId?: string): Promise<TripAssignment | null> {
  const resolvedUserId = driverUserId ?? resolveConfiguredDriverUserId();

  if (resolvedUserId) {
    const assignedTripsResult = await getMatchingQueue(resolvedUserId);
    if (assignedTripsResult.success && assignedTripsResult.data.length > 0) {
      return assignedTripsResult.data[0];
    }
  }

  // Check demo state as fallback
  const demoQueueRideId = await getDemoQueueRideId();
  if (demoQueueRideId) {
    await mockDelay();
    return { ...queuedTrip, id: demoQueueRideId };
  }

  // No real rides and no demo state — return null for empty queue
  if (resolvedUserId) {
    return null;
  }

  // No auth at all — return mock for dev
  await mockDelay();
  return queuedTrip;
}

export async function getActiveDriverTrip(
  id: string,
  driverUserId?: string,
): Promise<ActiveDriverTrip> {
  const resolvedUserId = driverUserId ?? resolveConfiguredDriverUserId();
  if (!resolvedUserId) {
    await mockDelay();
    return { ...activeTrip, id };
  }

  const supabase = createServiceRoleClient();
  const rideResult = await supabase
    .from("rides")
    .select(
      "id,pickup_address,pickup_lat,pickup_lng,dropoff_address,dropoff_lat,dropoff_lng,fare_estimate,distance_miles,driver_id,riders(name,phone)",
    )
    .eq("id", id)
    .maybeSingle();

  if (rideResult.error || !rideResult.data) {
    await mockDelay();
    return { ...activeTrip, id };
  }

  const riderName =
    Array.isArray(rideResult.data.riders) && rideResult.data.riders[0]?.name
      ? rideResult.data.riders[0].name
      : !Array.isArray(rideResult.data.riders) && rideResult.data.riders?.name
        ? rideResult.data.riders.name
        : activeTrip.riderName;
  const riderPhone =
    Array.isArray(rideResult.data.riders) && rideResult.data.riders[0]?.phone
      ? rideResult.data.riders[0].phone
      : !Array.isArray(rideResult.data.riders) && rideResult.data.riders?.phone
        ? rideResult.data.riders.phone
        : activeTrip.riderPhone;

  let driverLat: number | undefined;
  let driverLng: number | undefined;
  if (rideResult.data.driver_id) {
    const { data: locRow } = await supabase
      .from("driver_locations")
      .select("lat,lng")
      .eq("driver_id", rideResult.data.driver_id)
      .maybeSingle();
    if (locRow) {
      driverLat = Number(locRow.lat);
      driverLng = Number(locRow.lng);
    }
  }

  return {
    ...activeTrip,
    id: rideResult.data.id,
    riderName,
    pickupAddress: rideResult.data.pickup_address,
    pickupLat: Number(rideResult.data.pickup_lat),
    pickupLng: Number(rideResult.data.pickup_lng),
    dropoffAddress: rideResult.data.dropoff_address,
    dropoffLat: Number(rideResult.data.dropoff_lat),
    dropoffLng: Number(rideResult.data.dropoff_lng),
    driverLat,
    driverLng,
    offeredFare: rideResult.data.fare_estimate ?? activeTrip.offeredFare,
    mileageMi: rideResult.data.distance_miles ?? activeTrip.mileageMi,
    riderPhone: riderPhone ?? activeTrip.riderPhone,
  };
}

const acceptTripSchema = z.object({
  rideId: z.string().min(1),
  driverUserId: z.string().min(1),
});

const rejectTripSchema = acceptTripSchema.extend({
  reason: z.string().min(1).optional(),
});

const confirmPickupSchema = z.object({
  rideId: z.string().min(1),
  driverUserId: z.string().min(1),
});

const completeTripSchema = acceptTripSchema.extend({
  fareFinal: z.number().nonnegative(),
});

const toggleAvailabilitySchema = z.object({
  driverUserId: z.string().min(1),
  nextStatus: z.enum(["available", "offline"]),
});

const updateDriverLocationSchema = z.object({
  driverUserId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  recordedAt: z.string().datetime().optional(),
});

export async function acceptTrip(input: {
  rideId: string;
  driverUserId: string;
}): Promise<
  | { success: true; data: { id: string; status: "driver_en_route"; driverId: string } }
  | { success: false; error: string }
> {
  const parsed = acceptTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid trip acceptance request." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  // Prevent the same driver from accepting more than one active ride at a
  // time. Any ride already assigned to them in an in-progress status
  // (driver_en_route, arrived, in_progress) blocks further accepts.
  const busyRideResult = await supabase
    .from("rides")
    .select("id")
    .eq("driver_id", driverResult.data.id)
    .in("status", ["driver_en_route", "arrived", "in_progress"])
    .maybeSingle();

  if (busyRideResult.data) {
    return {
      success: false,
      error: "You already have an active trip. Complete it before accepting another.",
    };
  }

  const currentRideResult = await supabase
    .from("rides")
    .select("id,status,version")
    .eq("id", parsed.data.rideId)
    .single();

  if (currentRideResult.error || !currentRideResult.data) {
    return { success: false, error: "Unable to find the trip to accept." };
  }

  if (currentRideResult.data.status !== "matching") {
    return { success: false, error: "Trip is not available to accept." };
  }

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "driver_en_route",
      driver_id: driverResult.data.id,
      matched_at: new Date().toISOString(),
      version: currentRideResult.data.version + 1,
    })
    .eq("id", parsed.data.rideId)
    .eq("version", currentRideResult.data.version)
    .eq("status", "matching")
    .select("id,status,driver_id")
    .maybeSingle();

  if (rideResult.error) {
    return { success: false, error: "Unable to accept this trip right now." };
  }

  if (!rideResult.data) {
    return { success: false, error: "Trip was already taken." };
  }

  const historyResult = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: currentRideResult.data.status,
    to_status: "driver_en_route",
    changed_by: parsed.data.driverUserId,
    change_source: "driver",
    change_reason: "Trip accepted by driver",
  });

  if (historyResult.error) {
    return { success: false, error: "Unable to record trip status history." };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: "driver_en_route",
      driverId: rideResult.data.driver_id ?? driverResult.data.id,
    },
  };
}

export async function setDemoRideStatusForDriverFlow(input: {
  rideId: string;
  status: "driver_en_route" | "in_progress";
}): Promise<void> {
  await setDemoRideStatus(input.rideId, input.status);
}

export async function rejectTrip(input: {
  rideId: string;
  driverUserId: string;
  reason?: string;
}): Promise<
  | { success: true; data: { id: string; status: "matching" } }
  | { success: false; error: string }
> {
  const parsed = rejectTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid trip rejection request." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const currentRideResult = await supabase
    .from("rides")
    .select("id,status,driver_id")
    .eq("id", parsed.data.rideId)
    .single();

  if (currentRideResult.error || !currentRideResult.data) {
    return { success: false, error: "Unable to find the trip to reject." };
  }

  if (currentRideResult.data.driver_id !== driverResult.data.id) {
    return { success: false, error: "Trip is not assigned to this driver." };
  }

  if (
    currentRideResult.data.status !== "driver_en_route" &&
    currentRideResult.data.status !== "matching"
  ) {
    return {
      success: false,
      error: "Trip cannot be rejected from its current status.",
    };
  }

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "matching",
      driver_id: null,
    })
    .eq("id", parsed.data.rideId)
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Unable to reject this trip right now." };
  }

  const historyResult = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: currentRideResult.data.status,
    to_status: "matching",
    changed_by: parsed.data.driverUserId,
    change_source: "driver",
    change_reason: parsed.data.reason ?? "Trip rejected by driver",
  });

  if (historyResult.error) {
    return { success: false, error: "Unable to record trip status history." };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: "matching",
    },
  };
}

export async function arriveAtPickup(input: {
  rideId: string;
  driverUserId: string;
}): Promise<
  | { success: true; data: { id: string; status: "arrived" } }
  | { success: false; error: string }
> {
  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", input.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "arrived",
      driver_arrived_at: new Date().toISOString(),
    })
    .eq("id", input.rideId)
    .eq("driver_id", driverResult.data.id)
    .eq("status", "driver_en_route")
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Unable to mark arrival — ride may not be en route." };
  }

  await supabase.from("ride_status_history").insert({
    ride_id: input.rideId,
    from_status: "driver_en_route",
    to_status: "arrived",
    changed_by: input.driverUserId,
    change_source: "driver",
    change_reason: "Driver arrived at pickup (simulated)",
  });

  return { success: true, data: { id: rideResult.data.id, status: "arrived" } };
}

export async function confirmPickup(input: {
  rideId: string;
  driverUserId: string;
}): Promise<
  | { success: true; data: { id: string; status: "in_progress" } }
  | { success: false; error: string }
> {
  const parsed = confirmPickupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid pickup confirmation request." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const currentRideResult = await supabase
    .from("rides")
    .select("id,status,driver_id")
    .eq("id", parsed.data.rideId)
    .single();

  if (currentRideResult.error || !currentRideResult.data) {
    return { success: false, error: "Unable to find the trip to confirm pickup." };
  }

  if (currentRideResult.data.driver_id !== driverResult.data.id) {
    return { success: false, error: "Trip is not assigned to this driver." };
  }

  if (
    currentRideResult.data.status !== "driver_en_route" &&
    currentRideResult.data.status !== "arrived"
  ) {
    return { success: false, error: "Trip must be en route or arrived." };
  }

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "in_progress",
      pickup_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.rideId)
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Unable to confirm pickup right now." };
  }

  const historyResult = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: currentRideResult.data.status,
    to_status: "in_progress",
    changed_by: parsed.data.driverUserId,
    change_source: "driver",
    change_reason: "Pickup confirmed by driver",
  });

  if (historyResult.error) {
    return { success: false, error: "Unable to record trip status history." };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: "in_progress",
    },
  };
}

export async function completeTrip(input: {
  rideId: string;
  driverUserId: string;
  fareFinal: number;
}): Promise<
  | { success: true; data: { id: string; status: "completed"; fareFinal: number } }
  | { success: false; error: string }
> {
  const parsed = completeTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid trip completion request." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const currentRideResult = await supabase
    .from("rides")
    .select("id,status,driver_id")
    .eq("id", parsed.data.rideId)
    .single();

  if (currentRideResult.error || !currentRideResult.data) {
    return { success: false, error: "Unable to find the trip to complete." };
  }

  if (currentRideResult.data.driver_id !== driverResult.data.id) {
    return { success: false, error: "Trip is not assigned to this driver." };
  }

  if (currentRideResult.data.status !== "in_progress") {
    return { success: false, error: "Trip is not in progress." };
  }

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "completed",
      fare_final: parsed.data.fareFinal,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.rideId)
    .select("id,status,fare_final")
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Unable to complete this trip right now." };
  }

  const historyResult = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: currentRideResult.data.status,
    to_status: "completed",
    changed_by: parsed.data.driverUserId,
    change_source: "driver",
    change_reason: "Trip completed by driver",
  });

  if (historyResult.error) {
    return { success: false, error: "Unable to record trip status history." };
  }

  await supabase
    .from("drivers")
    .update({
      status: "available",
    })
    .eq("id", driverResult.data.id);

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: "completed",
      fareFinal: rideResult.data.fare_final ?? parsed.data.fareFinal,
    },
  };
}

export async function getDriverStatus(
  driverUserId: string,
): Promise<
  | {
      success: true;
      data: {
        driverId: string;
        driverName: string;
        status: string;
        activeTripId: string | null;
      };
    }
  | { success: false; error: string }
> {
  if (!driverUserId) {
    return { success: false, error: "Driver user id is required." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id,name,status")
    .eq("user_id", driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const activeTripResult = await supabase
    .from("rides")
    .select("id,status")
    .eq("driver_id", driverResult.data.id)
    .in("status", ["driver_en_route", "arrived", "in_progress"])
    .maybeSingle();

  return {
    success: true,
    data: {
      driverId: driverResult.data.id,
      driverName: driverResult.data.name,
      status: driverResult.data.status,
      activeTripId: activeTripResult.data?.id ?? null,
    },
  };
}

export async function toggleDriverAvailability(input: {
  driverUserId: string;
  nextStatus: "available" | "offline";
}): Promise<
  | { success: true; data: { driverId: string; status: "available" | "offline" } }
  | { success: false; error: string }
> {
  const parsed = toggleAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid availability request." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id,status")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  await supabase
    .from("drivers")
    .update({
      status: parsed.data.nextStatus,
    })
    .eq("id", driverResult.data.id);

  return {
    success: true,
    data: {
      driverId: driverResult.data.id,
      status: parsed.data.nextStatus,
    },
  };
}

export async function updateDriverLocation(input: {
  driverUserId: string;
  lat: number;
  lng: number;
  heading?: number;
  recordedAt?: string;
}): Promise<
  | {
      success: true;
      data: {
        driverId: string;
        lat: number;
        lng: number;
        heading: number | null;
        recordedAt: string;
        throttled: boolean;
      };
    }
  | { success: false; error: string }
> {
  const parsed = updateDriverLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid driver location payload." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", parsed.data.driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const nextRecordedAt = parsed.data.recordedAt ?? new Date().toISOString();
  const latestLocationResult = await supabase
    .from("driver_locations")
    .select("recorded_at")
    .eq("driver_id", driverResult.data.id)
    .maybeSingle();

  const latestRecordedAt = latestLocationResult.data?.recorded_at;
  if (latestRecordedAt) {
    const elapsedMs =
      new Date(nextRecordedAt).getTime() - new Date(latestRecordedAt).getTime();
    if (elapsedMs < 3000) {
      return {
        success: true,
        data: {
          driverId: driverResult.data.id,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          heading: parsed.data.heading ?? null,
          recordedAt: nextRecordedAt,
          throttled: true,
        },
      };
    }
  }

  const upsertResult = await supabase
    .from("driver_locations")
    .upsert(
      {
        driver_id: driverResult.data.id,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        heading: parsed.data.heading ?? null,
        recorded_at: nextRecordedAt,
      },
      { onConflict: "driver_id" },
    )
    .select("driver_id,lat,lng,heading,recorded_at")
    .single();

  if (upsertResult.error || !upsertResult.data) {
    return { success: false, error: "Unable to update driver location." };
  }

  return {
    success: true,
    data: {
      driverId: upsertResult.data.driver_id,
      lat: upsertResult.data.lat,
      lng: upsertResult.data.lng,
      heading: upsertResult.data.heading,
      recordedAt: upsertResult.data.recorded_at,
      throttled: false,
    },
  };
}

export async function getMatchingQueue(
  driverUserId: string,
): Promise<RideActionResult<TripAssignment[]>> {
  if (!driverUserId) {
    return { success: false, error: "Driver user id is required." };
  }

  const supabase = createServiceRoleClient();
  const driverResult = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", driverUserId)
    .single();

  if (driverResult.error || !driverResult.data) {
    return { success: false, error: "Driver account was not found." };
  }

  const ridesResult = await supabase
    .from("rides")
    .select(
      "id,pickup_address,dropoff_address,fare_estimate,estimated_duration_min,distance_miles,riders(name)",
    )
    .eq("status", "matching")
    .order("requested_at", { ascending: true });

  if (ridesResult.error || !ridesResult.data) {
    return { success: false, error: "Unable to load assigned trips right now." };
  }

  return {
    success: true,
    data: ridesResult.data.map((ride) => {
      const riderName =
        Array.isArray(ride.riders) && ride.riders[0]?.name
          ? ride.riders[0].name
          : !Array.isArray(ride.riders) && ride.riders?.name
            ? ride.riders.name
            : "Rider";

      return {
        id: ride.id,
        riderName,
        pickupLabel: "Pickup",
        pickupAddress: ride.pickup_address,
        dropoffLabel: "Dropoff",
        dropoffAddress: ride.dropoff_address,
        offeredFare: ride.fare_estimate ?? 0,
        estimatedTripTimeMin: ride.estimated_duration_min ?? 0,
        mileageMi: ride.distance_miles ?? 0,
        pickupEtaMin: 5,
        note: "Driver assignment pending confirmation.",
        urgencyLabel: "Standard ride",
        accessibilityNotes: ["No additional accessibility notes."],
      };
    }),
  };
}

export async function getAssignedTrips(
  driverUserId: string,
): Promise<RideActionResult<TripAssignment[]>> {
  return getMatchingQueue(driverUserId);
}
