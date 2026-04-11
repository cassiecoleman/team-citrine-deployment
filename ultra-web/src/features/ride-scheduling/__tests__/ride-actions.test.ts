// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRide, scheduleRide } from "../actions";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect };
  }
  if (table === "rides") {
    return { insert: mockInsert };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("ride scheduling actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an auth error when creating an immediate ride without a user context", async () => {
    const result = await createRide({
      pickup: { lat: 35.1495, lng: -90.049, address: "123 Beale St, Memphis, TN" },
      dropoff: {
        lat: 35.1174,
        lng: -89.9711,
        address: "456 Elvis Presley Blvd, Memphis, TN",
      },
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to request a ride.",
    });
  });

  it("creates an immediate ride with requested status for the signed-in rider", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: { id: "ride-1", status: "requested", rider_id: "rider-1" },
        error: null,
      });

    const result = await createRide(
      {
        pickup: { lat: 35.1495, lng: -90.049, address: "123 Beale St, Memphis, TN" },
        dropoff: {
          lat: 35.1174,
          lng: -89.9711,
          address: "456 Elvis Presley Blvd, Memphis, TN",
        },
      },
      "user-1",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("ride-1");
      expect(result.data.status).toBe("requested");
    }
    expect(mockFrom).toHaveBeenCalledWith("riders");
    expect(mockFrom).toHaveBeenCalledWith("rides");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rider_id: "rider-1",
        status: "requested",
      }),
    );
  });

  it("rejects scheduled rides outside the 7-day booking window", async () => {
    const inEightDays = new Date();
    inEightDays.setDate(inEightDays.getDate() + 8);

    const result = await scheduleRide(
      {
        pickup: { lat: 35.1495, lng: -90.049, address: "123 Beale St, Memphis, TN" },
        dropoff: {
          lat: 35.1174,
          lng: -89.9711,
          address: "456 Elvis Presley Blvd, Memphis, TN",
        },
        scheduledFor: inEightDays.toISOString(),
      },
      "user-1",
    );

    expect(result).toEqual({
      success: false,
      error: "Scheduled rides must be within the next 7 days.",
    });
  });
});
