import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchingScreen } from "../components/MatchingScreen";
import { DriverEnRouteCard } from "../components/DriverEnRouteCard";
import { DriverArrivedCard } from "../components/DriverArrivedCard";
import { InProgressTracker } from "../components/InProgressTracker";
import { RideStatusPage } from "../components/RideStatusPage";
import type { RideDetail } from "../types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/ride/ride-1",
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
    id: "d1",
    name: "Marcus W.",
    rating: 4.9,
    vehicle: "Toyota Camry",
    licensePlate: "ULT-2026",
    etaMinutes: 8,
  },
  progressPercent: 45,
  distanceRemainingMi: 2.8,
  etaMin: 8,
};

describe("MatchingScreen", () => {
  it("renders 'Finding your driver...' text and cancel button", () => {
    render(<MatchingScreen ride={{ ...baseRide, status: "matching" }} />);
    expect(screen.getByText("Finding your driver...")).toBeInTheDocument();
    expect(screen.getByText("Cancel Request")).toBeInTheDocument();
  });
});

describe("DriverEnRouteCard", () => {
  it("renders driver name, rating, ETA, and vehicle", () => {
    render(<DriverEnRouteCard ride={{ ...baseRide, status: "en_route" }} />);
    expect(screen.getByText("Marcus W.")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("8 min")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("Driver En Route")).toBeInTheDocument();
  });
});

describe("DriverArrivedCard", () => {
  it("renders 'Your driver is here!' and driver details", () => {
    render(<DriverArrivedCard ride={{ ...baseRide, status: "arrived" }} />);
    expect(screen.getByText("Your driver is here!")).toBeInTheDocument();
    expect(screen.getByText("Marcus W.")).toBeInTheDocument();
    expect(screen.getByText("Driver Arrived")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("ULT-2026")).toBeInTheDocument();
  });
});

describe("InProgressTracker", () => {
  it("renders progress bar and ETA", () => {
    render(<InProgressTracker ride={{ ...baseRide, status: "in_progress" }} />);
    expect(screen.getByText("Ride In Progress")).toBeInTheDocument();
    expect(screen.getByText("8 min")).toBeInTheDocument();
    expect(screen.getByText("2.8 mi")).toBeInTheDocument();
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "45");
  });
});

describe("RideStatusPage", () => {
  it("renders MatchingScreen for 'matching' status", () => {
    render(<RideStatusPage ride={{ ...baseRide, status: "matching" }} />);
    expect(screen.getByText("Finding your driver...")).toBeInTheDocument();
  });

  it("renders DriverEnRouteCard for 'en_route' status", () => {
    render(<RideStatusPage ride={{ ...baseRide, status: "en_route" }} />);
    expect(screen.getByText("Driver En Route")).toBeInTheDocument();
  });

  it("renders DriverArrivedCard for 'arrived' status", () => {
    render(<RideStatusPage ride={{ ...baseRide, status: "arrived" }} />);
    expect(screen.getByText("Your driver is here!")).toBeInTheDocument();
  });

  it("renders InProgressTracker for 'in_progress' status", () => {
    render(<RideStatusPage ride={{ ...baseRide, status: "in_progress" }} />);
    expect(screen.getByText("Ride In Progress")).toBeInTheDocument();
  });
});
