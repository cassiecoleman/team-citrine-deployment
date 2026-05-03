import { ensureDemoRide, getDemoRideStatus } from "@/lib/demo-ride-state";
import { getConfiguredDemoRideId, isDemoModeEnabled } from "@/lib/app-env";
import { homeLocation, hospitalLocation, mockDriver } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { RideDetail } from "./types";
import { normalizeRideStatus } from "./ride-status-adapter";

interface RideStatusRow {
  id: string;
  status: string;
  driver_id: string | null;
  drivers:
    | {
        id: string;
        name: string | null;
        rating: number | null;
        vehicle_make: string | null;
        vehicle_model: string | null;
        license_plate: string | null;
      }
    | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  fare_estimate: number | null;
  fare_final: number | null;
  distance_miles: number | null;
  estimated_duration_min: number | null;
  actual_duration_min: number | null;
}

function buildFallbackRide(id: string): RideDetail {
  return {
    id,
    pickup: homeLocation,
    dropoff: hospitalLocation,
    status: "matching",
    estimatedFare: 19.0,
    distanceMi: 5.1,
    durationMin: 18,
    driver: mockDriver,
    progressPercent: 0,
    distanceRemainingMi: 5.1,
    etaMin: 8,
  };
}

async function buildDemoFlowRide(id: string, fallbackRide: RideDetail): Promise<RideDetail> {
  await ensureDemoRide(id);
  const demoStatus = (await getDemoRideStatus(id)) ?? "matching";
  await mockDelay();
  return {
    ...fallbackRide,
    status: normalizeRideStatus(demoStatus),
  };
}

export async function getRideStatus(id: string): Promise<RideDetail> {
  const fallbackRide = buildFallbackRide(id);
  const fallbackDriver = fallbackRide.driver ?? mockDriver;
  const configuredDemoRideId = getConfiguredDemoRideId();
  const isConfiguredDemoRide = configuredDemoRideId === id;

  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Try real DB first when configured, except for the explicitly configured
  // demo ride which is allowed to stay scripted across demo environments.
  if (!hasSupabaseConfig || isConfiguredDemoRide) {
    return buildDemoFlowRide(id, fallbackRide);
  }

  const supabase = createServiceRoleClient();
  const rideResult = await supabase
    .from("rides")
    .select(
      "id,status,driver_id,pickup_lat,pickup_lng,pickup_address,dropoff_lat,dropoff_lng,dropoff_address,fare_estimate,fare_final,distance_miles,estimated_duration_min,actual_duration_min,drivers(id,name,rating,vehicle_make,vehicle_model,license_plate)",
    )
    .eq("id", id)
    .single();

  if (rideResult.error || !rideResult.data) {
    // Ride not in DB — keep the scripted fallback only for the configured
    // demo ride or for local/no-Supabase development.
    if (isConfiguredDemoRide || isDemoModeEnabled()) {
      return buildDemoFlowRide(id, fallbackRide);
    }
    return fallbackRide;
  }

  const row = rideResult.data as RideStatusRow;
  const status = normalizeRideStatus(row.status);
  const driverVehicle = [row.drivers?.vehicle_make, row.drivers?.vehicle_model]
    .filter(Boolean)
    .join(" ");

  return {
    id: row.id,
    pickup: {
      lat: row.pickup_lat,
      lng: row.pickup_lng,
      address: row.pickup_address,
    },
    dropoff: {
      lat: row.dropoff_lat,
      lng: row.dropoff_lng,
      address: row.dropoff_address,
    },
    status,
    estimatedFare: row.fare_final ?? row.fare_estimate ?? fallbackRide.estimatedFare,
    actualFare: row.fare_final ?? undefined,
    distanceMi: row.distance_miles ?? fallbackRide.distanceMi,
    durationMin:
      row.actual_duration_min ?? row.estimated_duration_min ?? fallbackRide.durationMin,
    driver: {
      id: row.driver_id ?? fallbackDriver.id,
      name: row.drivers?.name ?? fallbackDriver.name,
      rating: row.drivers?.rating ?? fallbackDriver.rating,
      vehicle: driverVehicle || fallbackDriver.vehicle,
      licensePlate: row.drivers?.license_plate ?? fallbackDriver.licensePlate,
      etaMinutes: fallbackDriver.etaMinutes,
    },
    progressPercent: status === "matching" ? 0 : fallbackRide.progressPercent,
    distanceRemainingMi: fallbackRide.distanceRemainingMi,
    etaMin: status === "arrived" ? 0 : fallbackRide.etaMin,
  };
}
