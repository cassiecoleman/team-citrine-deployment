export interface DriverShiftSummary {
  driverName: string;
  status: "online" | "offline";
  shiftWindow: string;
  acceptanceRate: number;
  completionRate: number;
  todayTrips: number;
  earningsToday: number;
}

export interface TripAssignment {
  id: string;
  riderName: string;
  pickupLabel: string;
  pickupAddress: string;
  dropoffLabel: string;
  dropoffAddress: string;
  offeredFare: number;
  estimatedTripTimeMin: number;
  mileageMi: number;
  pickupEtaMin: number;
  note: string;
}

export interface ActiveDriverTrip {
  id: string;
  riderName: string;
  riderRating: number;
  pickupLabel: string;
  pickupAddress: string;
  dropoffLabel: string;
  dropoffAddress: string;
  offeredFare: number;
  mileageMi: number;
  pickupEtaMin: number;
  routeProgressLabel: string;
  vehicleChecklist: string[];
}
