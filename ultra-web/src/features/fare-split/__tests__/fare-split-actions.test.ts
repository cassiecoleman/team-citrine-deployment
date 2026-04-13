// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();

const createChainMock = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.single = mockSingle;
  return chain;
};

const mockRiderChain = createChainMock();
const mockSplitChain = createChainMock();

const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockUpdate = vi.fn(() => mockSplitChain);
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: () => mockRiderChain };
  }
  if (table === "fare_splits") {
    return {
      insert: mockInsert,
      select: () => mockSplitChain,
      update: mockUpdate,
    };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import {
  createFareSplit,
  acceptFareSplit,
  declineFareSplit,
  getFareSplitForRide,
} from "../actions";

describe("fare split actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockInsert.mockClear();
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockClear();
    mockUpdate.mockReturnValue(mockSplitChain);
    mockFrom.mockClear();
  });

  it("createFareSplit rejects unauthenticated users", async () => {
    const result = await createFareSplit({
      rideId: "ride-1",
      inviteeId: "rider-2",
      totalFare: 20,
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create a fare split.",
    });
  });

  it("createFareSplit validates input with Zod", async () => {
    const result = await createFareSplit(
      { rideId: "", inviteeId: "", totalFare: -5 },
      "user-1",
    );

    expect(result).toEqual({
      success: false,
      error: "Invalid fare split details.",
    });
  });

  it("createFareSplit inserts fare_splits row and returns mapped FareSplit", async () => {
    mockSingle
      // rider lookup (inviter)
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null })
      // fare_splits insert
      .mockResolvedValueOnce({
        data: {
          id: "split-new",
          ride_id: "ride-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          inviter_amount: 10,
          invitee_amount: 10,
          status: "pending",
          responded_at: null,
          expires_at: "2026-04-13T01:00:00Z",
          created_at: "2026-04-13T00:30:00Z",
          updated_at: "2026-04-13T00:30:00Z",
        },
        error: null,
      })
      // invitee name lookup
      .mockResolvedValueOnce({ data: { id: "rider-2", name: "Kenji" }, error: null });

    const result = await createFareSplit(
      {
        rideId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        inviteeId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        totalFare: 20,
      },
      "user-1",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("split-new");
      expect(result.data.originalFare).toBe(20);
      expect(result.data.perPersonFare).toBe(10);
      expect(result.data.riders).toHaveLength(2);
      expect(result.data.riders[0].user.name).toBe("Aisha");
      expect(result.data.riders[1].user.name).toBe("Kenji");
      expect(result.data.riders[1].status).toBe("pending");
    }

    expect(mockFrom).toHaveBeenCalledWith("fare_splits");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        inviter_amount: 10,
        invitee_amount: 10,
        status: "pending",
      }),
    );
  });

  it("acceptFareSplit updates status to accepted", async () => {
    mockSingle
      // rider lookup
      .mockResolvedValueOnce({ data: { id: "rider-2", name: "Kenji" }, error: null })
      // split select
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          inviter_amount: 10,
          invitee_amount: 10,
          status: "pending",
        },
        error: null,
      })
      // split update
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          ride_id: "ride-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          inviter_amount: 10,
          invitee_amount: 10,
          status: "accepted",
          responded_at: "2026-04-13T01:00:00Z",
          expires_at: "2026-04-13T01:30:00Z",
        },
        error: null,
      })
      // inviter name lookup
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null });

    const result = await acceptFareSplit("split-1", "user-2");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riders[1].status).toBe("accepted");
    }
  });

  it("acceptFareSplit rejects when caller is not the invitee", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          status: "pending",
        },
        error: null,
      });

    const result = await acceptFareSplit("split-1", "user-1");

    expect(result).toEqual({
      success: false,
      error: "Only the invitee can accept a fare split.",
    });
  });

  it("acceptFareSplit rejects non-pending splits", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-2", name: "Kenji" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          status: "accepted",
        },
        error: null,
      });

    const result = await acceptFareSplit("split-1", "user-2");

    expect(result).toEqual({
      success: false,
      error: "This fare split is no longer pending.",
    });
  });

  it("declineFareSplit updates status to declined", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-2" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          status: "pending",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "split-1", status: "declined" },
        error: null,
      });

    const result = await declineFareSplit("split-1", "user-2");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "split-1", status: "declined" });
    }
  });

  it("declineFareSplit rejects when caller is not invitee", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          status: "pending",
        },
        error: null,
      });

    const result = await declineFareSplit("split-1", "user-1");

    expect(result).toEqual({
      success: false,
      error: "Only the invitee can decline a fare split.",
    });
  });

  it("getFareSplitForRide returns mapped split for participant", async () => {
    mockSingle
      // rider lookup
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null })
      // split select
      .mockResolvedValueOnce({
        data: {
          id: "split-1",
          ride_id: "ride-1",
          inviter_id: "rider-1",
          invitee_id: "rider-2",
          inviter_amount: 9.5,
          invitee_amount: 9.5,
          status: "accepted",
          responded_at: "2026-04-13T01:00:00Z",
          expires_at: "2026-04-13T01:30:00Z",
        },
        error: null,
      })
      // other rider name lookup
      .mockResolvedValueOnce({ data: { id: "rider-2", name: "Kenji" }, error: null });

    const result = await getFareSplitForRide("ride-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe("split-1");
      expect(result.data!.originalFare).toBe(19);
      expect(result.data!.riders).toHaveLength(2);
    }
  });

  it("getFareSplitForRide returns null when no split exists", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const result = await getFareSplitForRide("ride-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("getFareSplitForRide returns an error on non-404 DB failure", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1", name: "Aisha" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST500", message: "connection refused" } });

    const result = await getFareSplitForRide("ride-1", "user-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to load fare split right now.",
    });
  });
});
