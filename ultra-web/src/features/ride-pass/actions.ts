import { mockSpendingData, mockActivePass } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { RidePassPlan, ActiveRidePass, SpendingData } from "./types";
import { RIDE_PASS_PLANS } from "./plan-catalog";

export async function getAvailablePasses(): Promise<RidePassPlan[]> {
  return RIDE_PASS_PLANS;
}

export async function getRidePassPlans(): Promise<RidePassPlan[]> {
  return getAvailablePasses();
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
