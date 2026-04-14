import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingClient } from "./BookingClient";

const mockSearch = vi.fn(async () => [
  {
    address: "Union Ave, Memphis, TN, USA",
    lat: 35.1374,
    lng: -90.0342,
  },
]);
const mockGetRoute = vi.fn(async () => ({
  distanceMiles: 4.2,
  durationMinutes: 11,
  coordinates: [
    { lat: 40.7128, lng: -74.006 },
    { lat: 35.1374, lng: -90.0342 },
  ],
}));
const mockGetEtaMinutes = vi.fn(async () => 11);

vi.mock("@/features/maps/geocoding-provider", () => ({
  createGeocodingProvider: () => ({
    search: mockSearch,
  }),
}));

vi.mock("@/features/maps/routing-provider", () => ({
  createRoutingProvider: () => ({
    getRoute: mockGetRoute,
    getEtaMinutes: mockGetEtaMinutes,
  }),
}));

vi.mock("@/features/maps/components/RideMap", () => ({
  RideMap: () => <div data-testid="ride-map">map</div>,
}));

describe("BookingClient destination search", () => {
  it("searches destination and updates preview details", async () => {
    const user = userEvent.setup();

    render(
      <BookingClient
        estimate={{ totalFare: 19, durationMin: 18, distanceMi: 5.1 }}
        pickup={{ lat: 40.7128, lng: -74.006, address: "742 Elm St (Home)" }}
        initialDropoff={{ lat: 40.7489, lng: -73.968, address: "Metro General Hospital" }}
        requestRideAction={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Destination"), "Union Ave");
    await user.click(screen.getByRole("button", { name: "Find destination" }));

    expect(mockSearch).toHaveBeenCalledWith("Union Ave");
    expect(mockGetRoute).toHaveBeenCalled();
    expect(screen.getByText("Union Ave, Memphis, TN, USA")).toBeInTheDocument();
    expect(screen.getByText("~11 min")).toBeInTheDocument();
  });
});
