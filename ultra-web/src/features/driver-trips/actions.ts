import { mockDelay } from "@/lib/mock-delay";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import type {
  ActiveDriverTrip,
  DriverShiftSummary,
  TripAssignment,
} from "./types";

const shiftSummary: DriverShiftSummary = {
  driverName: "Marcus W.",
  status: "online",
  shiftWindow: "7:00 AM - 3:00 PM",
  acceptanceRate: 96,
  completionRate: 99,
  todayTrips: 8,
  earningsToday: 142.5,
  activeTripId: "trip-204",
  pendingQueueCount: 3,
  nextBreakLabel: "Break window opens after 2 more trips",
};

const queuedTrip: TripAssignment = {
  id: "trip-204",
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
  id: "trip-204",
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

export async function getDriverShiftSummary(): Promise<DriverShiftSummary> {
  await mockDelay();
  return shiftSummary;
}

export async function getQueuedTrip(): Promise<TripAssignment> {
  await mockDelay();
  return queuedTrip;
}

export async function getActiveDriverTrip(id: string): Promise<ActiveDriverTrip> {
  await mockDelay();
  return { ...activeTrip, id };
}

const acceptTripSchema = z.object({
  rideId: z.string().min(1),
  driverUserId: z.string().min(1),
});

const rejectTripSchema = acceptTripSchema.extend({
  reason: z.string().min(1).optional(),
});

const completeTripSchema = acceptTripSchema.extend({
  fareFinal: z.number().nonnegative(),
});

const toggleAvailabilitySchema = z.object({
  driverUserId: z.string().min(1),
  nextStatus: z.enum(["available", "offline"]),
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

  const rideResult = await supabase
    .from("rides")
    .update({
      status: "driver_en_route",
      driver_id: driverResult.data.id,
      matched_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.rideId)
    .select("id,status,driver_id")
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Unable to accept this trip right now." };
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

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: "matching",
    },
  };
}

export async function confirmPickup(input: {
  rideId: string;
  driverUserId: string;
}): Promise<
  | { success: true; data: { id: string; status: "in_progress" } }
  | { success: false; error: string }
> {
  const parsed = acceptTripSchema.safeParse(input);
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
