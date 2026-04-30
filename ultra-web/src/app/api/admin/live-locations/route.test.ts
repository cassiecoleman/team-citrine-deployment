import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserAndRole,
  getActiveLiveLocations,
  createServiceRoleClient,
} = vi.hoisted(() => ({
  getCurrentUserAndRole: vi.fn(),
  getActiveLiveLocations: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/auth-guards", () => ({
  getCurrentUserAndRole,
}));

vi.mock("@/features/location/actions", () => ({
  getActiveLiveLocations,
}));

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient,
}));

import { GET } from "./route";

function createBypassClient() {
  return {
    from(table: string) {
      if (table === "riders") {
        return {
          select() {
            return {
              not() {
                return {
                  not: async () => ({
                    data: [
                      {
                        id: "rider-1",
                        name: "Rider One",
                        current_lat: 35.1,
                        current_lng: -90.0,
                        current_location_updated_at: "2026-04-30T00:00:00.000Z",
                      },
                    ],
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "driver_locations") {
        return {
          select: async () => ({
            data: [
              {
                driver_id: "driver-1",
                lat: 35.2,
                lng: -90.1,
                recorded_at: "2026-04-30T00:00:00.000Z",
                drivers: {
                  id: "driver-1",
                  name: "Driver One",
                  status: "available",
                },
              },
            ],
          }),
        };
      }

      return {
        select() {
          return {
            in: async () => ({
              data: [
                {
                  id: "ride-1",
                  rider_id: "rider-1",
                  driver_id: "driver-1",
                  status: "matching",
                },
              ],
            }),
          };
        },
      };
    },
  };
}

describe("GET /api/admin/live-locations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS;
    process.env.NODE_ENV = "development";
  });

  it("does not use the dev bypass unless it is explicitly enabled", async () => {
    getCurrentUserAndRole.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/admin/live-locations"));

    expect(createServiceRoleClient).not.toHaveBeenCalled();
    expect(getActiveLiveLocations).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      riders: [],
      drivers: [],
      activeRides: [],
    });
  });

  it("allows the dev bypass when explicitly enabled for local runs", async () => {
    process.env.ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS = "true";
    getCurrentUserAndRole.mockResolvedValue(null);
    createServiceRoleClient.mockReturnValue(createBypassClient());

    const response = await GET(new Request("http://localhost/api/admin/live-locations"));

    expect(createServiceRoleClient).toHaveBeenCalled();
    expect(await response.json()).toEqual({
      riders: [
        {
          id: "rider-1",
          name: "Rider One",
          lat: 35.1,
          lng: -90,
          updatedAt: "2026-04-30T00:00:00.000Z",
        },
      ],
      drivers: [
        {
          id: "driver-1",
          name: "Driver One",
          status: "available",
          lat: 35.2,
          lng: -90.1,
          updatedAt: "2026-04-30T00:00:00.000Z",
        },
      ],
      activeRides: [
        {
          id: "ride-1",
          riderId: "rider-1",
          driverId: "driver-1",
          status: "matching",
        },
      ],
    });
  });
});
