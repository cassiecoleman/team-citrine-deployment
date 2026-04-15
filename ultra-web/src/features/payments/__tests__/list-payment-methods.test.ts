import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const paymentMethodsListMock = vi.fn();
const customersRetrieveMock = vi.fn();
vi.mock("@/features/payments/stripe", () => ({
  getStripeClient: () => ({
    paymentMethods: { list: paymentMethodsListMock },
    customers: { retrieve: customersRetrieveMock },
  }),
}));

import { listPaymentMethods } from "../actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uid = Date.now();
const authUserIds: string[] = [];
const riderIds: string[] = [];

async function createTestRider(opts: { stripeCustomerId?: string } = {}) {
  const email = `list-pm-${uid}-${authUserIds.length}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create user: ${error?.message}`);
  authUserIds.push(data.user.id);

  const rider = await supabase
    .from("riders")
    .insert({
      user_id: data.user.id,
      name: "List PM Test",
      stripe_customer_id: opts.stripeCustomerId ?? null,
    })
    .select()
    .single();
  if (rider.error || !rider.data) throw new Error(`create rider: ${rider.error?.message}`);
  riderIds.push(rider.data.id);

  return { userId: data.user.id, riderId: rider.data.id };
}

afterAll(async () => {
  for (const id of riderIds) await supabase.from("riders").delete().eq("id", id);
  for (const id of authUserIds) await supabase.auth.admin.deleteUser(id);
});

beforeEach(() => {
  paymentMethodsListMock.mockReset();
  customersRetrieveMock.mockReset();
});

describe("listPaymentMethods", () => {
  it("returns an empty list when the rider has no Stripe Customer yet", async () => {
    const { riderId } = await createTestRider();

    const result = await listPaymentMethods(riderId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.methods).toEqual([]);
    expect(paymentMethodsListMock).not.toHaveBeenCalled();
  });

  it("returns saved cards with brand/last4/exp and marks the default", async () => {
    const { riderId } = await createTestRider({ stripeCustomerId: "cus_test_list" });

    paymentMethodsListMock.mockResolvedValue({
      data: [
        {
          id: "pm_card_visa_1",
          card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2034 },
        },
        {
          id: "pm_card_mc_2",
          card: { brand: "mastercard", last4: "5555", exp_month: 6, exp_year: 2030 },
        },
      ],
    });

    customersRetrieveMock.mockResolvedValue({
      id: "cus_test_list",
      invoice_settings: { default_payment_method: "pm_card_mc_2" },
    });

    const result = await listPaymentMethods(riderId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.methods).toEqual([
      {
        id: "pm_card_visa_1",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2034,
        isDefault: false,
      },
      {
        id: "pm_card_mc_2",
        brand: "mastercard",
        last4: "5555",
        expMonth: 6,
        expYear: 2030,
        isDefault: true,
      },
    ]);

    expect(paymentMethodsListMock).toHaveBeenCalledWith({
      customer: "cus_test_list",
      type: "card",
    });
  });
});
