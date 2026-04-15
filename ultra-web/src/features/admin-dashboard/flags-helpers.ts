import type { AdminDriverFlag } from "./types";

export type AdminFlagsQuery = {
  search?: string;
  status?: string;
  reason?: string;
  sort?: string;
};

interface FlagRow {
  id: string;
  driver_id: string;
  reporter_id: string;
  ride_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function mapFlagRowsToAdminFlags(
  rows: FlagRow[],
  driversById: Map<string, string>,
  ridersById: Map<string, string>,
): AdminDriverFlag[] {
  return rows.map((row) => ({
    flagId: row.id,
    driverName: driversById.get(row.driver_id) ?? "Unknown Driver",
    reporterName: ridersById.get(row.reporter_id) ?? "Unknown Rider",
    reason: row.reason,
    details: row.details,
    status: row.status,
    rideId: row.ride_id,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    adminNotes: row.admin_notes,
  }));
}

const REASON_LABELS: Record<string, string> = {
  safety: "Safety",
  behavior: "Behavior",
  vehicle: "Vehicle",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export function formatReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

export function formatFlagStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function applyAdminFlagFilters(
  flags: AdminDriverFlag[],
  query: AdminFlagsQuery,
): AdminDriverFlag[] {
  let result = flags;

  if (query.search) {
    const term = query.search.toLowerCase().trim();
    result = result.filter(
      (f) =>
        f.flagId.toLowerCase().includes(term) ||
        f.driverName.toLowerCase().includes(term) ||
        f.reporterName.toLowerCase().includes(term) ||
        (f.rideId && f.rideId.toLowerCase().includes(term)) ||
        (f.details && f.details.toLowerCase().includes(term)),
    );
  }

  if (query.status && query.status !== "all") {
    result = result.filter((f) => f.status === query.status);
  }

  if (query.reason && query.reason !== "all") {
    result = result.filter((f) => f.reason === query.reason);
  }

  if (query.sort === "oldest") {
    result = [...result].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } else {
    result = [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return result;
}
