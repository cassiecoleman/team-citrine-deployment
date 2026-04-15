import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

/**
 * Issue #55 — List saved payment methods at /profile/payment-methods.
 *
 * Two scenarios:
 * - Empty state: rider has never saved a card -> sees "add your first card" CTA
 * - Populated state: we attach a Stripe test payment method directly via
 *   the Stripe API (bypassing the Add form, which is covered by issue #54's
 *   e2e), then verify the list page shows it with the "Default" tag.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Track Stripe customers we create so we can clean them up afterAll.
const stripeCustomerIds: string[] = [];

async function attachTestCardToRider(riderId: string): Promise<string> {
  const stripe = getStripe();

  // Look up the rider's Stripe customer id (or create one).
  const { data: rider } = await supabaseAdmin
    .from("riders")
    .select("stripe_customer_id, name, user_id")
    .eq("id", riderId)
    .single();
  if (!rider) throw new Error(`rider ${riderId} not found`);

  let customerId = rider.stripe_customer_id;
  if (!customerId) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      rider.user_id
    );
    const customer = await stripe.customers.create({
      email: authUser?.user?.email ?? undefined,
      name: rider.name,
      metadata: { riderId, testFixture: "true" },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("riders")
      .update({ stripe_customer_id: customerId })
      .eq("id", riderId);
  }

  // Use Stripe's canned test payment method "pm_card_visa" — attaching it
  // to a customer makes it retrievable via paymentMethods.list.
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pm.id },
  });

  stripeCustomerIds.push(customerId);
  return pm.id;
}

test.describe("Issue #55 — list payment methods (session-injected)", () => {
  test.afterAll(async () => {
    const stripe = getStripe();
    for (const customerId of stripeCustomerIds) {
      await stripe.customers.del(customerId).catch(() => {});
    }
  });

  test("empty state: rider with no saved cards sees 'Add your first card' CTA", async ({
    context,
    page,
  }) => {
    const rider: TestUser = await createTestRider("e2e-list-empty");
    try {
      await injectAuthenticatedSession(context, rider);

      await page.goto("/profile/payment-methods");

      await expect(page).toHaveURL(/\/profile\/payment-methods$/);
      await expect(page.getByText(/don.?t have any saved cards/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /add your first card/i })).toBeVisible();
    } finally {
      await deleteTestUser(rider.userId);
    }
  });

  test("populated state: attached card appears in the list with the Default tag", async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);

    const rider: TestUser = await createTestRider("e2e-list-populated");
    try {
      await attachTestCardToRider(
        // Need the rider row id, not the auth user id. Look it up.
        (
          await supabaseAdmin
            .from("riders")
            .select("id")
            .eq("user_id", rider.userId)
            .single()
        ).data!.id
      );

      await injectAuthenticatedSession(context, rider);
      await page.goto("/profile/payment-methods");

      const list = page.getByTestId("payment-methods-list");
      await expect(list).toBeVisible();
      await expect(list.getByText(/Visa/i)).toBeVisible();
      await expect(list.getByText(/····4242/)).toBeVisible();
      await expect(list.getByText(/Default/)).toBeVisible();
    } finally {
      await deleteTestUser(rider.userId);
    }
  });
});
