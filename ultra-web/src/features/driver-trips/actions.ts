import { mockDelay } from "@/lib/mock-delay";
import type {
  ActiveDriverTrip,
  DriverShiftSummary,
  TripAssignment,
} from "./types";

const shiftSummary: DriverShiftSummary = {
  driverName: "Marcus W.",
  status: "online",
  shiftWindow: "7:00 AM - 3:00 PM",
  acceptanceRate: 96,
  completionRate: 99,
  todayTrips: 8,
  earningsToday: 142.5,
};

const queuedTrip: TripAssignment = {
  id: "trip-204",
  riderName: "Aisha R.",
  pickupLabel: "Community Clinic",
  pickupAddress: "1150 West End Ave",
  dropoffLabel: "Metro General Hospital",
  dropoffAddress: "245 River Pkwy",
  offeredFare: 24.75,
  estimatedTripTimeMin: 26,
  mileageMi: 7.4,
  pickupEtaMin: 5,
  note: "Rider requested curbside pickup by the blue awning.",
};

const activeTrip: ActiveDriverTrip = {
  id: "trip-204",
  riderName: "Aisha R.",
  riderRating: 4.8,
  pickupLabel: queuedTrip.pickupLabel,
  pickupAddress: queuedTrip.pickupAddress,
  dropoffLabel: queuedTrip.dropoffLabel,
  dropoffAddress: queuedTrip.dropoffAddress,
  offeredFare: queuedTrip.offeredFare,
  mileageMi: queuedTrip.mileageMi,
  pickupEtaMin: queuedTrip.pickupEtaMin,
  routeProgressLabel: "2 turns away from pickup",
  vehicleChecklist: [
    "Hazards ready for curb pickup",
    "Back seat clear for rider belongings",
    "App PIN ready for verbal confirmation",
  ],
};

export async function getDriverShiftSummary(): Promise<DriverShiftSummary> {
  await mockDelay();
  return shiftSummary;
}

export async function getQueuedTrip(): Promise<TripAssignment> {
  await mockDelay();
  return queuedTrip;
}

export async function getActiveDriverTrip(id: string): Promise<ActiveDriverTrip> {
  await mockDelay();
  return { ...activeTrip, id };
}
