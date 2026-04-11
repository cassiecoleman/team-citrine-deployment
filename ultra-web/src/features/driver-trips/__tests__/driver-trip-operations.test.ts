// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptTrip } from "../actions";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

const mockRideUpdateSingle = vi.fn();
const mockRideUpdateSelect = vi.fn(() => ({ single: mockRideUpdateSingle }));
const mockRideUpdateEq = vi.fn(() => ({ select: mockRideUpdateSelect }));
const mockRideUpdate = vi.fn(() => ({ eq: mockRideUpdateEq }));

const mockFrom = vi.fn((table: string) => {
  if (table === "drivers") {
    return { select: mockSelect };
  }

  if (table === "rides") {
    return { update: mockRideUpdate };
  }

  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("driver trip operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a matching trip, assigns the driver, and moves status to driver_en_route", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
      error: null,
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "driver_en_route",
        driverId: "driver-1",
      },
    });

    expect(mockFrom).toHaveBeenCalledWith("drivers");
    expect(mockFrom).toHaveBeenCalledWith("rides");
    expect(mockRideUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "driver_en_route",
        driver_id: "driver-1",
      }),
    );
    expect(mockRideUpdateEq).toHaveBeenCalledWith("id", "ride-22");
  });
});
