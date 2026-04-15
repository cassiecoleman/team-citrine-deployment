/**
 * Clear ALL incomplete rides — anything with a status other than 'completed'.
 *
 * Includes pending (requested, matching, driver_assigned), in-flight
 * (driver_en_route, arrived, in_progress), AND cancelled rides. Leaves
 * `completed` rides untouched so the completed-rides history stays intact.
 *
 * Run: npx tsx scripts/clear-incomplete-rides.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const { data: rides, error: selectError } = await supabase
    .from("rides")
    .select("id, status")
    .neq("status", "completed");

  if (selectError) {
    console.error("Failed to list incomplete rides:", selectError.message);
    process.exit(1);
  }

  const rideIds = (rides ?? []).map((r) => r.id);
  const byStatus = (rides ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Found ${rideIds.length} incomplete rides.`);
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${count}`);
  }

  if (rideIds.length === 0) {
    console.log("Nothing to clear.");
    return;
  }

  // Non-cascading FK children first.
  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .in("ride_id", rideIds);
  if (paymentsError) {
    console.error("Failed to delete payments:", paymentsError.message);
    process.exit(1);
  }

  const { error: fareSplitsError } = await supabase
    .from("fare_splits")
    .delete()
    .in("ride_id", rideIds);
  if (fareSplitsError) {
    console.error("Failed to delete fare_splits:", fareSplitsError.message);
    process.exit(1);
  }

  const { error: ridesError } = await supabase
    .from("rides")
    .delete()
    .in("id", rideIds);
  if (ridesError) {
    console.error("Failed to delete rides:", ridesError.message);
    process.exit(1);
  }

  console.log(`Cleared ${rideIds.length} incomplete rides.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
