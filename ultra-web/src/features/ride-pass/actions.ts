"use server";

import { mockSpendingData, mockActivePass } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { RidePassPlan, ActiveRidePass, SpendingData } from "./types";
import { RIDE_PASS_PLANS } from "./plan-catalog";
import { mapRidePassRowToActivePass } from "./mappers";

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

  const supabase = createServiceRoleClient();

  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "No rider profile found for this account." };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const passResult = await supabase
    .from("ride_passes")
    .insert({
      rider_id: riderResult.data.id,
      plan_name: plan.tier,
      plan_description: `${plan.ridesPerWeek} rides per week`,
      rides_total: plan.ridesPerWeek,
      rides_remaining: plan.ridesPerWeek,
      price_paid: plan.pricePerWeek,
      status: "active",
      purchased_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (passResult.error || !passResult.data) {
    return { success: false, error: "Unable to purchase ride pass right now." };
  }

  return { success: true, data: mapRidePassRowToActivePass(passResult.data) };
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
