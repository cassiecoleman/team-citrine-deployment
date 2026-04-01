import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionSummary } from "../components/CompletionSummary";
import { StarRating } from "../components/StarRating";
import { TipSelector } from "../components/TipSelector";
import { IssueReportForm } from "../components/IssueReportForm";
import { RideCompletePage } from "../components/RideCompletePage";
import type { RideCompletionData } from "../types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../actions", () => ({
  submitRating: vi.fn(),
  submitTip: vi.fn(),
  submitIssueReport: vi.fn(),
}));

const mockData: RideCompletionData = {
  ride: {
    id: "ride-1",
    pickup: { lat: 40.7128, lng: -74.006, address: "742 Elm St (Home)" },
    dropoff: { lat: 40.7489, lng: -73.968, address: "Metro General Hospital" },
    status: "completed",
    estimatedFare: 19.0,
    actualFare: 18.5,
    driver: {
      id: "d1",
      name: "Marcus W.",
      rating: 4.9,
      vehicle: "Toyota Camry",
      licensePlate: "ULT-2026",
      etaMinutes: 8,
    },
    distanceMi: 5.1,
    durationMin: 18,
  },
  fare: 18.5,
  serviceFee: 2.5,
  total: 21.0,
  paymentMethod: { type: "visa", last4: "4821" },
  driver: {
    id: "d1",
    name: "Marcus W.",
    rating: 4.9,
    vehicle: "Toyota Camry",
    licensePlate: "ULT-2026",
    etaMinutes: 8,
  },
};

describe("CompletionSummary", () => {
  it("renders 'Ride Complete!' and fare breakdown", () => {
    render(<CompletionSummary data={mockData} />);
    expect(screen.getByText("Ride Complete!")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
    expect(screen.getByText("$2.50")).toBeInTheDocument();
    expect(screen.getByText("$21.00")).toBeInTheDocument();
    expect(screen.getByText("Visa ****4821")).toBeInTheDocument();
  });
});

describe("StarRating", () => {
  it("fills 4 stars when the 4th star is clicked", () => {
    const onRate = vi.fn();
    render(<StarRating onRate={onRate} />);
    const fourthStar = screen.getByLabelText("Rate 4 stars");
    fireEvent.click(fourthStar);
    expect(onRate).toHaveBeenCalledWith(4);
  });
});

describe("TipSelector", () => {
  it("highlights $2 when clicked", () => {
    const onTip = vi.fn();
    render(<TipSelector onTip={onTip} />);
    const twoButton = screen.getByText("$2");
    fireEvent.click(twoButton);
    expect(twoButton).toHaveClass("bg-primary");
    expect(onTip).toHaveBeenCalledWith(2);
  });
});

describe("IssueReportForm", () => {
  it("allows selecting a category and typing details", () => {
    const onSubmit = vi.fn();
    render(<IssueReportForm onSubmit={onSubmit} />);
    const unsafeDriving = screen.getByLabelText("Unsafe driving");
    fireEvent.click(unsafeDriving);
    expect(unsafeDriving).toBeChecked();

    const textarea = screen.getByPlaceholderText("Additional details (optional)");
    fireEvent.change(textarea, { target: { value: "Driver ran a red light" } });
    expect(textarea).toHaveValue("Driver ran a red light");

    fireEvent.click(screen.getByText("Submit Report"));
    expect(onSubmit).toHaveBeenCalledWith("Unsafe driving", "Driver ran a red light");
  });
});

describe("RideCompletePage", () => {
  it("renders all sections and 'Report an Issue' toggles form", () => {
    render(<RideCompletePage data={mockData} />);
    expect(screen.getByText("Ride Complete!")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();

    // Issue form should not be visible initially
    expect(screen.queryByText("What went wrong?")).not.toBeInTheDocument();

    // Click "Report an Issue" to show the form
    const reportButton = screen.getByText("Report an Issue");
    fireEvent.click(reportButton);
    expect(screen.getByText("What went wrong?")).toBeInTheDocument();

    // Click "Hide" to hide it again
    fireEvent.click(screen.getByText("Hide"));
    expect(screen.queryByText("What went wrong?")).not.toBeInTheDocument();
  });
});
