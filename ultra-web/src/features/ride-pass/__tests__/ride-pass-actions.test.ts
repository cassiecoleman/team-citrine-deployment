// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));

// Chainable mock that returns itself for .eq(), .select(), .order(), .limit(), .single()
const createChainMock = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = mockSingle;
  return chain;
};

const mockRiderChain = createChainMock();
const mockPassChain = createChainMock();

const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockUpdate = vi.fn(() => mockPassChain);
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: () => mockRiderChain };
  }
  if (table === "ride_passes") {
    return {
      insert: mockInsert,
      select: () => mockPassChain,
      update: mockUpdate,
    };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import {
  getAvailablePasses,
  purchasePass,
  getActivePassForUser,
  decrementPassRide,
  cancelPass,
} from "../actions";

describe("ride pass actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockInsert.mockClear();
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockClear();
    mockUpdate.mockReturnValue(mockPassChain);
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

  it("getActivePassForUser returns an error on non-404 DB failure", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST500", message: "connection refused" } });

    const result = await getActivePassForUser("user-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to load ride pass right now.",
    });
  });

  it("getActivePassForUser returns mapped ActiveRidePass for an active pass", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "pass-42",
          rider_id: "rider-1",
          plan_name: "weekly-10",
          plan_description: "10 rides per week",
          rides_total: 10,
          rides_remaining: 7,
          price_paid: "140.00",
          status: "active",
          purchased_at: "2026-04-06T00:00:00Z",
          expires_at: "2026-04-13T00:00:00Z",
          version: 1,
        },
        error: null,
      });

    const result = await getActivePassForUser("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe("pass-42");
      expect(result.data!.plan.tier).toBe("weekly-10");
      expect(result.data!.plan.pricePerWeek).toBe(140);
      expect(result.data!.usedRides).toBe(3);
      expect(result.data!.status).toBe("active");
    }
  });

  it("decrementPassRide reduces rides_remaining by 1", async () => {
    mockSingle
      // rider lookup
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      // pass select
      .mockResolvedValueOnce({
        data: {
          id: "pass-1",
          rider_id: "rider-1",
          rides_remaining: 5,
          status: "active",
          version: 1,
        },
        error: null,
      })
      // pass update
      .mockResolvedValueOnce({
        data: { id: "pass-1", rides_remaining: 4, status: "active", version: 2 },
        error: null,
      });

    const result = await decrementPassRide("pass-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ridesRemaining).toBe(4);
    }
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        rides_remaining: 4,
        version: 2,
      }),
    );
  });

  it("decrementPassRide sets status to exhausted when rides reach 0", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "pass-1",
          rider_id: "rider-1",
          rides_remaining: 1,
          status: "active",
          version: 3,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "pass-1", rides_remaining: 0, status: "exhausted", version: 4 },
        error: null,
      });

    const result = await decrementPassRide("pass-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ridesRemaining).toBe(0);
    }
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        rides_remaining: 0,
        status: "exhausted",
        version: 4,
      }),
    );
  });

  it("decrementPassRide rejects when no rides remain", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "pass-1",
          rider_id: "rider-1",
          rides_remaining: 0,
          status: "exhausted",
          version: 5,
        },
        error: null,
      });

    const result = await decrementPassRide("pass-1", "user-1");

    expect(result).toEqual({
      success: false,
      error: "No rides remaining on this pass.",
    });
  });

  it("cancelPass sets status to cancelled with reason and timestamp", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "pass-1",
          rider_id: "rider-1",
          status: "active",
          version: 1,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "pass-1", status: "cancelled" },
        error: null,
      });

    const result = await cancelPass("pass-1", "Too expensive", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "pass-1", status: "cancelled" });
    }
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancellation_reason: "Too expensive",
      }),
    );
  });

  it("cancelPass rejects already-cancelled pass", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "pass-1",
          rider_id: "rider-1",
          status: "cancelled",
          version: 2,
        },
        error: null,
      });

    const result = await cancelPass("pass-1", "Changed mind", "user-1");

    expect(result).toEqual({
      success: false,
      error: "This pass is not active and cannot be cancelled.",
    });
  });
});
