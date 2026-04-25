// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptTrip,
  arriveAtPickup,
  completeTrip,
  confirmPickup,
  getAssignedTrips,
  getDriverStatus,
  getRuntimeDriverUserId,
  rejectTrip,
  toggleDriverAvailability,
  updateDriverLocation,
} from "../actions";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockDriverLimit = vi.fn();
const mockDriverOrder = vi.fn(() => ({ limit: mockDriverLimit }));
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockDriverOrder }));

const mockRideUpdateSingle = vi.fn();
const mockRideUpdateMaybeSingle = vi.fn();
const mockRideUpdateSelect = vi.fn(() => ({
  single: mockRideUpdateSingle,
  maybeSingle: mockRideUpdateMaybeSingle,
}));
const mockRideUpdateEq = vi.fn(() => ({ eq: mockRideUpdateEq, select: mockRideUpdateSelect }));
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
const mockHistoryInsert = vi.fn();
const mockLocationUpsert = vi.fn();
const mockLocationSelectSingle = vi.fn();
const mockLocationSelectMaybeSingle = vi.fn();
const mockLocationSelectEq = vi.fn(() => ({ maybeSingle: mockLocationSelectMaybeSingle }));
const mockLocationSelect = vi.fn(() => ({ eq: mockLocationSelectEq }));
const mockLocationUpsertSelect = vi.fn(() => ({ single: mockLocationSelectSingle }));

