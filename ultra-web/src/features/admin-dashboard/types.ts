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
  partnerName: string;
  destination: string;
  status: string;
}

export interface AdminRide {
  rideId: string;
  riderName: string;
  driverName: string;
  origin: string;
  status: string;
}

export interface AdminCompletedRide {
  rideId: string;
  riderName: string;
  driverName: string;
  distance: string;
  status: string;
}

export type DateRange = "Today" | "Yesterday" | "Last 7 Days";
