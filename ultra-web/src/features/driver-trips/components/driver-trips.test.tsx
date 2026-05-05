import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DriverShiftBoard } from "./DriverShiftBoard";
import { PickupConfirmationCard } from "./PickupConfirmationCard";
import { SimulationButtons } from "./SimulationButtons";
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const shiftSummary: DriverShiftSummary = {
  driverName: "Marcus W.",
  status: "online",
  shiftWindow: "7:00 AM - 3:00 PM",
  acceptanceRate: 96,
  completionRate: 99,
  todayTrips: 8,
  earningsToday: 142.5,
  activeTripId: "new-ride",
  hasActiveTrip: false,
  pendingQueueCount: 3,
  nextBreakLabel: "Break window opens after 2 more trips",
};

const assignment: TripAssignment = {
  id: "new-ride",
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
  urgencyLabel: "Medical appointment",
  accessibilityNotes: [
    "Rider prefers the side door nearest the blue awning",
    "Allow extra trunk room for a folded walker",
  ],
};

const activeTrip: ActiveDriverTrip = {
  id: "new-ride",
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
  pickupCode: "4821",
  riderPhone: "(555) 014-2048",
  accessibilityNotes: assignment.accessibilityNotes,
  nextTurn: "Turn right on River Pkwy in 0.4 mi",
  destinationEtaMin: 18,
};

function renderHtml(element: ReactElement) {
  return renderToStaticMarkup(element);
}

describe("driver trip components", () => {
  it("renders the driver shift board controls and summary cards", () => {
    const html = renderHtml(<DriverShiftBoard summary={shiftSummary} />);

    expect(html).toContain("Driver shift");
    expect(html).toContain("Available for the next assignment");
    expect(html).toContain("Queue waiting");
    expect(html).toContain("Break window opens after 2 more trips");
    expect(html).toContain('href="/queue"');
    expect(html).not.toContain("Open Active Trip");
    expect(html).not.toContain('href="/trip/new-ride"');
  });

  it("hides queue review when an active trip is present", () => {
    const html = renderHtml(
      <DriverShiftBoard
        summary={{ ...shiftSummary, hasActiveTrip: true }}
      />,
    );

    expect(html).not.toContain('href="/queue"');
    expect(html).toContain("Open Active Trip");
    expect(html).toContain("shadow-md");
  });

  it("renders assignment details, accessibility notes, and accept routing", () => {
    const html = renderHtml(<TripAssignmentCard assignment={assignment} />);

    expect(html).toContain("Incoming assignment");
    expect(html).toContain("Medical appointment");
    expect(html).toContain("Allow extra trunk room for a folded walker");
    expect(html).not.toContain("Reject");
    expect(html).toContain('href="/trip/new-ride"');
  });

  it("renders trip navigation details and the pickup transition route", () => {
    const html = renderHtml(
      <TripNavigationView trip={activeTrip} rideStatus="driver_en_route" />,
    );

    expect(html).toContain("En route to rider");
    expect(html).toContain("Turn-by-turn map preview");
    expect(html).toContain("Turn right on River Pkwy in 0.4 mi");
    expect(html).toContain("0 of 3 arrival checks complete");
    expect(html).toContain('href="/trip/new-ride/pickup"');
  });

  it("renders pickup verification controls and the return route", () => {
    const html = renderHtml(<PickupConfirmationCard trip={activeTrip} />);

    expect(html).toContain("At pickup pin");
    expect(html).toContain("Pickup PIN 4821");
    expect(html).toContain("Identity check steps");
    expect(html).toContain("Confirm Pickup");
    expect(html).toContain('href="/trip/new-ride"');
  });

  it("only shows completion simulation when trip is in progress", () => {
    const arrivedHtml = renderHtml(
      <SimulationButtons
        rideId="new-ride"
        rideStatus="arrived"
        arriveAction={async () => ({ success: true })}
        completeAction={async () => ({ success: true })}
      />,
    );
    const inProgressHtml = renderHtml(
      <SimulationButtons
        rideId="new-ride"
        rideStatus="in_progress"
        arriveAction={async () => ({ success: true })}
        completeAction={async () => ({ success: true })}
      />,
    );

    expect(arrivedHtml).toContain("Complete trip becomes available");
    expect(arrivedHtml).not.toContain("Simulate Trip Completion");
    expect(inProgressHtml).toContain("Simulate Trip Completion");
  });
});
