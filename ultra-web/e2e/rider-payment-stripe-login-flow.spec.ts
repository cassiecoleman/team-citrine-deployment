import { expect, test } from "@playwright/test";
import { createTestRider, deleteTestUser, type TestUser } from "./helpers/auth";

/**
 * Issue #31 — Stripe payment integration, full-login-flow variant.
 *
 * Mirror of `rider-payment-stripe-injected.spec.ts`, but authenticates by
 * driving the /login UI instead of injecting cookies. This is the real
 * end-to-end test the issue's test plan asks for ("complete ride → payment
 * captured").
 *
 * The entire describe block is currently skipped because /login does not
 * exist on main — it's added by PR #51. Remove the `test.describe.skip`
 * (change back to `test.describe`) once that PR lands.
 */

const SKIP_REASON =
  "Skipped until PR #51 lands the /login page. Until then, use rider-payment-stripe-injected.spec.ts for coverage.";

test.describe.skip(
  `Issue #31 — ride pass Stripe checkout (login UI) [${SKIP_REASON}]`,
  () => {
    let rider: TestUser;

    test.beforeAll(async () => {
      rider = await createTestRider("e2e-stripe-login");
    });

    test.afterAll(async () => {
      if (rider?.userId) {
        await deleteTestUser(rider.userId);
      }
    });

    test.beforeEach(async ({ page }) => {
      // Drive the real login UI. Assumes PR #51's form selectors:
      //   input[type="email"], input[type="password"], button[type="submit"]
      await page.goto("/login");
      await page.locator('input[type="email"]').fill(rider.email);
      await page.locator('input[type="password"]').fill(rider.password);
      await page.locator('button[type="submit"]').click();

      // After successful sign-in, PR #51's form navigates to the rider
      // home. Adjust this URL once PR #51 stabilizes (currently the form
      // pushes to /rider/home, which PR #50's middleware doesn't route —
      // that mismatch needs to be resolved before this test runs).
      await page.waitForURL(/\/(rider)?$|\/rider\/home/, { timeout: 10_000 });
    });

    test("signed-in rider sees the passes page", async ({ page }) => {
      await page.goto("/passes");

      await expect(page).toHaveURL(/\/passes$/);
      await expect(page.getByText("Weekly Commute")).toBeVisible();
    });

    test("subscribing to a pass redirects to Stripe Checkout", async ({ page }) => {
      await page.goto("/passes");
      await page.getByText("Weekly Commute").click();

      await expect(page).toHaveURL(/\/passes\/review/);

      const subscribe = page.getByRole("button", { name: /subscribe/i });
      await expect(subscribe).toBeVisible();

      const checkoutNavigation = page.waitForURL(
        /checkout\.stripe\.com/,
        { timeout: 10_000 }
      );

      await subscribe.click();
      await checkoutNavigation;

      expect(page.url()).toContain("checkout.stripe.com");
    });

    test("canceling Stripe Checkout returns the rider to the review page", async ({
      page,
    }) => {
      await page.goto("/passes/review?plan=weekly-commute&checkout=cancelled");

      await expect(page).toHaveURL(/\/passes\/review/);
      await expect(page.getByText(/checkout cancelled/i)).toBeVisible();
    });
  }
);
