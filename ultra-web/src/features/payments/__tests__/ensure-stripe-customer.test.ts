import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const createCustomerMock = vi.fn();
vi.mock("@/features/payments/stripe", () => ({
  getStripeClient: () => ({
    customers: { create: createCustomerMock },
  }),
}));

import { ensureStripeCustomer } from "../actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uid = Date.now();
const authUserIds: string[] = [];
const riderIds: string[] = [];

async function createTestRider() {
  const email = `ensure-cust-${uid}-${authUserIds.length}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create user: ${error?.message}`);
  authUserIds.push(data.user.id);

  const rider = await supabase
    .from("riders")
    .insert({ user_id: data.user.id, name: "Ensure Test" })
    .select()
    .single();
  if (rider.error || !rider.data) throw new Error(`create rider: ${rider.error?.message}`);
  riderIds.push(rider.data.id);

  return { userId: data.user.id, riderId: rider.data.id, email };
}

afterAll(async () => {
  for (const id of riderIds) await supabase.from("riders").delete().eq("id", id);
  for (const id of authUserIds) await supabase.auth.admin.deleteUser(id);
});

beforeEach(() => {
  createCustomerMock.mockReset();
});

describe("ensureStripeCustomer", () => {
  it("creates a Stripe Customer when none exists and persists the id", async () => {
    const { riderId, email } = await createTestRider();

    createCustomerMock.mockResolvedValue({ id: "cus_test_new_123" });

    const result = await ensureStripeCustomer(riderId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stripeCustomerId).toBe("cus_test_new_123");

    // Called with rider's email for Stripe dashboard clarity
    expect(createCustomerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email,
        metadata: expect.objectContaining({ riderId }),
      })
    );

    // Persisted back to the rider row
    const { data: riderRow } = await supabase
      .from("riders")
      .select("stripe_customer_id")
      .eq("id", riderId)
      .single();
    expect(riderRow?.stripe_customer_id).toBe("cus_test_new_123");
  });

  it("returns the existing id without calling Stripe when the rider already has one", async () => {
    const { riderId } = await createTestRider();

    // Pre-seed an existing customer id on the row
    await supabase
      .from("riders")
      .update({ stripe_customer_id: "cus_test_existing_456" })
      .eq("id", riderId);

    const result = await ensureStripeCustomer(riderId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stripeCustomerId).toBe("cus_test_existing_456");
    expect(createCustomerMock).not.toHaveBeenCalled();
  });
});
