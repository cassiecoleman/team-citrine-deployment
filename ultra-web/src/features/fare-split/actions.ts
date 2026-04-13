"use server";

import {
  mockFareEstimate,
  mockContacts,
  mockFareSplit,
  mockDriver,
  mockReceipt,
} from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { FareEstimate, Contact, FareSplit, Driver, RideReceipt } from "./types";
import { mapFareSplitRowToFareSplit } from "./mappers";
import { createFareSplitSchema } from "./schemas";

export type SplitActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getFareEstimate(): Promise<FareEstimate> {
  await mockDelay();
  return mockFareEstimate;
}

export async function getContacts(): Promise<Contact[]> {
  await mockDelay();
  return mockContacts;
}

export async function createFareSplit(
  input: { rideId: string; inviteeId: string; totalFare: number },
  userId?: string,
): Promise<SplitActionResult<FareSplit>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to create a fare split." };
  }

  const parsed = createFareSplitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid fare split details." };
  }

  const supabase = createServiceRoleClient();

  const riderResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "No rider profile found for this account." };
  }

  const halfFare = parsed.data.totalFare / 2;
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  const splitResult = await supabase
    .from("fare_splits")
    .insert({
      ride_id: parsed.data.rideId,
      inviter_id: riderResult.data.id,
      invitee_id: parsed.data.inviteeId,
      inviter_amount: halfFare,
      invitee_amount: halfFare,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (splitResult.error || !splitResult.data) {
    return { success: false, error: "Unable to create fare split right now." };
  }

  const inviteeResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("id", parsed.data.inviteeId)
    .single();

  const inviteeName = inviteeResult.data?.name ?? "Rider";

  return {
    success: true,
    data: mapFareSplitRowToFareSplit(
      splitResult.data,
      { id: riderResult.data.id, name: riderResult.data.name },
      { id: parsed.data.inviteeId, name: inviteeName },
    ),
  };
}

export async function acceptFareSplit(
  splitId: string,
  userId?: string,
): Promise<SplitActionResult<FareSplit>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to accept a fare split." };
  }

  const supabase = createServiceRoleClient();

  const riderResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "No rider profile found for this account." };
  }

  const splitResult = await supabase
    .from("fare_splits")
    .select()
    .eq("id", splitId)
    .single();

  if (splitResult.error || !splitResult.data) {
    return { success: false, error: "Fare split not found." };
  }

  if (splitResult.data.invitee_id !== riderResult.data.id) {
    return { success: false, error: "Only the invitee can accept a fare split." };
  }

  if (splitResult.data.status !== "pending") {
    return { success: false, error: "This fare split is no longer pending." };
  }

  const updateResult = await supabase
    .from("fare_splits")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", splitId)
    .select()
    .single();

  if (updateResult.error || !updateResult.data) {
    return { success: false, error: "Unable to accept fare split right now." };
  }

  const inviterResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("id", splitResult.data.inviter_id)
    .single();

  const inviterName = inviterResult.data?.name ?? "Rider";

  return {
    success: true,
    data: mapFareSplitRowToFareSplit(
      updateResult.data,
      { id: splitResult.data.inviter_id, name: inviterName },
      { id: riderResult.data.id, name: riderResult.data.name },
    ),
  };
}

export async function declineFareSplit(
  splitId: string,
  userId?: string,
): Promise<SplitActionResult<{ id: string; status: string }>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to decline a fare split." };
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

  const splitResult = await supabase
    .from("fare_splits")
    .select()
    .eq("id", splitId)
    .single();

  if (splitResult.error || !splitResult.data) {
    return { success: false, error: "Fare split not found." };
  }

  if (splitResult.data.invitee_id !== riderResult.data.id) {
    return { success: false, error: "Only the invitee can decline a fare split." };
  }

  if (splitResult.data.status !== "pending") {
    return { success: false, error: "This fare split is no longer pending." };
  }

  const updateResult = await supabase
    .from("fare_splits")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", splitId)
    .select("id,status")
    .single();

  if (updateResult.error || !updateResult.data) {
    return { success: false, error: "Unable to decline fare split right now." };
  }

  return {
    success: true,
    data: { id: updateResult.data.id, status: updateResult.data.status },
  };
}

export async function getFareSplitForRide(
  rideId: string,
  userId?: string,
): Promise<SplitActionResult<FareSplit | null>> {
  if (!userId) {
    return { success: false, error: "You must be signed in to view fare splits." };
  }

  const supabase = createServiceRoleClient();

  const riderResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("user_id", userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "No rider profile found for this account." };
  }

  const splitResult = await supabase
    .from("fare_splits")
    .select()
    .eq("ride_id", rideId)
    .or(`inviter_id.eq.${riderResult.data.id},invitee_id.eq.${riderResult.data.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (splitResult.error || !splitResult.data) {
    return { success: true, data: null };
  }

  const isInviter = splitResult.data.inviter_id === riderResult.data.id;
  const otherRiderId = isInviter
    ? splitResult.data.invitee_id
    : splitResult.data.inviter_id;

  const otherResult = await supabase
    .from("riders")
    .select("id,name")
    .eq("id", otherRiderId)
    .single();

  const otherName = otherResult.data?.name ?? "Rider";

  const inviterInfo = isInviter
    ? { id: riderResult.data.id, name: riderResult.data.name }
    : { id: otherRiderId, name: otherName };
  const inviteeInfo = isInviter
    ? { id: otherRiderId, name: otherName }
    : { id: riderResult.data.id, name: riderResult.data.name };

  return {
    success: true,
    data: mapFareSplitRowToFareSplit(splitResult.data, inviterInfo, inviteeInfo),
  };
}

// Backward-compatible wrappers for existing UI
export async function sendInvite(contactId: string): Promise<FareSplit> {
  await mockDelay(500, 1000);
  return mockFareSplit;
}

export async function getMatchedDriver(): Promise<Driver> {
  await mockDelay(800, 1500);
  return mockDriver;
}

export async function getRideReceipt(): Promise<RideReceipt> {
  await mockDelay();
  return mockReceipt;
}
