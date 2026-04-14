// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { matchDriver } from "../actions";

const rideSingle = vi.fn();
const matchedRideSingle = vi.fn();
const availableDriversEq = vi.fn();
const driverLocationsIn = vi.fn();
const trustedDriversEq = vi.fn();
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

const trustedDriversSelect = vi.fn(() => ({
  eq: trustedDriversEq,
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

  if (table === "trusted_drivers") {
    return { select: trustedDriversSelect };
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
    trustedDriversEq.mockReset();
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

  it("prefers a trusted driver before a closer non-trusted driver", async () => {
    rideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-2",
        rider_id: "rider-1",
        pickup_lat: 35.1495,
        pickup_lng: -90.049,
        status: "matching",
        is_child_safe_required: false,
        prefer_trusted_driver: true,
      },
      error: null,
    });

    availableDriversEq.mockResolvedValueOnce({
      data: [
        { id: "driver-trusted", status: "available", is_child_safe: false },
        { id: "driver-closer", status: "available", is_child_safe: false },
      ],
      error: null,
    });

    trustedDriversEq.mockResolvedValueOnce({
      data: [{ driver_id: "driver-trusted" }],
      error: null,
    });

    driverLocationsIn.mockResolvedValueOnce({
      data: [
        { driver_id: "driver-trusted", lat: 35.17, lng: -90.07 },
        { driver_id: "driver-closer", lat: 35.1501, lng: -90.0491 },
      ],
      error: null,
    });

    matchedRideSingle.mockResolvedValueOnce({
      data: { id: "ride-2", status: "driver_en_route", driver_id: "driver-trusted" },
      error: null,
    });

    const result = await matchDriver("ride-2");

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-2",
        status: "driver_en_route",
        driverId: "driver-trusted",
      },
    });
    expect(ridesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-trusted",
      }),
    );
  });

  it("filters to child-safe drivers for child-safe rides", async () => {
    rideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-child-1",
        rider_id: "rider-1",
        pickup_lat: 35.1495,
        pickup_lng: -90.049,
        status: "matching",
        is_child_safe_required: true,
        prefer_trusted_driver: false,
      },
      error: null,
    });

    availableDriversEq.mockResolvedValueOnce({
      data: [
        { id: "driver-closer", status: "available", is_child_safe: false },
        { id: "driver-child-safe", status: "available", is_child_safe: true },
      ],
      error: null,
    });

    driverLocationsIn.mockResolvedValueOnce({
      data: [
        { driver_id: "driver-child-safe", lat: 35.17, lng: -90.07 },
      ],
      error: null,
    });

    matchedRideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-child-1",
        status: "driver_en_route",
        driver_id: "driver-child-safe",
      },
      error: null,
    });

    const result = await matchDriver("ride-child-1");

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-child-1",
        status: "driver_en_route",
        driverId: "driver-child-safe",
      },
    });
    expect(ridesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-child-safe",
      }),
    );
  });

  it("cancels the ride when no eligible driver is found before the timeout", async () => {
    rideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-3",
        rider_id: "rider-1",
        pickup_lat: 35.1495,
        pickup_lng: -90.049,
        status: "matching",
        is_child_safe_required: true,
        prefer_trusted_driver: false,
      },
      error: null,
    });

    availableDriversEq.mockResolvedValueOnce({
      data: [
        { id: "driver-1", status: "available", is_child_safe: false },
      ],
      error: null,
    });

    matchedRideSingle.mockResolvedValueOnce({
      data: { id: "ride-3", status: "cancelled", driver_id: null },
      error: null,
    });

    const result = await matchDriver("ride-3", { timeoutMs: 0 });

    expect(result).toEqual({
      success: false,
      error: "No driver found in time.",
    });
    expect(ridesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancel_reason: "No driver found within matching timeout.",
      }),
    );
  });

  it("cancels a stale matching ride once the default timeout window has passed", async () => {
    rideSingle.mockResolvedValueOnce({
      data: {
        id: "ride-4",
        rider_id: "rider-1",
        pickup_lat: 35.1495,
        pickup_lng: -90.049,
        status: "matching",
        is_child_safe_required: false,
        prefer_trusted_driver: false,
        requested_at: "2026-04-14T02:35:00.000Z",
      },
      error: null,
    });

    availableDriversEq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    matchedRideSingle.mockResolvedValueOnce({
      data: { id: "ride-4", status: "cancelled", driver_id: null },
      error: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T02:35:31.000Z"));

    const result = await matchDriver("ride-4");

    expect(result).toEqual({
      success: false,
      error: "No driver found in time.",
    });
    expect(ridesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancel_reason: "No driver found within matching timeout.",
      }),
    );

    vi.useRealTimers();
  });
});
