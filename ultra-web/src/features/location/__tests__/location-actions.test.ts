// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom, mockGeocode } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGeocode: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/geo", async () => {
  const actual = await vi.importActual<typeof import("@/lib/geo")>("@/lib/geo");
  return { ...actual, geocodeAddress: mockGeocode };
});

import { getActiveLiveLocations, updateMyLocation } from "../actions";

type RoleRow = { role: "rider" | "driver" | "admin" };

function chainResult<T>(value: T) {
  const result = { data: value, error: null as unknown };
  return {
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(result),
      maybeSingle: vi.fn().mockResolvedValue(result),
    }),
  };
}

function buildRiderTables(args: {
  role: RoleRow["role"];
  riderId?: string;
  driverId?: string;
}) {
  const updateRider = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  const upsertDriverLocation = vi.fn().mockResolvedValue({ data: null, error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === "user_roles") {
      return { select: () => chainResult({ role: args.role }) };
    }
    if (table === "riders") {
      if (args.role === "rider") {
        return {
          select: () => chainResult({ id: args.riderId ?? "rider-1" }),
          update: updateRider,
        };
      }
      return { select: () => chainResult(null) };
    }
    if (table === "drivers") {
      return {
        select: () => chainResult({ id: args.driverId ?? "driver-1" }),
      };
    }
    if (table === "driver_locations") {
      return { upsert: upsertDriverLocation };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { updateRider, upsertDriverLocation };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGeocode.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateMyLocation", () => {
  it("rejects input with neither lat/lng nor address", async () => {
    const result = await updateMyLocation({}, "user-1");
    expect(result).toEqual({
      success: false,
      error: "Provide either an address or both lat and lng.",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("writes lat/lng to riders for a rider user", async () => {
    const { updateRider } = buildRiderTables({ role: "rider", riderId: "rider-7" });

    const result = await updateMyLocation(
      { lat: 35.1495, lng: -90.049 },
      "user-7",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBe(35.1495);
      expect(result.data.lng).toBe(-90.049);
    }
    expect(updateRider).toHaveBeenCalledWith(
      expect.objectContaining({
        current_lat: 35.1495,
        current_lng: -90.049,
        current_location_updated_at: expect.any(String),
      }),
    );
  });

  it("upserts driver_locations for a driver user", async () => {
    const { upsertDriverLocation } = buildRiderTables({
      role: "driver",
      driverId: "driver-9",
    });

    const result = await updateMyLocation(
      { lat: 35.15, lng: -90.05 },
      "user-9",
    );

    expect(result.success).toBe(true);
    expect(upsertDriverLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        driver_id: "driver-9",
        lat: 35.15,
        lng: -90.05,
        source: "manual",
      }),
      expect.objectContaining({ onConflict: "driver_id" }),
    );
  });

  it("geocodes an address before writing", async () => {
    mockGeocode.mockResolvedValueOnce({
      lat: 35.1495,
      lng: -90.049,
      displayName: "1150 West End Ave, Memphis, TN, USA",
    });
    const { updateRider } = buildRiderTables({ role: "rider" });

    const result = await updateMyLocation(
      { address: "1150 West End Ave, Memphis, TN" },
      "user-1",
    );

    expect(mockGeocode).toHaveBeenCalledWith("1150 West End Ave, Memphis, TN");
    expect(result.success).toBe(true);
    expect(updateRider).toHaveBeenCalledWith(
      expect.objectContaining({ current_lat: 35.1495, current_lng: -90.049 }),
    );
  });

  it("returns an error when the address cannot be geocoded", async () => {
    mockGeocode.mockResolvedValueOnce(null);
    buildRiderTables({ role: "rider" });

    const result = await updateMyLocation({ address: "nowhereville xyz" }, "user-1");

    expect(result).toEqual({
      success: false,
      error: 'Could not find coordinates for "nowhereville xyz".',
    });
  });
});

describe("getActiveLiveLocations", () => {
  it("denies non-admin callers", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return { select: () => chainResult({ role: "rider" }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getActiveLiveLocations("user-1");
    expect(result).toEqual({ success: false, error: "Admin role required." });
  });

  it("returns rider + driver location rows for admins", async () => {
    const riderSelect = vi.fn().mockResolvedValue({
      data: [
        {
          id: "rider-1",
          name: "Aisha R.",
          current_lat: 35.1495,
          current_lng: -90.049,
          current_location_updated_at: "2026-04-27T22:00:00Z",
        },
      ],
      error: null,
    });
    const driverSelect = vi.fn().mockResolvedValue({
      data: [
        {
          driver_id: "driver-1",
          drivers: { id: "driver-1", name: "Marcus W.", status: "available" },
          lat: 35.14,
          lng: -90.05,
          recorded_at: "2026-04-27T22:01:00Z",
        },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return { select: () => chainResult({ role: "admin" }) };
      }
      if (table === "riders") {
        return { select: vi.fn().mockReturnValue({ not: () => ({ not: () => riderSelect() }) }) };
      }
      if (table === "driver_locations") {
        return { select: vi.fn().mockReturnValue({ then: undefined, ...{ } }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    // Override driver_locations mock with proper chain
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return { select: () => chainResult({ role: "admin" }) };
      }
      if (table === "riders") {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "rider-1",
                    name: "Aisha R.",
                    current_lat: 35.1495,
                    current_lng: -90.049,
                    current_location_updated_at: "2026-04-27T22:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "driver_locations") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                driver_id: "driver-1",
                drivers: { id: "driver-1", name: "Marcus W.", status: "available" },
                lat: 35.14,
                lng: -90.05,
                recorded_at: "2026-04-27T22:01:00Z",
              },
            ],
            error: null,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getActiveLiveLocations("user-admin");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riders).toHaveLength(1);
      expect(result.data.riders[0]).toEqual({
        id: "rider-1",
        name: "Aisha R.",
        lat: 35.1495,
        lng: -90.049,
        updatedAt: "2026-04-27T22:00:00Z",
      });
      expect(result.data.drivers).toHaveLength(1);
      expect(result.data.drivers[0]).toEqual({
        id: "driver-1",
        name: "Marcus W.",
        status: "available",
        lat: 35.14,
        lng: -90.05,
        updatedAt: "2026-04-27T22:01:00Z",
      });
    }
  });
});
