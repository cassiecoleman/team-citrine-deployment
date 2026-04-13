import { describe, expect, it, vi } from "vitest";
import { getRideStatus } from "../actions";

const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const createServiceRoleClient = vi.fn(() => ({ from }));

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => createServiceRoleClient(),
}));

describe("getRideStatus", () => {
  it("maps database status to rider-facing detailed status", async () => {
    single.mockResolvedValueOnce({
      data: {
        id: "ride-1",
        status: "driver_en_route",
        driver_id: "driver-real-1",
        pickup_lat: 40.7128,
        pickup_lng: -74.006,
        pickup_address: "742 Elm St (Home)",
        dropoff_lat: 40.7489,
        dropoff_lng: -73.968,
        dropoff_address: "Metro General Hospital",
        fare_estimate: 19.0,
        fare_final: null,
        distance_miles: 5.1,
        estimated_duration_min: 18,
        actual_duration_min: null,
      },
      error: null,
    });

    const ride = await getRideStatus("ride-1");

    expect(createServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(ride.status).toBe("en_route");
    expect(ride.id).toBe("ride-1");
    expect(ride.driver?.id).toBe("driver-real-1");
    expect(ride.estimatedFare).toBe(19);
  });
});
