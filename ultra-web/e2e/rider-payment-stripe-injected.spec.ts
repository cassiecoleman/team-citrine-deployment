import { expect, test } from "@playwright/test";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

/**
 * Issue #31 — Stripe payment integration, session-injection variant.
 *
 * This test authenticates by writing Supabase session cookies directly into
 * the browser context, bypassing the login UI entirely. It runs today,
 * before the login/register pages (PR #51) land, so that Stripe integration
 * work on issue #31 can progress in parallel with the auth UI work.
 *
 * The assertions target the Stripe Checkout redirect that issue #31's
 * `createCheckoutSession()` server action will produce. Before Stripe is
 * integrated, clicking Subscribe on /passes/review redirects to
 * /passes/active directly; after integration, it should redirect to a
 * checkout.stripe.com URL. These tests are RED today and will go GREEN once
 * issue #31 is implemented.
 */

test.describe("Issue #31 — ride pass Stripe checkout (session-injected)", () => {
  let rider: TestUser;

  test.beforeAll(async () => {
    rider = await createTestRider("e2e-stripe-injected");
  });

  test.afterAll(async () => {
    if (rider?.userId) {
      await deleteTestUser(rider.userId);
    }
  });

  test.beforeEach(async ({ context }) => {
    await injectAuthenticatedSession(context, rider);
  });

  test("signed-in rider sees the passes page", async ({ page }) => {
    await page.goto("/passes");

    // Sanity check: session injection worked and the user isn't bounced
    // to /login by middleware.
    await expect(page).toHaveURL(/\/passes$/);
    await expect(page.getByText("Weekly Commute")).toBeVisible();
  });

  test("subscribing to a pass redirects to Stripe Checkout", async ({ page }) => {
    await page.goto("/passes");
    await page.getByText("Weekly Commute").click();

    await expect(page).toHaveURL(/\/passes\/review/);

    const subscribe = page.getByRole("button", { name: /subscribe/i });
    await expect(subscribe).toBeVisible();

    // Stripe Checkout is an external redirect. Listen for the navigation
    // that leaves our origin.
    const checkoutNavigation = page.waitForURL(
      /checkout\.stripe\.com/,
      { timeout: 10_000 }
    );

    await subscribe.click();

    // RED today: the action redirects to /passes/active without going
    // through Stripe. GREEN after issue #31 wires createCheckoutSession().
    await checkoutNavigation;

    expect(page.url()).toContain("checkout.stripe.com");
  });

  test("canceling Stripe Checkout returns the rider to the review page", async ({
    page,
  }) => {
    // Once createCheckoutSession() supports cancel_url, hitting it should
    // bring the rider back to /passes/review without creating a ride_passes
    // row. We hit the cancel_url directly here to avoid interacting with
    // the real Stripe UI.
    await page.goto("/passes/review?plan=weekly-commute&checkout=cancelled");

    await expect(page).toHaveURL(/\/passes\/review/);
    // RED today: no cancellation message exists. GREEN once the review
    // page renders a "Checkout cancelled" banner when returning from
    // Stripe's cancel_url.
    await expect(page.getByText(/checkout cancelled/i)).toBeVisible();
  });
});
