// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  flagDriver,
  getRideCompletion,
  getReceipt,
  getRideSummary,
  submitRatingAction,
  submitTipAction,
} from "../actions";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

const mockRatingUpsertSingle = vi.fn();
const mockRatingUpsertSelect = vi.fn(() => ({ single: mockRatingUpsertSingle }));
const mockRatingUpsert = vi.fn(() => ({ select: mockRatingUpsertSelect }));

const mockHistoryInsert = vi.fn();
const mockDriverFlagInsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect };
  }

  if (table === "rides") {
    return { select: mockSelect };
  }

  if (table === "ride_ratings") {
    return { upsert: mockRatingUpsert };
  }

  if (table === "ride_status_history") {
    return { insert: mockHistoryInsert };
  }

  if (table === "driver_flags") {
    return { insert: mockDriverFlagInsert };
  }

  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("ride completion actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDriverFlagInsert.mockResolvedValue({ error: null });
  });

  it("fetches ride summary for a completed rider-owned ride", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "completed",
          fare_estimate: 19,
          fare_final: 21,
          pickup_lat: 35.1495,
          pickup_lng: -90.049,
          pickup_address: "123 Beale St",
          dropoff_lat: 35.1174,
          dropoff_lng: -89.9711,
          dropoff_address: "456 Elvis Presley Blvd",
          distance_miles: 5.1,
          actual_duration_min: 18,
          estimated_duration_min: 20,
          driver_id: "driver-1",
          rider_id: "rider-1",
          drivers: { id: "driver-1", name: "Marcus W." },
        },
        error: null,
      });

    const result = await getRideSummary("ride-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ride.id).toBe("ride-1");
      expect(result.data.ride.actualFare).toBe(21);
      expect(result.data.driver.name).toBe("Marcus W.");
      expect(result.data.total).toBe(23.5);
    }
  });

  it("submits a rider rating for a completed ride", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "completed",
          driver_id: "driver-1",
          rider_id: "rider-1",
        },
        error: null,
      });
    mockRatingUpsertSingle.mockResolvedValueOnce({
      data: { ride_id: "ride-1", rider_gave_driver: 5 },
      error: null,
    });

    const result = await submitRatingAction(
      { rideId: "ride-1", rating: 5, comment: "Great ride." },
      "user-1",
    );

    expect(result).toEqual({
      success: true,
      data: { rideId: "ride-1", rating: 5 },
    });
    expect(mockRatingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-1",
        rider_id: "rider-1",
        driver_id: "driver-1",
        rider_gave_driver: 5,
        rider_comment: "Great ride.",
      }),
      expect.objectContaining({ onConflict: "ride_id" }),
    );
  });

  it("submits a rider tip for a completed ride", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "completed",
          driver_id: "driver-1",
          rider_id: "rider-1",
        },
        error: null,
      });
    mockRatingUpsertSingle.mockResolvedValueOnce({
      data: { ride_id: "ride-1", tip_amount: 4 },
      error: null,
    });

    const result = await submitTipAction({ rideId: "ride-1", amount: 4 }, "user-1");

    expect(result).toEqual({
      success: true,
      data: { rideId: "ride-1", amount: 4 },
    });
    expect(mockRatingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-1",
        rider_id: "rider-1",
        driver_id: "driver-1",
        tip_amount: 4,
      }),
      expect.objectContaining({ onConflict: "ride_id" }),
    );
  });

  it("persists a driver issue report in driver_flags and ride history", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "completed",
          driver_id: "driver-1",
          rider_id: "rider-1",
        },
        error: null,
      });
    mockDriverFlagInsert.mockResolvedValueOnce({ error: null });
    mockHistoryInsert.mockResolvedValueOnce({ error: null });

    const result = await flagDriver(
      {
        rideId: "ride-1",
        category: "Unsafe driving",
        details: "Hard braking near school zone.",
      },
      "user-1",
    );

    expect(result).toEqual({
      success: true,
      data: { rideId: "ride-1", category: "Unsafe driving" },
    });
    expect(mockFrom).toHaveBeenCalledWith("driver_flags");
    expect(mockDriverFlagInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-1",
        reporter_id: "rider-1",
        ride_id: "ride-1",
        reason: "safety",
        details: "Hard braking near school zone.",
        created_by: "user-1",
      }),
    );
    expect(mockFrom).toHaveBeenCalledWith("ride_status_history");
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ride_id: "ride-1",
        change_source: "rider",
        change_reason: expect.stringContaining("\"category\":\"Unsafe driving\""),
      }),
    );
  });

  it("fetches receipt data using the same completion summary source", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "completed",
          fare_estimate: 19,
          fare_final: 20,
          pickup_lat: 35.1495,
          pickup_lng: -90.049,
          pickup_address: "123 Beale St",
          dropoff_lat: 35.1174,
          dropoff_lng: -89.9711,
          dropoff_address: "456 Elvis Presley Blvd",
          distance_miles: 5.1,
          actual_duration_min: 18,
          estimated_duration_min: 20,
          driver_id: "driver-1",
          rider_id: "rider-1",
          drivers: { id: "driver-1", name: "Marcus W." },
        },
        error: null,
      });

    const result = await getReceipt("ride-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ride.id).toBe("ride-1");
      expect(result.data.total).toBe(22.5);
    }
  });

  it("throws when getRideCompletion is called without rider user context", async () => {
    await expect(getRideCompletion("ride-1")).rejects.toThrow(
      "Rider user id is required to load ride completion.",
    );
  });
});
