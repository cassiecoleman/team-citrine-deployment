import { expect, test } from "@playwright/test";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

/**
 * Issue #31 — Ride pass purchase via Stripe Elements, session-injection variant.
 *
 * This test authenticates by writing Supabase session cookies directly into
 * the browser context, bypassing the login UI entirely. It runs today,
 * before the login/register pages (PR #51) land, so that Stripe integration
 * work on issue #31 can progress in parallel with the auth UI work.
 *
 * The flow exercised:
 *   /passes -> click plan -> /passes/review -> Stripe Payment Element mounts ->
 *   fill test card -> click Subscribe -> in-page confirmation -> /passes/active
 *
 * We assert on Stripe Elements iframe presence (no redirect to
 * checkout.stripe.com — this is the embedded Elements flow, not hosted
 * Checkout). These tests are RED today and will go GREEN once issue #31
 * wires up createPaymentIntent() and mounts <PaymentElement /> on the
 * review page.
 */

// Stripe test card that always succeeds in test mode.
const TEST_CARD_NUMBER = "4242 4242 4242 4242";
const TEST_CARD_EXP = "12 / 34";
const TEST_CARD_CVC = "123";
const TEST_CARD_POSTAL = "90210";

test.describe("Issue #31 — ride pass Stripe Elements (session-injected)", () => {
  let rider: TestUser;

  test.beforeAll(async () => {
    rider = await createTestRider("e2e-stripe-elements");
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

  test("review page mounts the Stripe Payment Element", async ({ page }) => {
    await page.goto("/passes");
    await page.getByText("Weekly Commute").click();

    await expect(page).toHaveURL(/\/passes\/review/);

    // Stripe Payment Element renders inside an iframe whose name begins
    // with "__privateStripeFrame". Its title includes "payment input" or
    // "card" depending on the Element mode and country.
    //
    // RED today: no Stripe iframe exists on the review page. GREEN once
    // <PaymentElement /> is mounted with a client secret from
    // createPaymentIntent().
    const stripeFrame = page.locator('iframe[name^="__privateStripeFrame"]').first();
    await expect(stripeFrame).toBeVisible({ timeout: 10_000 });
  });

  test("filling the test card and clicking Subscribe completes the purchase", async ({
    page,
  }) => {
    await page.goto("/passes");
    await page.getByText("Weekly Commute").click();
    await expect(page).toHaveURL(/\/passes\/review/);

    // Target the card-number input inside Stripe's iframe. Stripe nests
    // the individual inputs inside one outer Payment Element iframe, so
    // we drill into it with frameLocator.
    //
    // RED today: iframe doesn't exist -> frameLocator operations time out.
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
      .catch(() => {
        // Postal field is only rendered for some billing configurations.
        // Ignore if Stripe doesn't request it.
      });

    await page.getByRole("button", { name: /subscribe|pay/i }).click();

    // After stripe.confirmPayment() resolves successfully, the client
    // should call recordPaymentSuccess() on the server and route the
    // rider to /passes/active.
    //
    // RED today: no Elements integration, subscribe redirects to
    // /passes/active directly without ever hitting Stripe. That coincidentally
    // passes this URL assertion — but the card-fill steps above will fail
    // first, which is what we want.
    await expect(page).toHaveURL(/\/passes\/active/, { timeout: 15_000 });
    await expect(page.getByText(/active/i).first()).toBeVisible();
  });
});
