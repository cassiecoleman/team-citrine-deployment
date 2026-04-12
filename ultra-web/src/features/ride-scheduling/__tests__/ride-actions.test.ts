// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelRide,
  createRecurringRide,
  createRide,
  getRideById,
  getRidesForRider,
  scheduleRide,
} from "../actions";

const mockSingle = vi.fn();
const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockUpdate = vi.fn(() => ({ eq: () => ({ select: () => ({ single: mockSingle }) }) }));
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect };
  }
  if (table === "rides") {
    return { insert: mockInsert, update: mockUpdate, select: mockSelect };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

describe("ride scheduling actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockRange.mockReset();
    mockOrder.mockReset();
    mockEq.mockClear();
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockFrom.mockClear();
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

  it("creates a recurring ride with recurrence metadata", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: { id: "ride-recurring-1", status: "requested", is_recurring: true },
        error: null,
      });

    const result = await createRecurringRide(
      {
        pickup: { lat: 35.1495, lng: -90.049, address: "123 Beale St, Memphis, TN" },
        dropoff: {
          lat: 35.1174,
          lng: -89.9711,
          address: "456 Elvis Presley Blvd, Memphis, TN",
        },
        scheduledFor: new Date().toISOString(),
        recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      },
      "user-1",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("ride-recurring-1");
    }
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_recurring: true,
        recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      }),
    );
  });

  it("cancels a rider-owned pending ride and marks refund handling as pending", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: { id: "ride-1", status: "requested", rider_id: "rider-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "ride-1", status: "cancelled" },
        error: null,
      });

    const result = await cancelRide(
      "ride-1",
      "Rider requested cancellation",
      "user-1",
    );

    expect(result).toEqual({
      success: true,
      data: { id: "ride-1", status: "cancelled", refundStatus: "pending" },
    });
    expect(mockFrom).toHaveBeenCalledWith("rides");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancel_reason: "Rider requested cancellation",
        cancelled_by: "user-1",
      }),
    );
  });

  it("rejects cancellation when the ride is already completed", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: { id: "ride-1", status: "completed", rider_id: "rider-1" },
        error: null,
      });

    const result = await cancelRide(
      "ride-1",
      "Rider requested cancellation",
      "user-1",
    );

    expect(result).toEqual({
      success: false,
      error: "Completed or cancelled rides cannot be cancelled.",
    });
  });

  it("fetches a ride by id with driver details", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "requested",
          rider_id: "rider-1",
          driver_id: "driver-1",
          drivers: { id: "driver-1", name: "Sam Driver", status: "available" },
        },
        error: null,
      });

    const result = await getRideById("ride-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("ride-1");
      expect(result.data.drivers?.name).toBe("Sam Driver");
    }
  });

  it("rejects getRideById when the ride belongs to a different rider", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "ride-1",
          status: "requested",
          rider_id: "rider-2",
          driver_id: "driver-1",
        },
        error: null,
      });

    const result = await getRideById("ride-1", "user-1");

    expect(result).toEqual({
      success: false,
      error: "You can only access your own rides.",
    });
  });

  it("lists rider rides with pagination", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "rider-1" }, error: null });
    mockRange.mockResolvedValueOnce({
      data: [
        { id: "ride-1", status: "requested", requested_at: "2026-04-11T00:00:00.000Z" },
        { id: "ride-2", status: "cancelled", requested_at: "2026-04-10T00:00:00.000Z" },
      ],
      error: null,
    });

    const result = await getRidesForRider("user-1", { page: 1, pageSize: 2 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(2);
    }
  });
});
