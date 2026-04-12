import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { Location } from "@/types";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import type { RiderProfile, ScheduledRide } from "./types";

export interface RideLocationInput {
  lat: number;
  lng: number;
  address: string;
}

export interface CreateRideInput {
  pickup: RideLocationInput;
  dropoff: RideLocationInput;
}

export interface ScheduleRideInput extends CreateRideInput {
  scheduledFor: string;
}

export interface RecurringRideInput extends ScheduleRideInput {
  recurrenceRule: string;
}

export type RideActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface RideActionResponse {
  id: string;
  status: string;
}

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(1),
});

const createRideSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
});

const scheduleRideSchema = createRideSchema.extend({
  scheduledFor: z.iso.datetime(),
});

const recurringRideSchema = scheduleRideSchema.extend({
  recurrenceRule: z.string().min(1),
});

const cancelRideSchema = z.object({
  rideId: z.string().uuid().or(z.string().min(1)),
  reason: z.string().min(1),
});

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});

function assertAuthenticatedUserId(userId: string): RideActionResult<never> | null {
  // Trust boundary: caller must pass an auth-derived user id (never client-provided raw input).
  if (!userId) {
    return { success: false, error: "You must be signed in to view rides." };
  }

  return null;
}

export async function getScheduleDefaults(): Promise<{
  pickup: Location;
  dropoff: Location;
  fare: number;
}> {
  await mockDelay();
  return {
    pickup: homeLocation,
    dropoff: hospitalLocation,
    fare: 12,
  };
}

export async function getRiderProfiles(): Promise<RiderProfile[]> {
  await mockDelay();
  return [
    { id: "rp-1", name: "Emma", age: 9, emergencyContact: "Rosa M." },
    { id: "rp-2", name: "Lucas", age: 6, emergencyContact: "Rosa M." },
  ];
}

export async function submitSchedule(
  schedule: ScheduledRide,
): Promise<{ success: boolean }> {
  await mockDelay(500, 1000);
  return { success: true };
}

export async function createRide(
  input: CreateRideInput,
  userId?: string,
): Promise<RideActionResult<RideActionResponse>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to request a ride." };
  }

  const parsed = createRideSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid ride request details." };
  }

  const supabase = createServiceRoleClient();

  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "No rider profile found for this account.",
    };
  }

  const rideResult = await supabase
    .from("rides")
    .insert({
      rider_id: riderResult.data.id,
      pickup_lat: parsed.data.pickup.lat,
      pickup_lng: parsed.data.pickup.lng,
      pickup_address: parsed.data.pickup.address,
      dropoff_lat: parsed.data.dropoff.lat,
      dropoff_lng: parsed.data.dropoff.lng,
      dropoff_address: parsed.data.dropoff.address,
      status: "requested",
    })
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return {
      success: false,
      error: "Unable to request a ride right now.",
    };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: rideResult.data.status,
    },
  };
}

export async function scheduleRide(
  input: ScheduleRideInput,
  userId?: string,
): Promise<RideActionResult<RideActionResponse>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to request a ride." };
  }

  const parsed = scheduleRideSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid ride request details." };
  }

  const scheduledFor = new Date(parsed.data.scheduledFor);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  if (scheduledFor > maxDate) {
    return { success: false, error: "Scheduled rides must be within the next 7 days." };
  }

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "No rider profile found for this account.",
    };
  }

  const rideResult = await supabase
    .from("rides")
    .insert({
      rider_id: riderResult.data.id,
      pickup_lat: parsed.data.pickup.lat,
      pickup_lng: parsed.data.pickup.lng,
      pickup_address: parsed.data.pickup.address,
      dropoff_lat: parsed.data.dropoff.lat,
      dropoff_lng: parsed.data.dropoff.lng,
      dropoff_address: parsed.data.dropoff.address,
      status: "requested",
      scheduled_for: scheduledFor.toISOString(),
    })
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return {
      success: false,
      error: "Unable to schedule a ride right now.",
    };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: rideResult.data.status,
    },
  };
}

