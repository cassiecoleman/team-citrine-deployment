export interface AdminDriver {
  id: string;
  name: string;
  status: string;
  rating: number;
  lastActive: string;
}

export interface AdminRequest {
  requestId: string;
  riderName: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  requestType: "Immediate" | "Scheduled";
  requestedAt: string;
  scheduledFor: string | null;
  childSafeRequired: boolean;
}

export interface AdminRide {
  rideId: string;
  riderName: string;
  driverName: string;
  origin: string;
  status: string;
  startedAt: string | null;
  fare: number | null;
}

export interface AdminCompletedRide {
  rideId: string;
  riderName: string;
  driverName: string;
  distance: string;
  status: string;
  completedAt: string | null;
  fare: number | null;
}

export type DateRange = "Today" | "Yesterday" | "Last 7 Days";
