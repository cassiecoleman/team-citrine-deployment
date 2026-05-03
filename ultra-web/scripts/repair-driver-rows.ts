/**
 * Repair script: ensure every auth user with driver role has a drivers row.
 * Run: npx tsx scripts/repair-driver-rows.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

import { ensureSeededDriverRows } from "../src/lib/seed-test-driver";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function fallbackName(email?: string | null): string {
  const localPart = email?.split("@")[0]?.trim() || "Driver";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

function fallbackPlate(userId: string): string {
  return `DRV-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;
}

async function repairDriverRows() {
  console.log("Repairing missing drivers rows for driver-role users...\n");

  const { data: driverRoles, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "driver");

  if (roleError) {
    console.error(`  [fail] Unable to load driver roles — ${roleError.message}`);
    process.exit(1);
  }

  const userIds = [...new Set((driverRoles ?? []).map((row) => row.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    console.log("  [done] No driver-role users found.");
    return;
  }

  const { data: driverRows, error: driverError } = await supabase
    .from("drivers")
    .select("user_id");

  if (driverError) {
    console.error(`  [fail] Unable to load existing drivers rows — ${driverError.message}`);
    process.exit(1);
  }

  const existingDriverUserIds = new Set((driverRows ?? []).map((row) => row.user_id));
  const missingUserIds = userIds.filter((userId) => !existingDriverUserIds.has(userId));

  if (missingUserIds.length === 0) {
    console.log("  [done] All driver-role users already have drivers rows.");
    return;
  }

  const { data: authUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
  if (listUsersError) {
    console.error(`  [fail] Unable to load auth users — ${listUsersError.message}`);
    process.exit(1);
  }

  const usersById = new Map((authUsers?.users ?? []).map((user) => [user.id, user]));

  for (const userId of missingUserIds) {
    const authUser = usersById.get(userId);
    const email = authUser?.email ?? null;
    const name = fallbackName(email);
    const profile = {
      name,
      status: "offline" as const,
      license_plate: fallbackPlate(userId),
    };

    const repairResult = await ensureSeededDriverRows(supabase, userId, profile);
    if (!repairResult.success) {
      console.error(`  [fail] ${userId} — ${repairResult.error}`);
      continue;
    }

    console.log(`  [done] ${userId} — created drivers row for ${email ?? "unknown email"}`);
  }

  console.log("\nDriver row repair complete.");
}

repairDriverRows().catch((error) => {
  console.error(error);
  process.exit(1);
});