export async function createRecurringRide(
  input: RecurringRideInput,
  userId?: string,
): Promise<RideActionResult<RideActionResponse>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to request a ride." };
  }

  const parsed = recurringRideSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid ride request details." };
  }

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "No rider profile found for this account.",
    };
  }

  const rideResult = await supabase
    .from("rides")
    .insert({
      rider_id: riderResult.data.id,
      pickup_lat: parsed.data.pickup.lat,
      pickup_lng: parsed.data.pickup.lng,
      pickup_address: parsed.data.pickup.address,
      dropoff_lat: parsed.data.dropoff.lat,
      dropoff_lng: parsed.data.dropoff.lng,
      dropoff_address: parsed.data.dropoff.address,
      status: "requested",
      scheduled_for: parsed.data.scheduledFor,
      is_recurring: true,
      recurrence_rule: parsed.data.recurrenceRule,
    })
    .select("id,status")
    .single();

  if (rideResult.error || !rideResult.data) {
    return {
      success: false,
      error: "Unable to schedule a recurring ride right now.",
    };
  }

  return {
    success: true,
    data: {
      id: rideResult.data.id,
      status: rideResult.data.status,
    },
  };
}

export async function cancelRide(
  rideId: string,
  reason: string,
  userId?: string,
): Promise<RideActionResult<{ id: string; status: string; refundStatus: "pending" }>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to cancel a ride." };
  }

  const parsed = cancelRideSchema.safeParse({ rideId, reason });
  if (!parsed.success) {
    return { success: false, error: "Invalid cancellation request." };
  }

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "Rider account was not found." };
  }

  const rideResult = await supabase
    .from("rides")
    .select("id,status,rider_id")
    .eq("id", parsed.data.rideId)
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Ride was not found." };
  }

  if (rideResult.data.rider_id !== riderResult.data.id) {
    return { success: false, error: "You can only cancel your own rides." };
  }

  if (rideResult.data.status === "completed" || rideResult.data.status === "cancelled") {
    return { success: false, error: "Completed or cancelled rides cannot be cancelled." };
  }

  const cancelResult = await supabase
    .from("rides")
    .update({
      status: "cancelled",
      cancel_reason: parsed.data.reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
    })
    .eq("id", parsed.data.rideId)
    .select("id,status")
    .single();

  if (cancelResult.error || !cancelResult.data) {
    return { success: false, error: "Unable to cancel this ride right now." };
  }

  const historyResult = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: rideResult.data.status,
    to_status: "cancelled",
    changed_by: userId,
    change_source: "rider",
    change_reason: parsed.data.reason,
  });

  if (historyResult.error) {
    return { success: false, error: "Unable to record ride cancellation history." };
  }

  return {
    success: true,
    data: {
      id: cancelResult.data.id,
      status: cancelResult.data.status,
      refundStatus: "pending",
    },
  };
}

type RideWithDriver = {
  id: string;
  status: string;
  rider_id: string;
  driver_id: string | null;
  drivers?: { id: string; name: string; status: string } | null;
};

export async function getRideById(
  rideId: string,
  userId?: string,
): Promise<RideActionResult<RideWithDriver>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to view rides." };
  }

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "Rider account was not found.",
    };
  }

  const rideResult = await supabase
    .from("rides")
    .select("id,status,rider_id,driver_id,drivers(id,name,status)")
    .eq("id", rideId)
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Ride not found." };
  }

  if (rideResult.data.rider_id !== riderResult.data.id) {
    return { success: false, error: "You can only access your own rides." };
  }

  return {
    success: true,
    data: rideResult.data as RideWithDriver,
  };
}

export async function getRidesForRider(
  userId: string,
  pagination: { page?: number; pageSize?: number } = {},
): Promise<RideActionResult<{ items: { id: string; status: string; requested_at: string }[]; page: number; pageSize: number }>> {
  const authCheck = assertAuthenticatedUserId(userId);
  if (authCheck) {
    return authCheck;
  }

  const parsedPagination = paginationSchema.safeParse(pagination);
  if (!parsedPagination.success) {
    return { success: false, error: "Invalid pagination options." };
  }

  const page = parsedPagination.data.page;
  const pageSize = parsedPagination.data.pageSize;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "No rider profile found for this account.",
    };
  }

  const ridesResult = await supabase
    .from("rides")
    .select("id,status,requested_at")
    .eq("rider_id", riderResult.data.id)
    .order("requested_at", { ascending: false })
    .range(start, end);

  if (ridesResult.error || !ridesResult.data) {
    return { success: false, error: "Unable to load rides right now." };
  }

  return {
    success: true,
    data: {
      items: ridesResult.data as { id: string; status: string; requested_at: string }[],
      page,
      pageSize,
    },
  };
}
