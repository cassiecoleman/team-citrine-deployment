"use server";

import { mockSpendingData, mockActivePass } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { RidePassPlan, ActiveRidePass, SpendingData } from "./types";
import { RIDE_PASS_PLANS } from "./plan-catalog";

export type PassActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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

export async function purchasePass(
  planId: string,
  userId?: string,
): Promise<PassActionResult<ActiveRidePass>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to purchase a ride pass." };
  }

  const plan = RIDE_PASS_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return { success: false, error: "Invalid ride pass plan." };
  }

  return { success: false, error: "Not implemented." };
}

export async function subscribeToPlan(planId: string): Promise<ActiveRidePass> {
  await mockDelay(500, 1000);
  return {
    ...mockActivePass,
    plan: RIDE_PASS_PLANS.find((p) => p.id === planId) ?? RIDE_PASS_PLANS[0],
  };
}

export async function getActivePass(): Promise<ActiveRidePass | null> {
  await mockDelay();
  return mockActivePass;
}
