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

afterEach(() => {
  resetDemoRideState();
});

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

  it("uses demo ride state status when Supabase config is unavailable", async () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    setDemoRideStatus("new-ride", "driver_en_route");

    const ride = await getRideStatus("new-ride");

    expect(ride.id).toBe("new-ride");
    expect(ride.status).toBe("en_route");

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  });
});
