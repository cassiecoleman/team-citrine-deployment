import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { Location } from "@/types";
import { createServiceRoleClient } from "@/lib/supabase-server";
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

export type RideActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface RideActionResponse {
  id: string;
  status: string;
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
      pickup_lat: input.pickup.lat,
      pickup_lng: input.pickup.lng,
      pickup_address: input.pickup.address,
      dropoff_lat: input.dropoff.lat,
      dropoff_lng: input.dropoff.lng,
      dropoff_address: input.dropoff.address,
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
