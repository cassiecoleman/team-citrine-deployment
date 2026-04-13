import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RideDetail } from "../types";
import { RideStatusPage } from "../components/RideStatusPage";

const push = vi.fn();
const useRideStatus = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

vi.mock("../use-ride-status", () => ({
  useRideStatus: (input: { rideId: string; initialRide: RideDetail }) => useRideStatus(input),
}));

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

describe("RideStatusPage realtime integration", () => {
  it("renders card based on hook-provided status", () => {
    useRideStatus.mockReturnValue({
      ride: {
        ...baseRide,
        status: "en_route",
      },
    });

    render(<RideStatusPage ride={baseRide} />);

    expect(screen.getByText("Driver En Route")).toBeInTheDocument();
  });

  it("redirects to completion page when realtime status is completed", () => {
    useRideStatus.mockReturnValue({
      ride: {
        ...baseRide,
        status: "completed",
      },
    });

    render(<RideStatusPage ride={baseRide} />);

    expect(push).toHaveBeenCalledWith("/ride/ride-1/complete");
  });
});
