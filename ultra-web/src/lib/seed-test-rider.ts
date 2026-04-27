import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

export type SeededRiderProfile = {
  name: string;
  phone: string;
};

type SeedResult =
  | { success: true }
  | { success: false; error: string };

export async function ensureSeededRiderRows(
  supabase: Pick<SupabaseClient<Database>, "from">,
  userId: string,
  rider: SeededRiderProfile
): Promise<SeedResult> {
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "rider" }, { onConflict: "user_id" });

  if (roleError) {
    return { success: false, error: `Role upsert — ${roleError.message}` };
  }

  const { error: riderError } = await supabase
    .from("riders")
    .upsert(
      {
        user_id: userId,
        name: rider.name,
        phone: rider.phone,
      },
      { onConflict: "user_id" }
    );

  if (riderError) {
    return { success: false, error: `Rider row upsert — ${riderError.message}` };
  }

  return { success: true };
}
