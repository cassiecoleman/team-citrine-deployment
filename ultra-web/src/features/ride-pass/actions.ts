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

export async function decrementPassRide(
  passId: string,
  userId?: string,
): Promise<PassActionResult<{ ridesRemaining: number }>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to use a ride pass." };
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

  const passResult = await supabase
    .from("ride_passes")
    .select()
    .eq("id", passId)
    .single();

  if (passResult.error || !passResult.data) {
    return { success: false, error: "Ride pass not found." };
  }

  if (passResult.data.rider_id !== riderResult.data.id) {
    return { success: false, error: "You can only use your own ride pass." };
  }

  if (passResult.data.rides_remaining <= 0) {
    return { success: false, error: "No rides remaining on this pass." };
  }

  const newRemaining = passResult.data.rides_remaining - 1;
  const newStatus = newRemaining === 0 ? "exhausted" : passResult.data.status;
  const newVersion = passResult.data.version + 1;

  const updateResult = await supabase
    .from("ride_passes")
    .update({
      rides_remaining: newRemaining,
      status: newStatus,
      version: newVersion,
    })
    .eq("id", passId)
    .eq("version", passResult.data.version)
    .select()
    .single();

  if (updateResult.error || !updateResult.data) {
    return { success: false, error: "Unable to decrement ride pass. Please try again." };
  }

  return { success: true, data: { ridesRemaining: updateResult.data.rides_remaining } };
}

export async function getActivePassForUser(
  userId?: string,
): Promise<PassActionResult<ActiveRidePass | null>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to view your ride pass." };
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

  const passResult = await supabase
    .from("ride_passes")
    .select()
    .eq("rider_id", riderResult.data.id)
    .eq("status", "active")
    .order("purchased_at", { ascending: false })
    .limit(1)
    .single();

  if (passResult.error || !passResult.data) {
    return { success: true, data: null };
  }

  return { success: true, data: mapRidePassRowToActivePass(passResult.data) };
}

export async function getActivePass(): Promise<ActiveRidePass | null> {
  await mockDelay();
  return mockActivePass;
}
