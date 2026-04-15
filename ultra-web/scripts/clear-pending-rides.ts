/**
 * Clear pending ride requests.
 *
 * Deletes rides with status in ('requested', 'matching', 'driver_assigned')
 * and their FK-linked payments/fare_splits rows (ride_status_history
 * cascades automatically).
 *
 * Run: npx tsx scripts/clear-pending-rides.ts
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

const PENDING_STATUSES = ["requested", "matching", "driver_assigned"];

async function main() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  // Find target ride ids
  const { data: rides, error: selectError } = await supabase
    .from("rides")
    .select("id")
    .in("status", PENDING_STATUSES);

  if (selectError) {
    console.error("Failed to list pending rides:", selectError.message);
    process.exit(1);
  }

  const rideIds = (rides ?? []).map((r) => r.id);
  console.log(`Found ${rideIds.length} pending rides (statuses: ${PENDING_STATUSES.join(", ")}).`);

  if (rideIds.length === 0) {
    console.log("Nothing to clear.");
    return;
  }

  // Delete FK children that DON'T cascade automatically
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

  // ride_status_history + other cascading FKs clear automatically when
  // the ride row goes.
  const { error: ridesError } = await supabase
    .from("rides")
    .delete()
    .in("id", rideIds);
  if (ridesError) {
    console.error("Failed to delete rides:", ridesError.message);
    process.exit(1);
  }

  console.log(`Cleared ${rideIds.length} pending rides.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
