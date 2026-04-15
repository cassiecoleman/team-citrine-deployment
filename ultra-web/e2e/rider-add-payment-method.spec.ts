import { expect, test } from "@playwright/test";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

/**
 * Issue #54 — Add a payment method via Stripe Setup Intents.
 *
 * Session-injection variant, for the same reason as issue #31's e2e:
 * PR #51's /login page hasn't landed yet. Once it does, a companion
 * login-flow spec can drive the same assertions through the UI form.
 *
 * The flow:
 *   /profile/payment-methods/add -> Stripe Payment Element in SetupIntent
 *   mode -> fill test card -> click Save -> in-page "Card saved"
 *   confirmation.
 */

const TEST_CARD_NUMBER = "4242 4242 4242 4242";
const TEST_CARD_EXP = "12 / 34";
const TEST_CARD_CVC = "123";

test.describe("Issue #54 — add payment method (session-injected)", () => {
  let rider: TestUser;

  test.beforeAll(async () => {
    rider = await createTestRider("e2e-save-card");
  });

  test.afterAll(async () => {
    if (rider?.userId) {
      await deleteTestUser(rider.userId);
    }
  });

  test.beforeEach(async ({ context }) => {
    await injectAuthenticatedSession(context, rider);
  });

  test("signed-in rider sees the add payment method page", async ({ page }) => {
    await page.goto("/profile/payment-methods/add");

    await expect(page).toHaveURL(/\/profile\/payment-methods\/add$/);
    await expect(page.getByText(/add a payment method/i)).toBeVisible();
  });

  test("page mounts the Stripe Payment Element in setup mode", async ({ page }) => {
    await page.goto("/profile/payment-methods/add");

    const stripeFrame = page
      .locator('iframe[src*="elements-inner-accessory-target"]')
      .first();
    await expect(stripeFrame).toBeVisible({ timeout: 10_000 });
  });

  test("filling the test card and clicking Save attaches the payment method", async ({
    page,
  }) => {
    // SetupIntent confirm roundtrip plus Stripe load takes a bit.
    test.setTimeout(90_000);

    await page.goto("/profile/payment-methods/add");

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

    // Stripe's floating dev-tools badge intercepts normal clicks in some
    // viewports; force through it.
    await page
      .getByRole("button", { name: /save card|saving/i })
      .click({ force: true });

    // Success state: SavePaymentMethodForm swaps its form for a green
    // confirmation with "Card saved."
    await expect(page.getByText(/card saved/i)).toBeVisible({ timeout: 30_000 });
  });
});
