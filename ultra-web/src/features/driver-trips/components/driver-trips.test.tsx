import type { ComponentPropsWithoutRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DriverShiftBoard } from "./DriverShiftBoard";
import { PickupConfirmationCard } from "./PickupConfirmationCard";
import { TripAssignmentCard } from "./TripAssignmentCard";
import { TripNavigationView } from "./TripNavigationView";
import type {
  ActiveDriverTrip,
  DriverShiftSummary,
  TripAssignment,
} from "../types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const shiftSummary: DriverShiftSummary = {
  driverName: "Marcus W.",
  status: "online",
  shiftWindow: "7:00 AM - 3:00 PM",
  acceptanceRate: 96,
  completionRate: 99,
  todayTrips: 8,
  earningsToday: 142.5,
};

const assignment: TripAssignment = {
  id: "trip-204",
  riderName: "Aisha R.",
  pickupLabel: "Community Clinic",
  pickupAddress: "1150 West End Ave",
  dropoffLabel: "Metro General Hospital",
  dropoffAddress: "245 River Pkwy",
  offeredFare: 24.75,
  estimatedTripTimeMin: 26,
  mileageMi: 7.4,
  pickupEtaMin: 5,
  note: "Rider requested curbside pickup by the blue awning.",
};

const activeTrip: ActiveDriverTrip = {
  id: "trip-204",
  riderName: "Aisha R.",
  riderRating: 4.8,
  pickupLabel: assignment.pickupLabel,
  pickupAddress: assignment.pickupAddress,
  dropoffLabel: assignment.dropoffLabel,
  dropoffAddress: assignment.dropoffAddress,
  offeredFare: assignment.offeredFare,
  mileageMi: assignment.mileageMi,
  pickupEtaMin: assignment.pickupEtaMin,
  routeProgressLabel: "2 turns away from pickup",
  vehicleChecklist: [
    "Hazards ready for curb pickup",
    "Back seat clear for rider belongings",
    "App PIN ready for verbal confirmation",
  ],
};

describe("driver wireframe components", () => {
  it("renders the driver shift dashboard summary and actions", () => {
    render(<DriverShiftBoard summary={shiftSummary} />);

    expect(screen.getByText("Driver shift")).toBeInTheDocument();
    expect(screen.getByText("Marcus W.")).toBeInTheDocument();
    expect(screen.getByText("$142.50")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review Queue" })).toHaveAttribute(
      "href",
      "/queue",
    );
  });

  it("renders the trip assignment details and accept action", () => {
    render(<TripAssignmentCard assignment={assignment} />);

    expect(screen.getByText("Incoming assignment")).toBeInTheDocument();
    expect(screen.getByText("$24.75")).toBeInTheDocument();
    expect(screen.getByText("26 min")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Accept Trip" })).toHaveAttribute(
      "href",
      "/trip/trip-204",
    );
  });

  it("renders navigation details and pickup transition CTA", () => {
    render(<TripNavigationView trip={activeTrip} />);

    expect(screen.getByText("En route to rider")).toBeInTheDocument();
    expect(screen.getByText("Turn-by-turn map preview")).toBeInTheDocument();
    expect(screen.getByText("Pickup pin ready")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Arrived at Pickup" }),
    ).toHaveAttribute("href", "/trip/trip-204/pickup");
  });

  it("renders the passenger confirmation flow and back link", () => {
    render(<PickupConfirmationCard trip={activeTrip} />);

    expect(screen.getByText("At pickup pin")).toBeInTheDocument();
    expect(screen.getByText("Passenger name")).toBeInTheDocument();
    expect(screen.getByText("Identity check steps")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Pickup" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Map" })).toHaveAttribute(
      "href",
      "/trip/trip-204",
    );
  });
});
