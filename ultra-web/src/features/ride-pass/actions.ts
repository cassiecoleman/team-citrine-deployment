import { mockPassPlans, mockSpendingData, mockActivePass } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { RidePassPlan, ActiveRidePass, SpendingData } from "./types";

export async function getRidePassPlans(): Promise<RidePassPlan[]> {
  await mockDelay();
  return mockPassPlans;
}

export async function getSpendingData(): Promise<SpendingData> {
  await mockDelay();
  return mockSpendingData;
}

export async function subscribeToPlan(planId: string): Promise<ActiveRidePass> {
  await mockDelay(500, 1000);
  return {
    ...mockActivePass,
    plan: mockPassPlans.find((p) => p.id === planId) ?? mockPassPlans[0],
  };
}

export async function getActivePass(): Promise<ActiveRidePass | null> {
  await mockDelay();
  return mockActivePass;
}
