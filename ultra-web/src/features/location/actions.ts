"use server";

import { z } from "zod";

import { geocodeAddress } from "@/lib/geo";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";

export type LocationActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface LiveLocationsResult {
  riders: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    updatedAt: string | null;
  }>;
  drivers: Array<{
    id: string;
    name: string;
    status: string;
    lat: number;
    lng: number;
    updatedAt: string | null;
  }>;
  activeRides: Array<{
    id: string;
    riderId: string;
    driverId: string | null;
    status: string;
  }>;
}

const updateLocationSchema = z
  .object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    address: z.string().trim().min(3).optional(),
  })
  .refine(
    (input) =>
      input.address !== undefined ||
      (input.lat !== undefined && input.lng !== undefined),
    { message: "Provide either an address or both lat and lng." },
  );

export async function updateMyLocation(
  input: { lat?: number; lng?: number; address?: string },
  userId: string,
): Promise<LocationActionResult<{ lat: number; lng: number; updatedAt: string }>> {
  const parsed = updateLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid location input.",
    };
  }

  let lat = parsed.data.lat;
  let lng = parsed.data.lng;

  if (lat === undefined || lng === undefined) {
    const address = parsed.data.address!;
    const hit = await geocodeAddress(address);
    if (!hit) {
      return {
        success: false,
        error: `Could not find coordinates for "${address}".`,
      };
    }
    lat = hit.lat;
    lng = hit.lng;
  }

  const supabase = createServiceRoleClient();
  const role = await resolveRole(supabase, userId);
  if (!role) {
    return { success: false, error: "User has no role assigned." };
  }

  const updatedAt = new Date().toISOString();

  if (role === "rider") {
    const rider = await supabase
      .from("riders")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (rider.error || !rider.data) {
      return { success: false, error: "Rider record not found." };
    }
    const update = await supabase
      .from("riders")
      .update({
        current_lat: lat,
        current_lng: lng,
        current_location_updated_at: updatedAt,
      })
      .eq("id", rider.data.id);
    if (update.error) {
      return { success: false, error: update.error.message };
    }
    return { success: true, data: { lat, lng, updatedAt } };
  }

  if (role === "driver") {
    const driver = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (driver.error || !driver.data) {
      return { success: false, error: "Driver record not found." };
    }
    const upsert = await supabase
      .from("driver_locations")
      .upsert(
        {
          driver_id: driver.data.id,
          lat,
          lng,
          source: "manual",
          recorded_at: updatedAt,
        },
        { onConflict: "driver_id" },
      );
    if (upsert.error) {
      return { success: false, error: upsert.error.message };
    }
    return { success: true, data: { lat, lng, updatedAt } };
  }

  return {
    success: false,
    error: `Role ${role} cannot have a current location.`,
  };
}

export async function getActiveLiveLocations(
  userId: string,
): Promise<LocationActionResult<LiveLocationsResult>> {
  const supabase = createServiceRoleClient();
  const role = await resolveRole(supabase, userId);
  if (role !== "admin") {
    return { success: false, error: "Admin role required." };
  }

  const ridersResp = await supabase
    .from("riders")
    .select("id, name, current_lat, current_lng, current_location_updated_at")
    .not("current_lat", "is", null)
    .not("current_lng", "is", null);
  if (ridersResp.error) {
    return { success: false, error: ridersResp.error.message };
  }

  const driversResp = await supabase
    .from("driver_locations")
    .select(
      "driver_id, lat, lng, recorded_at, drivers!inner(id, name, status)",
    );
  if (driversResp.error) {
    return { success: false, error: driversResp.error.message };
  }

  const ridesResp = await supabase
    .from("rides")
    .select("id, rider_id, driver_id, status")
    .in("status", ["matching", "driver_en_route", "arrived", "in_progress"]);

  return {
    success: true,
    data: {
      activeRides: (ridesResp.data ?? []).map((r) => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        driverId: r.driver_id ? String(r.driver_id) : null,
        status: String(r.status),
      })),
      riders: (ridersResp.data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        lat: Number(row.current_lat),
        lng: Number(row.current_lng),
        updatedAt: row.current_location_updated_at as string | null,
      })),
      drivers: (driversResp.data ?? []).map((row) => {
        const drv = Array.isArray(row.drivers) ? row.drivers[0] : row.drivers;
        return {
          id: drv?.id ?? (row.driver_id as string),
          name: drv?.name ?? "",
          status: drv?.status ?? "",
          lat: Number(row.lat),
          lng: Number(row.lng),
          updatedAt: (row.recorded_at as string | null) ?? null,
        };
      }),
    },
  };
}

export interface SubmitLocationState {
  success: boolean;
  error: string | null;
  lat?: number;
  lng?: number;
  updatedAt?: string;
}

export async function submitMyLocation(
  _prev: SubmitLocationState,
  input: FormData | { lat?: number; lng?: number; address?: string },
): Promise<SubmitLocationState> {
  let payload: { lat?: number; lng?: number; address?: string };
  if (input instanceof FormData) {
    const address = (input.get("address") as string | null)?.trim() || undefined;
    const latRaw = (input.get("lat") as string | null)?.trim();
    const lngRaw = (input.get("lng") as string | null)?.trim();
    payload = {
      address,
      lat: latRaw ? Number(latRaw) : undefined,
      lng: lngRaw ? Number(lngRaw) : undefined,
    };
  } else {
    payload = input;
  }

  const auth = await createServerAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return { success: false, error: "Not signed in." };
  }

  const result = await updateMyLocation(payload, user.id);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return {
    success: true,
    error: null,
    lat: result.data.lat,
    lng: result.data.lng,
    updatedAt: result.data.updatedAt,
  };
}

async function resolveRole(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<"rider" | "driver" | "admin" | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.role as "rider" | "driver" | "admin";
}
