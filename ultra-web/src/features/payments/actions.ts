"use server";

import { createServiceRoleClient } from "@/lib/supabase-server";
import { RIDE_PASS_PLANS } from "@/features/ride-pass/plan-catalog";
import { getStripeClient } from "./stripe";

export type PaymentActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface CreatePassPaymentIntentInput {
  planId: string;
  userId?: string;
}

export interface PaymentIntentClientContext {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
}

/**
 * Create a Stripe PaymentIntent for a ride pass purchase.
 *
 * Returns the client_secret needed to confirm the payment via
 * stripe.confirmPayment() in the browser. Does NOT write to the
 * ride_passes table — that happens in confirmPassPurchase() after
 * the client confirms the intent.
 */
export async function createPassPaymentIntent(
  input: CreatePassPaymentIntentInput
): Promise<PaymentActionResult<PaymentIntentClientContext>> {
  if (!input.userId) {
    return {
      success: false,
      error: "You must be signed in to purchase a ride pass.",
    };
  }

  const plan = RIDE_PASS_PLANS.find((p) => p.id === input.planId);
  if (!plan) {
    return { success: false, error: "Invalid ride pass plan." };
  }

  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", input.userId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return {
      success: false,
      error: "No rider profile found for this account.",
    };
  }

  const amountCents = Math.round(plan.pricePerWeek * 100);
  const currency = "usd";

  try {
    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        kind: "ride_pass",
        planId: plan.id,
        riderId: riderResult.data.id,
      },
    });

    if (!intent.client_secret) {
      return {
        success: false,
        error: "Stripe did not return a client_secret for the PaymentIntent.",
      };
    }

    return {
      success: true,
      data: {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amountCents,
        currency,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Unable to initialize payment: ${message}`,
    };
  }
}
