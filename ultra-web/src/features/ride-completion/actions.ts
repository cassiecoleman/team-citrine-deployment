import { homeLocation, hospitalLocation, mockDriver, aishaPayment } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { RideCompletionData, IssueReport } from "./types";

export async function getRideCompletion(id: string): Promise<RideCompletionData> {
  await mockDelay();
  return {
    ride: {
      id,
      pickup: homeLocation,
      dropoff: hospitalLocation,
      status: "completed",
      estimatedFare: 19.0,
      actualFare: 18.5,
      driver: mockDriver,
      distanceMi: 5.1,
      durationMin: 18,
    },
    fare: 18.5,
    serviceFee: 2.5,
    total: 21.0,
    paymentMethod: aishaPayment,
    driver: mockDriver,
  };
}

export async function submitRating(rideId: string, stars: number): Promise<void> {
  await mockDelay();
}

export async function submitTip(rideId: string, amount: number): Promise<void> {
  await mockDelay();
}

export async function submitIssueReport(rideId: string, report: IssueReport): Promise<void> {
  await mockDelay();
}
