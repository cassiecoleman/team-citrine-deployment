import { expect, test } from "@playwright/test";
import { createTestRider, deleteTestUser, type TestUser } from "./helpers/auth";

/**
 * Issue #31 — Ride pass purchase via Stripe Elements, full-login-flow variant.
 *
 * Mirror of `rider-payment-stripe-injected.spec.ts`, but authenticates by
 * driving the /login UI instead of injecting cookies. This is the real
 * end-to-end test: login -> select pass -> pay with Stripe Elements ->
 * pass active.
 *
 * The entire describe block is currently skipped because /login does not
 * exist on main — it's added by PR #51. Remove the `test.describe.skip`
 * (change back to `test.describe`) once that PR lands.
 */

const SKIP_REASON =
  "Skipped until PR #51 lands the /login page. Until then, use rider-payment-stripe-injected.spec.ts for coverage.";

const TEST_CARD_NUMBER = "4242 4242 4242 4242";
const TEST_CARD_EXP = "12 / 34";
const TEST_CARD_CVC = "123";
const TEST_CARD_POSTAL = "90210";

test.describe.skip(
  `Issue #31 — ride pass Stripe Elements (login UI) [${SKIP_REASON}]`,
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

    test("review page mounts the Stripe Payment Element", async ({ page }) => {
      await page.goto("/passes");
      await page.getByText("Weekly Commute").click();

      await expect(page).toHaveURL(/\/passes\/review/);

      const stripeFrame = page
        .locator('iframe[name^="__privateStripeFrame"]')
        .first();
      await expect(stripeFrame).toBeVisible({ timeout: 10_000 });
    });

    test("filling the test card and clicking Subscribe completes the purchase", async ({
      page,
    }) => {
      await page.goto("/passes");
      await page.getByText("Weekly Commute").click();
      await expect(page).toHaveURL(/\/passes\/review/);

      const paymentFrame = page.frameLocator(
        'iframe[name^="__privateStripeFrame"]'
      );

      await paymentFrame
        .locator('[name="number"], [placeholder*="Card number" i]')
        .first()
        .fill(TEST_CARD_NUMBER);
      await paymentFrame
        .locator('[name="expiry"], [placeholder*="MM" i]')
        .first()
        .fill(TEST_CARD_EXP);
      await paymentFrame
        .locator('[name="cvc"], [placeholder*="CVC" i]')
        .first()
        .fill(TEST_CARD_CVC);
      await paymentFrame
        .locator('[name="postalCode"], [placeholder*="ZIP" i]')
        .first()
        .fill(TEST_CARD_POSTAL)
        .catch(() => {});

      await page.getByRole("button", { name: /subscribe|pay/i }).click();

      await expect(page).toHaveURL(/\/passes\/active/, { timeout: 15_000 });
      await expect(page.getByText(/active/i).first()).toBeVisible();
    });
  }
);
