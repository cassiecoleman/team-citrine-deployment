import { adminDrivers, adminRequests, adminRides, adminCompletedRides } from "./constants";
import type { AdminDriver, AdminRequest, AdminRide, AdminCompletedRide, DateRange } from "./types";

export async function fetchDrivers(): Promise<AdminDriver[]> {
  await new Promise((r) => setTimeout(r, 30));
  return [...adminDrivers];
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
