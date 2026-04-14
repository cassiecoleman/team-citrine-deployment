import { afterEach, describe, expect, it, vi } from "vitest";
import { resetDemoRideState, setDemoRideStatus } from "@/lib/demo-ride-state";
import { getRideStatus } from "../actions";

const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const createServiceRoleClient = vi.fn(() => ({ from }));

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => createServiceRoleClient(),
}));

afterEach(async () => {
  await resetDemoRideState();
});

describe("getRideStatus", () => {
  it("maps database status to rider-facing detailed status", async () => {
    single.mockResolvedValueOnce({
      data: {
        id: "ride-1",
        status: "driver_en_route",
        driver_id: "driver-real-1",
        drivers: {
          id: "driver-real-1",
          name: "Sam Driver",
          rating: 4.7,
          vehicle_make: "Honda",
          vehicle_model: "Civic",
          license_plate: "REAL-101",
        },
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
    expect(ride.driver?.name).toBe("Sam Driver");
    expect(ride.driver?.vehicle).toBe("Honda Civic");
    expect(ride.driver?.licensePlate).toBe("REAL-101");
    expect(ride.estimatedFare).toBe(19);
  });

  it("uses demo ride state status when Supabase config is unavailable", async () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    await setDemoRideStatus("new-ride", "driver_en_route");

    const ride = await getRideStatus("new-ride");

    expect(ride.id).toBe("new-ride");
    expect(ride.status).toBe("en_route");

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  });
});
