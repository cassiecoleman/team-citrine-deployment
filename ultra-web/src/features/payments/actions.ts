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
      // Explicit card-only to avoid "payment method not activated" warnings
      // for wallets/BNPL methods the Stripe test account hasn't enabled.
      payment_method_types: ["card"],
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

export interface ConfirmPassPurchaseInput {
  paymentIntentId: string;
}

export interface ConfirmPassPurchaseResult {
  passId: string;
}

/**
 * Record a successful ride pass PaymentIntent by creating the ride_passes
 * row. Re-verifies with Stripe (never trust the client): if the intent's
 * server-side status is not `succeeded`, refuse to create the pass.
 *
 * This is the "optimistic client-recorded" path used for the demo phase.
 * Issue #60 replaces this with the webhook handler as the authoritative
 * source of success events.
 */
export async function confirmPassPurchase(
  input: ConfirmPassPurchaseInput
): Promise<PaymentActionResult<ConfirmPassPurchaseResult>> {
  let intent;
  try {
    const stripe = getStripeClient();
    intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Stripe lookup failed: ${message}`,
    };
  }

  if (intent.status !== "succeeded") {
    return {
      success: false,
      error: `PaymentIntent is not succeeded (status: ${intent.status}).`,
    };
  }

  const metadata = intent.metadata ?? {};
  if (metadata.kind !== "ride_pass") {
    return {
      success: false,
      error: `Unexpected PaymentIntent kind: ${metadata.kind ?? "unknown"}.`,
    };
  }

  const planId = metadata.planId;
  const riderId = metadata.riderId;
  if (!planId || !riderId) {
    return {
      success: false,
      error: "PaymentIntent is missing planId or riderId metadata.",
    };
  }

  const plan = RIDE_PASS_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return { success: false, error: `Invalid plan in metadata: ${planId}.` };
  }

  const supabase = createServiceRoleClient();
  const existingPassResult = await supabase
    .from("ride_passes")
    .select("id")
    .eq("stripe_subscription_id", intent.id)
    .limit(1)
    .maybeSingle();

  if (existingPassResult.error) {
    return {
      success: false,
      error: `Unable to check existing pass purchase: ${existingPassResult.error.message}.`,
    };
  }

  if (existingPassResult.data) {
    return { success: true, data: { passId: existingPassResult.data.id } };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const passResult = await supabase
    .from("ride_passes")
    .insert({
      rider_id: riderId,
      plan_name: plan.tier,
      plan_description: `${plan.ridesPerWeek} rides per week`,
      rides_total: plan.ridesPerWeek,
      rides_remaining: plan.ridesPerWeek,
      price_paid: plan.pricePerWeek,
      status: "active",
      purchased_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      stripe_subscription_id: intent.id,
    })
    .select("id")
    .single();

  if (passResult.error || !passResult.data) {
    return {
      success: false,
      error: `Unable to record pass purchase: ${passResult.error?.message ?? "unknown"}.`,
    };
  }

  return { success: true, data: { passId: passResult.data.id } };
}
