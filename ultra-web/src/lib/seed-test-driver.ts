import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

export type SeededDriverProfile = {
  name: string;
  phone?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
  license_plate?: string | null;
  is_child_safe?: boolean;
  status?: "offline" | "available" | "on_trip";
};

type SeedResult =
  | { success: true }
  | { success: false; error: string };

export async function ensureSeededDriverRows(
  supabase: Pick<SupabaseClient<Database>, "from">,
  userId: string,
  driver: SeededDriverProfile
): Promise<SeedResult> {
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "driver" }, { onConflict: "user_id" });

  if (roleError) {
    return { success: false, error: `Role upsert — ${roleError.message}` };
  }

  const { error: driverError } = await supabase
    .from("drivers")
    .upsert(
      {
        user_id: userId,
        name: driver.name,
        phone: driver.phone ?? null,
        vehicle_make: driver.vehicle_make ?? null,
        vehicle_model: driver.vehicle_model ?? null,
        vehicle_year: driver.vehicle_year ?? null,
        vehicle_color: driver.vehicle_color ?? null,
        license_plate: driver.license_plate ?? null,
        is_child_safe: driver.is_child_safe ?? false,
        status: driver.status ?? "offline",
      },
      { onConflict: "user_id" }
    );

  if (driverError) {
    return { success: false, error: `Driver row upsert — ${driverError.message}` };
  }

  return { success: true };
}
