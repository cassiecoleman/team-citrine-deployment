// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptTrip,
  completeTrip,
  confirmPickup,
  getDriverStatus,
  rejectTrip,
} from "../actions";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

const mockRideUpdateSingle = vi.fn();
const mockRideUpdateSelect = vi.fn(() => ({ single: mockRideUpdateSingle }));
const mockRideUpdateEq = vi.fn(() => ({ select: mockRideUpdateSelect }));
const mockRideUpdate = vi.fn(() => ({ eq: mockRideUpdateEq }));
const mockRideMaybeSingle = vi.fn();
const mockRideIn = vi.fn(() => ({ maybeSingle: mockRideMaybeSingle }));
const mockRideSelectEq = vi.fn(() => ({ in: mockRideIn, maybeSingle: mockRideMaybeSingle }));
const mockRideSelect = vi.fn(() => ({ eq: mockRideSelectEq }));
const mockDriverUpdateEq = vi.fn();
const mockDriverUpdate = vi.fn(() => ({ eq: mockDriverUpdateEq }));

const mockFrom = vi.fn((table: string) => {
  if (table === "drivers") {
    return { select: mockSelect, update: mockDriverUpdate };
  }

  if (table === "rides") {
    return { update: mockRideUpdate, select: mockRideSelect };
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

  it("rejects a trip by returning it to matching and clearing the assigned driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", driver_id: null },
      error: null,
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      reason: "Driver cannot make pickup ETA",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "matching",
      },
    });
    expect(mockRideUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "matching",
        driver_id: null,
      }),
    );
  });

  it("confirms pickup and transitions the trip to in_progress", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress" },
      error: null,
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "in_progress",
      },
    });
    expect(mockRideUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "in_progress",
      }),
    );
  });

  it("completes a trip with fare_final and sets the driver availability back to available", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "completed", fare_final: 27.5 },
      error: null,
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 27.5,
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "completed",
        fareFinal: 27.5,
      },
    });
    expect(mockRideUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        fare_final: 27.5,
      }),
    );
    expect(mockDriverUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "available",
      }),
    );
    expect(mockDriverUpdateEq).toHaveBeenCalledWith("id", "driver-1");
  });

  it("returns current driver status with active trip id when one exists", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1", status: "on_trip", name: "Marcus W." },
      error: null,
    });
    mockRideMaybeSingle.mockResolvedValueOnce({
      data: { id: "ride-99", status: "in_progress" },
      error: null,
    });

    const result = await getDriverStatus("auth-user-1");

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        driverName: "Marcus W.",
        status: "on_trip",
        activeTripId: "ride-99",
      },
    });
    expect(mockFrom).toHaveBeenCalledWith("drivers");
    expect(mockFrom).toHaveBeenCalledWith("rides");
  });
});
