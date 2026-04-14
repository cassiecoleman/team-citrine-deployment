import { describe, expect, it } from "vitest";
import type { RideDetail } from "../types";
import {
  buildRideViewModel,
  normalizeRideStatus,
} from "../ride-status-adapter";

const baseRide: RideDetail = {
  id: "ride-1",
  pickup: { lat: 40.7128, lng: -74.006, address: "742 Elm St (Home)" },
  dropoff: { lat: 40.7489, lng: -73.968, address: "Metro General Hospital" },
  status: "matching",
  estimatedFare: 19.0,
  distanceMi: 5.1,
  durationMin: 18,
  driver: {
    id: "driver-1",
    name: "Marcus W.",
    rating: 4.9,
    vehicle: "Toyota Camry",
    licensePlate: "ULT-2026",
    etaMinutes: 8,
  },
  progressPercent: 0,
  distanceRemainingMi: 5.1,
  etaMin: 8,
};

describe("normalizeRideStatus", () => {
  it("maps driver_en_route to en_route", () => {
    expect(normalizeRideStatus("driver_en_route")).toBe("en_route");
  });

  it("maps requested to matching for rider waiting screen", () => {
    expect(normalizeRideStatus("requested")).toBe("matching");
  });
});

describe("buildRideViewModel", () => {
  it("applies mapped status to ride detail", () => {
    const result = buildRideViewModel(baseRide, {
      status: "driver_en_route",
    });

    expect(result.status).toBe("en_route");
  });

  it("sets eta to zero when driver has arrived", () => {
    const result = buildRideViewModel(baseRide, {
      status: "arrived",
    });

    expect(result.status).toBe("arrived");
    expect(result.etaMin).toBe(0);
  });
});