const mockFrom = vi.fn((table: string) => {
  if (table === "drivers") {
    return { select: mockSelect, update: mockDriverUpdate };
  }

  if (table === "rides") {
    return { update: mockRideUpdate, select: mockRideSelect };
  }

  if (table === "ride_status_history") {
    return { insert: mockHistoryInsert };
  }

  if (table === "driver_locations") {
    return {
      select: mockLocationSelect,
      upsert: mockLocationUpsert,
    };
  }

  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("driver trip operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockRideUpdateSingle.mockReset();
    mockRideUpdateMaybeSingle.mockReset();
    mockRideMaybeSingle.mockReset();
    mockRideSelectSingle.mockReset();
    mockRideOrder.mockReset();
    mockDriverUpdateEq.mockReset();
    mockHistoryInsert.mockReset();
    mockDriverLimit.mockReset();
    mockDriverOrder.mockReset();
    mockLocationUpsert.mockReset();
    mockLocationSelectSingle.mockReset();
    mockLocationSelectMaybeSingle.mockReset();
    mockLocationSelectEq.mockReset();
    mockLocationSelect.mockReset();
    mockLocationUpsertSelect.mockReset();
    mockHistoryInsert.mockResolvedValue({ error: null });
    // Default: no busy ride for the driver (.in(...).maybeSingle() path
    // in the new acceptTrip guard). Individual tests can override.
    mockRideMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockClear();
    mockSelect.mockClear();
    mockRideUpdateEq.mockClear();
    mockRideUpdate.mockClear();
    mockRideSelectEq.mockClear();
    mockRideSelect.mockClear();
    mockFrom.mockClear();
  });

  it("accepts a matching trip, assigns the driver, and moves status to driver_en_route", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", version: 3 },
      error: null,
    });
    mockRideUpdateMaybeSingle.mockResolvedValueOnce({
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
    expect(mockRideUpdateEq).toHaveBeenCalledWith("version", 3);
    expect(mockRideUpdateEq).toHaveBeenCalledWith("status", "matching");
    expect(mockFrom).toHaveBeenCalledWith("ride_status_history");
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-22",
        from_status: "matching",
        to_status: "driver_en_route",
        change_source: "driver",
      }),
    );
  });

  it("rejects acceptTrip when the payload is invalid", async () => {
    const result = await acceptTrip({
      rideId: "",
      driverUserId: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid trip acceptance request.",
    });
  });

  it("rejects acceptTrip when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects acceptTrip when the driver already has an active ride", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideMaybeSingle.mockResolvedValueOnce({
      data: { id: "ride-busy" },
      error: null,
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "You already have an active trip. Complete it before accepting another.",
    });
  });

  it("rejects acceptTrip when the target ride cannot be loaded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing ride" },
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to find the trip to accept.",
    });
  });

  it("rejects acceptTrip when the conditional update errors", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", version: 4 },
      error: null,
    });
    mockRideUpdateMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "update failed" },
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to accept this trip right now.",
    });
  });

  it("rejects acceptTrip when history cannot be recorded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", version: 3 },
      error: null,
    });
    mockRideUpdateMaybeSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
      error: null,
    });
    mockHistoryInsert.mockResolvedValueOnce({
      error: { message: "history failed" },
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to record trip status history.",
    });
  });

  it("resolves a fallback driver user id when env defaults are not set", async () => {
    const originalDefaultDriverUserId = process.env.ULTRA_DEFAULT_DRIVER_USER_ID;
    const originalDefaultUserId = process.env.ULTRA_DEFAULT_USER_ID;
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.ULTRA_DEFAULT_DRIVER_USER_ID = "";
    process.env.ULTRA_DEFAULT_USER_ID = "";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    mockDriverLimit.mockResolvedValueOnce({
      data: [{ user_id: "driver-user-fallback" }],
      error: null,
    });

    const result = await getRuntimeDriverUserId();

    expect(result).toBe("driver-user-fallback");

    process.env.ULTRA_DEFAULT_DRIVER_USER_ID = originalDefaultDriverUserId;
    process.env.ULTRA_DEFAULT_USER_ID = originalDefaultUserId;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  });

  it("upserts a fresh driver location update", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockLocationSelectMaybeSingle.mockResolvedValueOnce({
      data: { recorded_at: "2026-04-13T20:00:00.000Z" },
      error: null,
    });
    mockLocationUpsert.mockReturnValueOnce({
      select: mockLocationUpsertSelect,
    });
    mockLocationSelectSingle.mockResolvedValueOnce({
      data: { driver_id: "driver-1", lat: 35.15, lng: -90.05, heading: 180, recorded_at: "2026-04-13T20:00:04.000Z" },
      error: null,
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
      heading: 180,
      recordedAt: "2026-04-13T20:00:04.000Z",
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: 180,
        recordedAt: "2026-04-13T20:00:04.000Z",
        throttled: false,
      },
    });
    expect(mockFrom).toHaveBeenCalledWith("driver_locations");
    expect(mockLocationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: 180,
      }),
      expect.objectContaining({
        onConflict: "driver_id",
      }),
    );
  });

  it("rejects updateDriverLocation when the payload is invalid", async () => {
    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 95,
      lng: -90.05,
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid driver location payload.",
    });
  });

  it("rejects updateDriverLocation when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("throttles driver location updates faster than 3 seconds", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockLocationSelectMaybeSingle.mockResolvedValueOnce({
      data: { recorded_at: "2026-04-13T20:00:03.000Z" },
      error: null,
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
      heading: 180,
      recordedAt: "2026-04-13T20:00:04.000Z",
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: 180,
        recordedAt: "2026-04-13T20:00:04.000Z",
        throttled: true,
      },
    });
    expect(mockLocationUpsert).not.toHaveBeenCalled();
  });

  it("continues location upsert when the latest-location lookup errors", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockLocationSelectMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "lookup failed" },
    });
    mockLocationUpsert.mockReturnValueOnce({
      select: mockLocationUpsertSelect,
    });
    mockLocationSelectSingle.mockResolvedValueOnce({
      data: {
        driver_id: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: null,
        recorded_at: "2026-04-13T20:00:04.000Z",
      },
      error: null,
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
      recordedAt: "2026-04-13T20:00:04.000Z",
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: null,
        recordedAt: "2026-04-13T20:00:04.000Z",
        throttled: false,
      },
    });
  });

  it("uses a generated timestamp and null heading when optional location fields are omitted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T20:00:10.000Z"));

    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockLocationSelectMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockLocationUpsert.mockReturnValueOnce({
      select: mockLocationUpsertSelect,
    });
    mockLocationSelectSingle.mockResolvedValueOnce({
      data: {
        driver_id: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: null,
        recorded_at: "2026-04-13T20:00:10.000Z",
      },
      error: null,
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        lat: 35.15,
        lng: -90.05,
        heading: null,
        recordedAt: "2026-04-13T20:00:10.000Z",
        throttled: false,
      },
    });

    vi.useRealTimers();
  });

  it("rejects updateDriverLocation when the upsert fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockLocationSelectMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockLocationUpsert.mockReturnValueOnce({
      select: mockLocationUpsertSelect,
    });
    mockLocationSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "upsert failed" },
    });

    const result = await updateDriverLocation({
      driverUserId: "auth-user-1",
      lat: 35.15,
      lng: -90.05,
      recordedAt: "2026-04-13T20:00:04.000Z",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to update driver location.",
    });
  });

  it("rejects a trip by returning it to matching and clearing the assigned driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
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
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-22",
        from_status: "driver_en_route",
        to_status: "matching",
        change_source: "driver",
      }),
    );
  });

  it("rejects rejectTrip when the payload is invalid", async () => {
    const result = await rejectTrip({
      rideId: "",
      driverUserId: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid trip rejection request.",
    });
  });

  it("rejects rejectTrip when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects rejectTrip when the ride cannot be loaded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing ride" },
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to find the trip to reject.",
    });
  });

  it("rejects rejectTrip when the ride update fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "update failed" },
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to reject this trip right now.",
    });
  });

  it("uses the default rejection reason when none is supplied", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching" },
      error: null,
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "matching",
      },
    });
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        change_reason: "Trip rejected by driver",
      }),
    );
  });

  it("rejects rejectTrip when history cannot be recorded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching" },
      error: null,
    });
    mockHistoryInsert.mockResolvedValueOnce({
      error: { message: "history failed" },
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to record trip status history.",
    });
  });

  it("marks a driver_en_route ride as arrived and records history", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "arrived" },
      error: null,
    });

    const result = await arriveAtPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "arrived",
      },
    });
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-22",
        from_status: "driver_en_route",
        to_status: "arrived",
      }),
    );
  });

  it("rejects arriveAtPickup when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await arriveAtPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects arriveAtPickup when the ride cannot be moved to arrived", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "not en route" },
    });

    const result = await arriveAtPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to mark arrival — ride may not be en route.",
    });
  });

  it("still returns success when arriveAtPickup history insert fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "arrived" },
      error: null,
    });
    mockHistoryInsert.mockResolvedValueOnce({
      error: { message: "history failed" },
    });

    const result = await arriveAtPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "arrived",
      },
    });
  });

  it("rejects rejectTrip when assigned to a different driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-2" },
      error: null,
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      reason: "Driver cannot make pickup ETA",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not assigned to this driver.",
    });
  });

  it("rejects rejectTrip when trip is not in a rejectable status", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "completed", driver_id: "driver-1" },
      error: null,
    });

    const result = await rejectTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      reason: "Driver cannot make pickup ETA",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip cannot be rejected from its current status.",
    });
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
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-22",
        from_status: "driver_en_route",
        to_status: "in_progress",
        change_source: "driver",
      }),
    );
  });

  it("rejects confirmPickup when the payload is invalid", async () => {
    const result = await confirmPickup({
      rideId: "",
      driverUserId: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid pickup confirmation request.",
    });
  });

  it("rejects confirmPickup when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects confirmPickup when the ride cannot be loaded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing ride" },
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to find the trip to confirm pickup.",
    });
  });

  it("confirms pickup when the current ride status is arrived", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "arrived", driver_id: "driver-1" },
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
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_status: "arrived",
        to_status: "in_progress",
      }),
    );
  });

  it("rejects confirmPickup when the ride update fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "arrived", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "update failed" },
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to confirm pickup right now.",
    });
  });

  it("rejects confirmPickup when history cannot be recorded", async () => {
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
    mockHistoryInsert.mockResolvedValueOnce({
      error: { message: "history failed" },
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to record trip status history.",
    });
  });

  it("completes a trip with fare_final and sets the driver availability back to available", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: "driver-1" },
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
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-22",
        from_status: "in_progress",
        to_status: "completed",
        change_source: "driver",
      }),
    );
  });

  it("rejects completeTrip when the payload is invalid", async () => {
    const result = await completeTrip({
      rideId: "",
      driverUserId: "",
      fareFinal: -1,
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid trip completion request.",
    });
  });

  it("rejects completeTrip when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects completeTrip when the ride cannot be loaded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing ride" },
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to find the trip to complete.",
    });
  });

  it("rejects completeTrip when the ride update fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "update failed" },
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to complete this trip right now.",
    });
  });

  it("rejects completeTrip when history cannot be recorded", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "completed", fare_final: 19.5 },
      error: null,
    });
    mockHistoryInsert.mockResolvedValueOnce({
      error: { message: "history failed" },
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to record trip status history.",
    });
  });

  it("falls back to the requested fare when completeTrip does not return fare_final", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: "driver-1" },
      error: null,
    });
    mockRideUpdateSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "completed", fare_final: null },
      error: null,
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 31.25,
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "ride-22",
        status: "completed",
        fareFinal: 31.25,
      },
    });
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

  it("rejects toggleDriverAvailability when the payload is invalid", async () => {
    const result = await toggleDriverAvailability({
      driverUserId: "",
      nextStatus: "offline",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid availability request.",
    });
  });

  it("rejects toggleDriverAvailability when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await toggleDriverAvailability({
      driverUserId: "auth-user-1",
      nextStatus: "offline",
    });

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("toggles a driver from offline to available", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1", status: "offline" },
      error: null,
    });

    const result = await toggleDriverAvailability({
      driverUserId: "auth-user-1",
      nextStatus: "available",
    });

    expect(result).toEqual({
      success: true,
      data: {
        driverId: "driver-1",
        status: "available",
      },
    });
    expect(mockDriverUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "available",
      }),
    );
  });

  it("returns success from toggleDriverAvailability even though the update result is unchecked", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1", status: "available" },
      error: null,
    });
    mockDriverUpdateEq.mockResolvedValueOnce({
      error: { message: "update failed" },
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

  it("returns an empty assigned-trip list when no matching rides exist", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await getAssignedTrips("auth-user-1");

    expect(result).toEqual({
      success: true,
      data: [],
    });
  });

  it("rejects getAssignedTrips when the driver user id is missing", async () => {
    const result = await getAssignedTrips("");

    expect(result).toEqual({
      success: false,
      error: "Driver user id is required.",
    });
  });

  it("rejects getAssignedTrips when the driver account is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "missing driver" },
    });

    const result = await getAssignedTrips("auth-user-1");

    expect(result).toEqual({
      success: false,
      error: "Driver account was not found.",
    });
  });

  it("rejects getAssignedTrips when the rides query fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "query failed" },
    });

    const result = await getAssignedTrips("auth-user-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to load assigned trips right now.",
    });
  });

  it("maps assigned trip rider names from array joins and falls back when absent", async () => {
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
          riders: [{ name: "Aisha R." }],
        },
        {
          id: "ride-2",
          pickup_address: "80 Oak Ave",
          dropoff_address: "City Hall",
          fare_estimate: null,
          estimated_duration_min: null,
          distance_miles: null,
          riders: null,
        },
      ],
      error: null,
    });

    const result = await getAssignedTrips("auth-user-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data[0]?.riderName).toBe("Aisha R.");
    expect(result.data[1]).toMatchObject({
      riderName: "Rider",
      offeredFare: 0,
      estimatedTripTimeMin: 0,
      mileageMi: 0,
    });
  });

  it("rejects acceptTrip when the ride is not currently in matching", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", version: 2 },
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

  it("returns already taken when matching status changes before conditional update", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", version: 4 },
      error: null,
    });
    mockRideUpdateMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await acceptTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip was already taken.",
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

  it("rejects confirmPickup when the ride has no assigned driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: null },
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

  it("rejects confirmPickup when ride is not en route or arrived", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "matching", driver_id: "driver-1" },
      error: null,
    });

    const result = await confirmPickup({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Trip must be en route or arrived.",
    });
  });

  it("rejects completeTrip when the ride is assigned to a different driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: "driver-2" },
      error: null,
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not assigned to this driver.",
    });
  });

  it("rejects completeTrip when the ride has no assigned driver", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "in_progress", driver_id: null },
      error: null,
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not assigned to this driver.",
    });
  });

  it("rejects completeTrip when the ride is not currently in progress", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "driver-1" },
      error: null,
    });
    mockRideSelectSingle.mockResolvedValueOnce({
      data: { id: "ride-22", status: "driver_en_route", driver_id: "driver-1" },
      error: null,
    });

    const result = await completeTrip({
      rideId: "ride-22",
      driverUserId: "auth-user-1",
      fareFinal: 19.5,
    });

    expect(result).toEqual({
      success: false,
      error: "Trip is not in progress.",
    });
  });
});
