/**
 * Playwright multi-context counterpart to scripts/demo-live-map.ts.
 *
 * Spawns 11 BrowserContexts (7 riders + 3 drivers + 1 admin) all with
 * cookie-injected sessions and exercises the location-entry + admin
 * map UIs simultaneously. Within the 2-minute cap, this version only
 * verifies the *visual* path: it does not animate full ride lifecycles
 * (the Node script covers that). It is the realistic UI-driven proof
 * that 11 concurrent authenticated browsers can land on their
 * respective screens at once.
 */

import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  createDemoFleet,
  type FleetUser,
} from "./helpers/demo-fleet";

const RIDER_SEEDS = [
  { name: "Aisha R.", startLat: 35.155, startLng: -90.06, destLat: 35.13, destLng: -89.97 },
  { name: "Ben K.", startLat: 35.165, startLng: -90.04, destLat: 35.11, destLng: -89.98 },
  { name: "Cami D.", startLat: 35.118, startLng: -90.075, destLat: 35.14, destLng: -89.99 },
  { name: "Dani S.", startLat: 35.145, startLng: -90.012, destLat: 35.10, destLng: -89.95 },
  { name: "Evan M.", startLat: 35.128, startLng: -90.085, destLat: 35.16, destLng: -89.96 },
  { name: "Faye L.", startLat: 35.172, startLng: -90.055, destLat: 35.12, destLng: -89.99 },
  { name: "Gigi T.", startLat: 35.115, startLng: -90.025, destLat: 35.17, destLng: -89.97 },
];

const DRIVER_SEEDS = [
  { name: "Marcus W.", startLat: 35.140, startLng: -90.050 },
  { name: "Nina J.", startLat: 35.155, startLng: -90.030 },
  { name: "Omar P.", startLat: 35.125, startLng: -90.060 },
];

test.describe("Live Map demo — 11-context Playwright variant", () => {
  test.setTimeout(120_000);

  test("riders + drivers + admin land on their respective screens at once", async ({
    browser,
  }) => {
    const fleet = await createDemoFleet({
      riders: RIDER_SEEDS,
      drivers: DRIVER_SEEDS,
      emailPrefix: "pw-demo",
    });

    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    try {
      // 1. Build all 11 contexts in parallel.
      const all = [...fleet.riders, ...fleet.drivers, fleet.admin];
      const built = await Promise.all(
        all.map(async (user) => {
          const ctx = await browser.newContext();
          await injectSession(ctx, user);
          return { user, ctx };
        }),
      );

      // 2. Navigate each context to the appropriate landing page.
      const navs = await Promise.all(
        built.map(async ({ user, ctx }) => {
          const page = await ctx.newPage();
          const dest =
            user.role === "rider"
              ? "/"
              : user.role === "driver"
                ? "/driver"
                : "/admin/live-map";
          await page.goto(dest);
          contexts.push(ctx);
          pages.push(page);
          return { user, page };
        }),
      );

      // 3. Each rider page should show the LocationEntryCard heading.
      const riderPages = navs.filter((n) => n.user.role === "rider");
      for (const { page } of riderPages) {
        await expect(page.getByText("Update your location")).toBeVisible();
      }

      // 4. Each driver page should also show the LocationEntryCard.
      const driverPages = navs.filter((n) => n.user.role === "driver");
      for (const { page } of driverPages) {
        await expect(page.getByText("Update your location")).toBeVisible();
      }

      // 5. Admin map should show heading text.
      const adminPage = navs.find((n) => n.user.role === "admin")!.page;
      await expect(adminPage.getByRole("heading", { name: "Live Map" })).toBeVisible();
    } finally {
      for (const ctx of contexts) {
        await ctx.close().catch(() => {});
      }
      await fleet.cleanup();
    }
  });
});

async function injectSession(ctx: BrowserContext, user: FleetUser) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error || !data.session) {
    throw new Error(`sign-in failed for ${user.email}: ${error?.message}`);
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  await ctx.addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: "bearer",
        user: data.session.user,
      }),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
