import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ScheduleForm } from "../components/ScheduleForm";
import type { Location } from "@/types";
import type { RiderProfile } from "../types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPickup: Location = {
  lat: 40.7128,
  lng: -74.006,
  address: "742 Elm St (Home)",
};

const mockDropoff: Location = {
  lat: 40.7489,
  lng: -73.968,
  address: "Metro General Hospital",
};

const mockProfiles: RiderProfile[] = [
  { id: "rp-1", name: "Emma", age: 9, emergencyContact: "Rosa M." },
  { id: "rp-2", name: "Lucas", age: 6, emergencyContact: "Rosa M." },
];

const defaultProps = {
  pickup: mockPickup,
  dropoff: mockDropoff,
  fare: 12,
  profiles: mockProfiles,
  submitScheduleAction: async () => {},
};

describe("ScheduleForm", () => {
  it("renders pickup and dropoff addresses", () => {
    render(<ScheduleForm {...defaultProps} />);
    expect(screen.getByText("742 Elm St (Home)")).toBeInTheDocument();
    expect(screen.getByText("Metro General Hospital")).toBeInTheDocument();
  });

  it("renders date and time inputs", () => {
    render(<ScheduleForm {...defaultProps} />);
    const dateInput = document.querySelector('input[type="date"]');
    const timeInput = document.querySelector('input[type="time"]');
    expect(dateInput).toBeInTheDocument();
    expect(timeInput).toBeInTheDocument();
  });

  it("date picker limits to 7 days ahead", () => {
    render(<ScheduleForm {...defaultProps} />);
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const expectedMax = maxDate.toISOString().split("T")[0];
    expect(dateInput.max).toBe(expectedMax);
  });

  it("recurring toggle shows day selectors", async () => {
    const user = userEvent.setup();
    render(<ScheduleForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /recurring ride/i }));

    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    // S appears twice (Sun + Sat) — check both are present
    const sButtons = screen.getAllByText("S");
    expect(sButtons.length).toBe(2);
  });

  it("clicking day buttons toggles selection", async () => {
    const user = userEvent.setup();
    render(<ScheduleForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /recurring ride/i }));

    // The day buttons: S M T W T F S (indices 0-6)
    // "M" is unique, click it
    const mondayBtn = screen.getByText("M");
    expect(mondayBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(mondayBtn);
    expect(mondayBtn).toHaveAttribute("aria-pressed", "true");

    // Click "M" again to deselect
    await user.click(mondayBtn);
    expect(mondayBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("rider profile selector appears when recurring", async () => {
    const user = userEvent.setup();
    render(<ScheduleForm {...defaultProps} />);

    // Profile select should not be visible initially
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /recurring ride/i }));

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Emma (Age 9)")).toBeInTheDocument();
    expect(screen.getByText("Lucas (Age 6)")).toBeInTheDocument();
  });

  it("shows fare estimate", () => {
    render(<ScheduleForm {...defaultProps} />);
    expect(screen.getByText("$12.00/ride")).toBeInTheDocument();
  });

  it("confirm button is present", () => {
    render(<ScheduleForm {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /confirm schedule/i }),
    ).toBeInTheDocument();
  });
});
