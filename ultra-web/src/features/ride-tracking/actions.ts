import { homeLocation, hospitalLocation, mockDriver } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { RideDetail } from "./types";

export async function getRideStatus(id: string): Promise<RideDetail> {
  await mockDelay();
  return {
    id,
    pickup: homeLocation,
    dropoff: hospitalLocation,
    status: "matching",
    estimatedFare: 19.0,
    distanceMi: 5.1,
    durationMin: 18,
    driver: mockDriver,
    progressPercent: 0,
    distanceRemainingMi: 5.1,
    etaMin: 8,
  };
}
