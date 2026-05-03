import { adminRequests, adminRides, adminCompletedRides } from "./constants";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";
import type { AdminDriver, AdminRequest, AdminRide, AdminCompletedRide, DateRange } from "./types";

async function requireAdminRole(): Promise<void> {
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
}

function formatLastActive(updatedAt: string): string {
  const elapsedMs = Date.now() - new Date(updatedAt).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return "just now";
  }

  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function fetchDrivers(): Promise<AdminDriver[]> {
  await requireAdminRole();

  const serviceClient = createServiceRoleClient();
  const { data: driverRows, error } = await serviceClient
    .from("drivers")
    .select("id,name,status,rating,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error || !driverRows) {
    return [];
  }

  return driverRows.map((driver) => ({
    id: driver.id,
    name: driver.name,
    status: driver.status === "offline" ? "Offline" : "Active",
    rating: driver.rating,
    lastActive: formatLastActive(driver.updated_at),
  }));
}

export async function fetchRequests(): Promise<AdminRequest[]> {
  await new Promise((r) => setTimeout(r, 30));
  return [...adminRequests];
}

export async function fetchRides(): Promise<AdminRide[]> {
  await new Promise((r) => setTimeout(r, 30));
  return [...adminRides];
}

export async function fetchCompletedRides(): Promise<AdminCompletedRide[]> {
  await new Promise((r) => setTimeout(r, 30));
  return [...adminCompletedRides];
}

const dateRangePredicates: Record<DateRange, (d: Date, now: Date) => boolean> = {
  Today: (d, now) => d.toDateString() === now.toDateString(),
  Yesterday: (d, now) => d.toDateString() === new Date(now.getTime() - 86400000).toDateString(),
  "Last 7 Days": (d, now) => d >= new Date(now.getTime() - 7 * 86400000) && d <= now,
};

export function matchesCompletedDateRange(completedAt: string, range: DateRange): boolean {
  const date = new Date(completedAt);
  return dateRangePredicates[range](date, new Date());
}
