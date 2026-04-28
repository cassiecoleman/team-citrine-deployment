/**
 * Loadtest teardown — sweeps `loadtest-*` users.
 *
 * Run after every loadtest run (or after a Ctrl-C):
 *   cd ultra-web && npm run loadtest:teardown
 *
 * Delegates to `sweepDemoOrphans()` from `e2e/helpers/demo-fleet.ts`,
 * which already knows about the `loadtest-` email prefix.
 */

import { resolve } from "node:path";
import { unlinkSync } from "node:fs";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../ultra-web/.env.local") });

import { sweepDemoOrphans } from "../../ultra-web/e2e/helpers/demo-fleet";

async function main() {
  console.log("Sweeping loadtest- users…");
  const result = await sweepDemoOrphans();
  console.log(`Deleted ${result.deletedUsers} users.`);
  try {
    unlinkSync(resolve(__dirname, "../seeded.json"));
    console.log("Removed loadtest/seeded.json");
  } catch {
    // No file — already clean.
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
