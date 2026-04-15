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
