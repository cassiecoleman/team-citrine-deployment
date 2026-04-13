// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();

const createChainMock = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn(() => chain);
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
});
