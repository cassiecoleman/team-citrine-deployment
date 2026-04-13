import type { DetailedRideStatus, RideDetail } from "./types";

interface RideRealtimeUpdate {
  status?: string | null;
}

export function normalizeRideStatus(status: string | null | undefined): DetailedRideStatus {
  if (status === "driver_en_route") {
    return "en_route";
  }

  if (status === "arrived" || status === "in_progress" || status === "completed") {
    return status;
  }

  return "matching";
}

export function buildRideViewModel(
  previousRide: RideDetail,
  update: RideRealtimeUpdate,
): RideDetail {
  const nextStatus = normalizeRideStatus(update.status ?? previousRide.status);

  return {
    ...previousRide,
    status: nextStatus,
    etaMin: nextStatus === "arrived" ? 0 : previousRide.etaMin,
  };
}
