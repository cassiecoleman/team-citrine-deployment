"use server";

import {
  createServiceRoleClient,
  createServerAuthClient,
} from "@/lib/supabase-server";
import type { AdminDriverFlag } from "./types";
import {
  mapFlagRowsToAdminFlags,
  applyAdminFlagFilters,
  type AdminFlagsQuery,
} from "./flags-helpers";

async function requireAdminRole(): Promise<string> {
  const authClient = await createServerAuthClient();
  const { data: authData, error: authError } = await authClient.auth.getUser();

  if (authError || !authData?.user) {
    throw new Error("Unauthorized");
  }

  const serviceClient = createServiceRoleClient();
  const { data: roleData, error: roleError } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .is("deleted_at", null)
    .single();

  if (roleError || roleData?.role !== "admin") {
    throw new Error("Forbidden");
  }

  return authData.user.id;
}

export async function fetchAdminFlags(
  query: AdminFlagsQuery = {},
): Promise<AdminDriverFlag[]> {
  await requireAdminRole();

  const supabase = createServiceRoleClient();

  const { data: flagRows, error: flagError } = await supabase
    .from("driver_flags")
    .select(
      "id,driver_id,reporter_id,ride_id,reason,details,status,admin_notes,reviewed_at,created_at",
    )
    .order("created_at", { ascending: false });

  if (flagError || !flagRows) {
    return [];
  }

  // Fetch driver names
  const driverIds = [...new Set(flagRows.map((r) => r.driver_id))];
  const driversById = new Map<string, string>();
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id,name")
      .in("id", driverIds);
    drivers?.forEach((d) => driversById.set(d.id, d.name));
  }

  // Fetch reporter (rider) names
  const reporterIds = [...new Set(flagRows.map((r) => r.reporter_id))];
  const ridersById = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: riders } = await supabase
      .from("riders")
      .select("id,name")
      .in("id", reporterIds);
    riders?.forEach((r) => ridersById.set(r.id, r.name));
  }

  const flags = mapFlagRowsToAdminFlags(flagRows, driversById, ridersById);
  return applyAdminFlagFilters(flags, query);
}

export async function resolveDriverFlag(
  flagId: string,
  resolution: "resolved" | "dismissed",
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const adminUserId = await requireAdminRole();

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("driver_flags")
    .update({
      status: resolution,
      admin_notes: adminNotes ?? null,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      resolved_at: resolution === "resolved" ? new Date().toISOString() : null,
      updated_by: adminUserId,
    })
    .eq("id", flagId)
    .in("status", ["pending", "under_review"]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getDriverFlagHistory(
  driverId: string,
): Promise<AdminDriverFlag[]> {
  await requireAdminRole();

  const supabase = createServiceRoleClient();

  const { data: flagRows, error } = await supabase
    .from("driver_flags")
    .select(
      "id,driver_id,reporter_id,ride_id,reason,details,status,admin_notes,reviewed_at,created_at",
    )
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false });

  if (error || !flagRows) {
    return [];
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id,name")
    .eq("id", driverId)
    .single();

  const driversById = new Map<string, string>();
  if (driver) driversById.set(driver.id, driver.name);

  const reporterIds = [...new Set(flagRows.map((r) => r.reporter_id))];
  const ridersById = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: riders } = await supabase
      .from("riders")
      .select("id,name")
      .in("id", reporterIds);
    riders?.forEach((r) => ridersById.set(r.id, r.name));
  }

  return mapFlagRowsToAdminFlags(flagRows, driversById, ridersById);
}
