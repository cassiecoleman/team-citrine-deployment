import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DriverEnRouteCard } from "../components/DriverEnRouteCard";
import type { RideDetail } from "../types";

const useDriverLocation = vi.fn();

vi.mock("../use-driver-location", () => ({
  useDriverLocation: (input: { driverId: string }) => useDriverLocation(input),
}));

const ride: RideDetail = {
  id: "ride-1",
  pickup: { lat: 40.7128, lng: -74.006, address: "742 Elm St (Home)" },
  dropoff: { lat: 40.7489, lng: -73.968, address: "Metro General Hospital" },
  status: "en_route",
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
  progressPercent: 10,
  distanceRemainingMi: 4.5,
  etaMin: 8,
};

describe("DriverEnRouteCard live location", () => {
  it("shows current driver coordinates from realtime location hook", () => {
    useDriverLocation.mockReturnValue({
      location: { lat: 35.1495, lng: -90.049, heading: 180 },
    });

    render(<DriverEnRouteCard ride={ride} />);

    expect(screen.getByTestId("ride-map")).toBeInTheDocument();
    expect(screen.getByText("Live location")).toBeInTheDocument();
    expect(screen.getByText("35.1495, -90.0490")).toBeInTheDocument();
  });
});
