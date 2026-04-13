// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect };
  }
  if (table === "ride_passes") {
    return { insert: mockInsert, select: mockSelect, update: mockUpdate };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { getAvailablePasses, purchasePass, getActivePassForUser } from "../actions";

describe("ride pass actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockLimit.mockReset();
    mockLimit.mockReturnValue({ single: mockSingle });
    mockOrder.mockReset();
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockEq.mockClear();
    mockEq.mockReturnValue({ single: mockSingle, order: mockOrder, eq: mockEq });
    mockSelect.mockClear();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockFrom.mockClear();
  });

  it("getAvailablePasses returns the plan catalog with correct shapes", async () => {
    const plans = await getAvailablePasses();

    expect(plans).toHaveLength(2);
    expect(plans[0]).toEqual(
      expect.objectContaining({
        id: "plan-5",
        tier: "weekly-5",
        ridesPerWeek: 5,
        pricePerWeek: 75,
        pricePerRide: 15,
        savingsPerWeek: 25,
        recommended: true,
      }),
    );
    expect(plans[1]).toEqual(
      expect.objectContaining({
        id: "plan-10",
        tier: "weekly-10",
        ridesPerWeek: 10,
        pricePerWeek: 140,
      }),
    );
  });

  it("purchasePass rejects unauthenticated users", async () => {
    const result = await purchasePass("plan-5");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to purchase a ride pass.",
    });
  });

  it("purchasePass rejects an invalid planId", async () => {
    const result = await purchasePass("nonexistent-plan", "user-1");

    expect(result).toEqual({
      success: false,
      error: "Invalid ride pass plan.",
    });
  });

  it("purchasePass creates a ride_passes DB record and returns mapped ActiveRidePass", async () => {
    // Mock: riders lookup returns rider-1
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      // Mock: ride_passes insert returns the new row
      .mockResolvedValueOnce({
        data: {
          id: "pass-new",
          rider_id: "rider-1",
          plan_name: "weekly-5",
          plan_description: "5 rides per week",
          rides_total: 5,
          rides_remaining: 5,
          price_paid: "75.00",
          status: "active",
          stripe_subscription_id: null,
          purchased_at: "2026-04-13T00:00:00Z",
          expires_at: "2026-04-20T00:00:00Z",
          cancelled_at: null,
          cancellation_reason: null,
          version: 1,
          created_at: "2026-04-13T00:00:00Z",
          updated_at: "2026-04-13T00:00:00Z",
        },
        error: null,
      });

    const result = await purchasePass("plan-5", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("pass-new");
      expect(result.data.plan.tier).toBe("weekly-5");
      expect(result.data.plan.pricePerWeek).toBe(75);
      expect(result.data.status).toBe("active");
      expect(result.data.usedRides).toBe(0);
    }

    // Verify riders lookup
    expect(mockFrom).toHaveBeenCalledWith("riders");
    // Verify ride_passes insert
    expect(mockFrom).toHaveBeenCalledWith("ride_passes");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rider_id: "rider-1",
        plan_name: "weekly-5",
        rides_total: 5,
        rides_remaining: 5,
        price_paid: 75,
        status: "active",
      }),
    );
  });

  it("getActivePassForUser returns null when no active pass exists", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const result = await getActivePassForUser("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });
});
