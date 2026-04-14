import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const retrievePaymentIntentMock = vi.fn();
vi.mock("@/features/payments/stripe", () => ({
  getStripeClient: () => ({
    paymentIntents: { retrieve: retrievePaymentIntentMock },
  }),
}));

import { confirmPassPurchase } from "../actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uid = Date.now();
const authUserIds: string[] = [];
const riderIds: string[] = [];
const passIds: string[] = [];

async function createTestRider() {
  const email = `confirm-pass-${uid}-${authUserIds.length}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create user failed: ${error?.message}`);
  authUserIds.push(data.user.id);

  const rider = await supabase
    .from("riders")
    .insert({ user_id: data.user.id, name: "Confirm Pass Test" })
    .select()
    .single();
  if (rider.error || !rider.data) throw new Error(`create rider failed: ${rider.error?.message}`);
  riderIds.push(rider.data.id);

  return { userId: data.user.id, riderId: rider.data.id };
}

afterAll(async () => {
  for (const id of passIds) await supabase.from("ride_passes").delete().eq("id", id);
  for (const id of riderIds) await supabase.from("riders").delete().eq("id", id);
  for (const id of authUserIds) await supabase.auth.admin.deleteUser(id);
});

beforeEach(() => {
  retrievePaymentIntentMock.mockReset();
});

describe("confirmPassPurchase", () => {
  it("creates a ride_passes row when the Stripe intent is succeeded", async () => {
    const { riderId } = await createTestRider();

    retrievePaymentIntentMock.mockResolvedValue({
      id: "pi_test_success",
      status: "succeeded",
      amount: 7500,
      currency: "usd",
      metadata: { kind: "ride_pass", planId: "plan-5", riderId },
    });

    const result = await confirmPassPurchase({ paymentIntentId: "pi_test_success" });

    expect(result.success).toBe(true);
    if (!result.success) return;
    passIds.push(result.data.passId);

    const { data: passRow } = await supabase
      .from("ride_passes")
      .select("rider_id, status, rides_total, rides_remaining, stripe_subscription_id")
      .eq("id", result.data.passId)
      .single();

    expect(passRow).toMatchObject({
      rider_id: riderId,
      status: "active",
      rides_total: 5,
      rides_remaining: 5,
      stripe_subscription_id: "pi_test_success",
    });
  });

  it("refuses to create a pass when the Stripe intent is not succeeded", async () => {
    retrievePaymentIntentMock.mockResolvedValue({
      id: "pi_test_pending",
      status: "requires_payment_method",
      metadata: { kind: "ride_pass", planId: "plan-5", riderId: "irrelevant" },
    });

    const result = await confirmPassPurchase({ paymentIntentId: "pi_test_pending" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/not succeeded/i);
  });
});
