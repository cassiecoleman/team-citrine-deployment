// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptTrip,
  completeTrip,
  confirmPickup,
  getAssignedTrips,
  getDriverStatus,
  rejectTrip,
  toggleDriverAvailability,
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
const mockRideSelectSingle = vi.fn();
const mockRideOrder = vi.fn();
const mockRideSelectEq = vi.fn(() => ({
  in: mockRideIn,
  maybeSingle: mockRideMaybeSingle,
  single: mockRideSelectSingle,
  order: mockRideOrder,
}));
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
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching" },
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
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
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

  it("toggles a driver from available to offline", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1", status: "available" },
      error: null,
    });

    const result = await toggleDriverAvailability({
      driverUserId: "auth-user-1",
      nextStatus: "offline",
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        status: "offline",
      },
    });
    expect(mockDriverUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "offline",
      }),
    );
    expect(mockDriverUpdateEq).toHaveBeenCalledWith("id", "driver-1");
  });

  it("fetches pending assigned trips from matching rides", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideOrder.mockResolvedValueOnce({
      data: [
        {
          id: "ride-1",
          pickup_address: "1150 West End Ave",
          dropoff_address: "245 River Pkwy",
          fare_estimate: 24.75,
          estimated_duration_min: 26,
          distance_miles: 7.4,
          riders: { name: "Aisha R." },
        },
      ],
      error: null,
    });

    const result = await getAssignedTrips("auth-user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe("ride-1");
      expect(result.data[0]?.riderName).toBe("Aisha R.");
    }
    expect(mockFrom).toHaveBeenCalledWith("drivers");
    expect(mockFrom).toHaveBeenCalledWith("rides");
  });

  it("rejects acceptTrip when the ride is not currently in matching", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress" },
      error: null,
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not available to accept.",
    });
  });

  it("rejects confirmPickup when the ride is assigned to a different driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-2" },
      error: null,
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not assigned to this driver.",
    });
  });
});
