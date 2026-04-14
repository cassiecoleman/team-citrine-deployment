// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { matchDriver } from "../actions";

const rideSingle = vi.fn();
const matchedRideSingle = vi.fn();
const availableDriversEq = vi.fn();
const driverLocationsIn = vi.fn();
const historyInsert = vi.fn();

const ridesSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    single: rideSingle,
  })),
}));

const ridesUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({
    select: () => ({
      single: matchedRideSingle,
    }),
  })),
}));

const driversSelect = vi.fn(() => ({
  eq: availableDriversEq,
}));

const driverLocationsSelect = vi.fn(() => ({
  in: driverLocationsIn,
}));

const mockFrom = vi.fn((table: string) => {
  if (table === "rides") {
    return { select: ridesSelect, update: ridesUpdate };
  }

  if (table === "drivers") {
    return { select: driversSelect };
  }

  if (table === "driver_locations") {
    return { select: driverLocationsSelect };
  }

  if (table === "ride_status_history") {
    return { insert: historyInsert };
  }

  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("matchDriver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rideSingle.mockReset();
    matchedRideSingle.mockReset();
    availableDriversEq.mockReset();
    driverLocationsIn.mockReset();
    historyInsert.mockReset();
    historyInsert.mockResolvedValue({ error: null });
  });

  it("assigns the nearest available driver to the ride", async () => {
    rideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-1",
        rider_id: "rider-1",
        pickup_lat: 35.1495,
        pickup_lng: -90.049,
        status: "matching",
        is_child_safe_required: false,
        prefer_trusted_driver: false,
      },
      error: null,
    });

    availableDriversEq.mockResolvedValueOnce({
      data: [
        { id: "driver-near", status: "available", is_child_safe: false },
        { id: "driver-far", status: "available", is_child_safe: false },
      ],
      error: null,
    });

    driverLocationsIn.mockResolvedValueOnce({
      data: [
        { driver_id: "driver-near", lat: 35.15, lng: -90.05 },
        { driver_id: "driver-far", lat: 35.2, lng: -90.1 },
      ],
      error: null,
    });

    matchedRideSingle.mockResolvedValueOnce({
      data: { id: "ride-1", status: "driver_en_route", driver_id: "driver-near" },
      error: null,
    });

    const result = await matchDriver("ride-1");

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-1",
        status: "driver_en_route",
        driverId: "driver-near",
      },
    });
    expect(ridesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-near",
        status: "driver_en_route",
      }),
    );
  });
});
