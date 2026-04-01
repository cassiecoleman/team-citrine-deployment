import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { Location } from "@/types";
import type { RiderProfile, ScheduledRide } from "./types";

export async function getScheduleDefaults(): Promise<{
  pickup: Location;
  dropoff: Location;
  fare: number;
}> {
  await mockDelay();
  return {
    pickup: homeLocation,
    dropoff: hospitalLocation,
    fare: 12,
  };
}

export async function getRiderProfiles(): Promise<RiderProfile[]> {
  await mockDelay();
  return [
    { id: "rp-1", name: "Emma", age: 9, emergencyContact: "Rosa M." },
    { id: "rp-2", name: "Lucas", age: 6, emergencyContact: "Rosa M." },
  ];
}

export async function submitSchedule(
  schedule: ScheduledRide,
): Promise<{ success: boolean }> {
  await mockDelay(500, 1000);
  return { success: true };
}
