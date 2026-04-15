import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const customersCreateMock = vi.fn();
const setupIntentsCreateMock = vi.fn();
vi.mock("@/features/payments/stripe", () => ({
  getStripeClient: () => ({
    customers: { create: customersCreateMock },
    setupIntents: { create: setupIntentsCreateMock },
  }),
}));

import { createSetupIntent } from "../actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uid = Date.now();
const authUserIds: string[] = [];
const riderIds: string[] = [];

async function createTestRider() {
  const email = `setup-intent-${uid}-${authUserIds.length}@ultra.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create user: ${error?.message}`);
  authUserIds.push(data.user.id);

  const rider = await supabase
    .from("riders")
    .insert({ user_id: data.user.id, name: "Setup Intent Test" })
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
  customersCreateMock.mockReset();
  setupIntentsCreateMock.mockReset();
});

describe("createSetupIntent", () => {
  it("creates a SetupIntent bound to the rider's Stripe Customer and returns the client secret", async () => {
    const { riderId } = await createTestRider();

    customersCreateMock.mockResolvedValue({ id: "cus_test_seti_789" });
    setupIntentsCreateMock.mockResolvedValue({
      id: "seti_test_abc",
      client_secret: "seti_test_abc_secret_xyz",
    });

    const result = await createSetupIntent(riderId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.clientSecret).toBe("seti_test_abc_secret_xyz");
    expect(result.data.setupIntentId).toBe("seti_test_abc");

    // Card-only, bound to the rider's customer, off-session usage so the
    // saved method can be reused for future automatic charges.
    expect(setupIntentsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_test_seti_789",
        payment_method_types: ["card"],
        usage: "off_session",
        metadata: expect.objectContaining({ riderId }),
      })
    );
  });
});
