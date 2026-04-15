"use server";

import { createServerAuthClient } from "@/lib/supabase-server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { ParentAccount, ChildProfile } from "./types";

const FALLBACK_ACCOUNT: ParentAccount = {
  id: "u1",
  name: "Guest",
  email: "—",
  phone: "—",
};

export async function getParentAccount(): Promise<ParentAccount> {
  try {
    const supabase = await createServerAuthClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return FALLBACK_ACCOUNT;
    }

    const serviceClient = createServiceRoleClient();
    const { data: rider, error: riderError } = await serviceClient
      .from("riders")
      .select("id,name,phone")
      .eq("user_id", user.id)
      .single();

    if (riderError || !rider) {
      return { ...FALLBACK_ACCOUNT, id: user.id, email: user.email ?? "—" };
    }

    return {
      id: rider.id,
      name: rider.name,
      email: user.email ?? "—",
      phone: rider.phone ?? "—",
    };
  } catch {
    return FALLBACK_ACCOUNT;
  }
}

export type AccountActionResult =
  | { success: true }
  | { success: false; error: string };

export interface UpdateParentAccountInput {
  name: string;
  phone: string;
}

/**
 * Update the signed-in rider's profile fields (name, phone). Scoped by
 * auth.uid() -> riders.user_id so a rider can only update their own row.
 */
export async function updateParentAccount(
  input: UpdateParentAccountInput
): Promise<AccountActionResult> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated." };
    }

    const serviceClient = createServiceRoleClient();
    const { error } = await serviceClient
      .from("riders")
      .update({ name: input.name, phone: input.phone })
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export interface CreateChildProfileInput {
  name: string;
  emergencyContactName?: string;
}

/**
 * Create a child profile (rider_profiles row with is_child=true) owned by
 * the signed-in rider. Emergency contact name is stored in the `notes`
 * column for now; a dedicated emergency_contacts row can follow.
 */
export async function createChildProfile(
  input: CreateChildProfileInput
): Promise<AccountActionResult> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated." };
    }

    const serviceClient = createServiceRoleClient();
    const { data: rider, error: riderError } = await serviceClient
      .from("riders")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (riderError || !rider) {
      return { success: false, error: "No rider profile found for this account." };
    }

    const { error } = await serviceClient
      .from("rider_profiles")
      .insert({
        rider_id: rider.id,
        name: input.name,
        is_child: true,
        notes: input.emergencyContactName ?? null,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export interface UpdateChildProfileInput {
  id: string;
  name?: string;
  emergencyContactName?: string;
}

/**
 * Update a child profile's editable fields. Verifies the row belongs to
 * the caller's rider before writing to prevent cross-rider tampering.
 */
export async function updateChildProfile(
  input: UpdateChildProfileInput
): Promise<AccountActionResult> {
  try {
    const ownership = await verifyOwnsChildProfile(input.id);
    if (!ownership.success) return ownership;

    const serviceClient = createServiceRoleClient();
    const updates: { name?: string; notes?: string } = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.emergencyContactName !== undefined)
      updates.notes = input.emergencyContactName;

    const { error } = await serviceClient
      .from("rider_profiles")
      .update(updates)
      .eq("id", input.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Remove a child profile the caller owns. Hard delete; emergency_contacts
 * cascade via FK. If retention becomes a requirement later, flip to
 * soft-delete via a deleted_at column.
 */
export async function deleteChildProfile(
  id: string
): Promise<AccountActionResult> {
  try {
    const ownership = await verifyOwnsChildProfile(id);
    if (!ownership.success) return ownership;

    const serviceClient = createServiceRoleClient();
    const { error } = await serviceClient
      .from("rider_profiles")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Internal helper: confirms the signed-in rider owns the given child
 * profile id. Used as the trust boundary for update/delete.
 */
async function verifyOwnsChildProfile(
  profileId: string
): Promise<AccountActionResult> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { success: false, error: "Not authenticated." };

  const serviceClient = createServiceRoleClient();
  const { data: rider } = await serviceClient
    .from("riders")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!rider) return { success: false, error: "No rider profile found." };

  const { data: profile } = await serviceClient
    .from("rider_profiles")
    .select("id,rider_id,is_child,deleted_at")
    .eq("id", profileId)
    .eq("is_child", true)
    .is("deleted_at", null)
    .single();

  if (!profile || profile.rider_id !== rider.id) {
    return { success: false, error: "Child profile not found or not owned by caller." };
  }

  return { success: true };
}

export interface NotificationPreferences {
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  smsEnabled: true,
  pushEnabled: true,
  emailEnabled: true,
};

/**
 * Fetch the caller's notification preferences. Falls back to all-true
 * defaults (matching migration DEFAULT values) when no row exists, so
 * the UI never renders an undefined state.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return DEFAULT_PREFERENCES;

    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient
      .from("notification_preferences")
      .select("sms_enabled,push_enabled,email_enabled")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return DEFAULT_PREFERENCES;

    return {
      smsEnabled: data.sms_enabled,
      pushEnabled: data.push_enabled,
      emailEnabled: data.email_enabled,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Write the caller's notification preferences. Uses upsert semantics:
 * updates the existing row scoped by user_id, or inserts one if missing.
 */
export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<AccountActionResult> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated." };
    }

    const serviceClient = createServiceRoleClient();
    const { error: upsertError } = await serviceClient
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          sms_enabled: prefs.smsEnabled,
          push_enabled: prefs.pushEnabled,
          email_enabled: prefs.emailEnabled,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function getChildProfiles(): Promise<ChildProfile[]> {
  try {
    const supabase = await createServerAuthClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return [];
    }

    const serviceClient = createServiceRoleClient();
    const { data: rider } = await serviceClient
      .from("riders")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!rider) {
      return [];
    }

    const { data: profiles, error: profilesError } = await serviceClient
      .from("rider_profiles")
      .select("id,name,is_child,notes")
      .eq("rider_id", rider.id)
      .eq("is_child", true);

    if (profilesError || !profiles) {
      return [];
    }

    return profiles.map((p) => ({
      id: p.id,
      name: p.name,
      age: 0,
      emergencyContactName: p.notes ?? "—",
    }));
  } catch {
    return [];
  }
}
