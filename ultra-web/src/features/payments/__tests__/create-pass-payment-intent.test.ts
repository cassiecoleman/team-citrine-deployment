import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Mock Stripe BEFORE importing the action that uses it.
const createPaymentIntentMock = vi.fn();
vi.mock("@/features/payments/stripe", () => ({
  getStripeClient: () => ({
    paymentIntents: { create: createPaymentIntentMock },
  }),
}));

import { createPassPaymentIntent } from "../actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uid = Date.now();
const authUserIds: string[] = [];
const riderIds: string[] = [];

async function createTestRider() {
  const email = `pay-intent-${uid}-${authUserIds.length}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create user failed: ${error?.message}`);
  authUserIds.push(data.user.id);

  const rider = await supabase
    .from("riders")
    .insert({ user_id: data.user.id, name: "Pay Intent Test" })
    .select()
    .single();
  if (rider.error || !rider.data) throw new Error(`create rider failed: ${rider.error?.message}`);
  riderIds.push(rider.data.id);

  return { userId: data.user.id, riderId: rider.data.id };
}

afterAll(async () => {
  for (const id of riderIds) await supabase.from("riders").delete().eq("id", id);
  for (const id of authUserIds) await supabase.auth.admin.deleteUser(id);
});

beforeEach(() => {
  createPaymentIntentMock.mockReset();
});

describe("createPassPaymentIntent", () => {
  it("creates a Stripe PaymentIntent for the selected plan and returns the client secret", async () => {
    const { userId, riderId } = await createTestRider();

    createPaymentIntentMock.mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
    });

    const result = await createPassPaymentIntent({ planId: "plan-5", userId });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.clientSecret).toBe("pi_test_123_secret_abc");
    expect(result.data.paymentIntentId).toBe("pi_test_123");

    // Amount = $75 = 7500 cents. Currency = usd. Metadata carries enough
    // context for confirmPassPurchase to reconstruct the row.
    expect(createPaymentIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 7500,
        currency: "usd",
        metadata: expect.objectContaining({
          planId: "plan-5",
          riderId,
          kind: "ride_pass",
        }),
      })
    );
  });
});
