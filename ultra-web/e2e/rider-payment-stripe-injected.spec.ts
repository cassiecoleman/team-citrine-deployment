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
    // Stripe Elements + real PaymentIntent roundtrip takes longer than the
    // default 30s test timeout.
    test.setTimeout(90_000);

    await page.goto("/passes");
    await page.getByText("Weekly Commute").click();
    await expect(page).toHaveURL(/\/passes\/review/);

    // Stripe's unified Payment Element nests its fields inside an iframe
    // titled "Secure payment input frame". (There are several other
    // __privateStripeFrame iframes for internal controllers; they don't
    // contain the card inputs.)
    // PaymentForm configures the Payment Element with
    //   layout: { defaultCollapsed: false }  (no accordion click needed)
    //   fields.billingDetails.address: 'never'  (no ZIP field rendered)
    // so we only need to fill card number, expiry, and CVC.
    const paymentFrame = page.frameLocator(
      'iframe[src*="elements-inner-accessory-target"]'
    );

    await paymentFrame
      .locator('input[autocomplete="cc-number"]')
      .pressSequentially(TEST_CARD_NUMBER.replace(/\s/g, ""), { delay: 10 });
    await paymentFrame
      .locator('input[autocomplete="cc-exp"]')
      .pressSequentially(TEST_CARD_EXP.replace(/[\s/]/g, ""), { delay: 10 });
    await paymentFrame
      .locator('input[autocomplete="cc-csc"]')
      .pressSequentially(TEST_CARD_CVC, { delay: 10 });

    // Force-click to bypass Stripe's "developer tools" floating overlay
    // which intercepts normal click events in the bottom-right corner.
    await page.getByRole("button", { name: /subscribe|pay/i }).click({ force: true });

    // stripe.confirmPayment() with test card 4242... auto-succeeds; the
    // client then calls confirmPassPurchase() and routes to /passes/active.
    await expect(page).toHaveURL(/\/passes\/active/, { timeout: 30_000 });
    await expect(page.getByText(/active/i).first()).toBeVisible();
  });
});
