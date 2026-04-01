import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrustedDriversList } from "../components/TrustedDriversList";
import { SafetySettings } from "../components/SafetySettings";
import { NotificationSettings } from "../components/NotificationSettings";
import type {
  TrustedDriver,
  EmergencyContact,
  TripSharingSettings,
  NotificationPreferences,
} from "../types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockDrivers: TrustedDriver[] = [
  {
    id: "td-1",
    name: "Maria S.",
    rating: 4.9,
    totalRides: 142,
    verified: true,
  },
  {
    id: "td-2",
    name: "Carlos R.",
    rating: 4.7,
    totalRides: 87,
    verified: true,
  },
];

const mockContacts: EmergencyContact[] = [
  {
    id: "ec-1",
    name: "Rosa M.",
    relationship: "Mom",
    phone: "+1 (555) 987-6543",
    autoShare: true,
  },
  {
    id: "ec-2",
    name: "David M.",
    relationship: "Uncle",
    phone: "+1 (555) 876-5432",
    autoShare: false,
  },
];

const mockSharing: TripSharingSettings = {
  autoShareChildRides: true,
  includeLiveMapLink: true,
  notifyOnArrival: true,
};

const mockPreferences: NotificationPreferences = {
  phone: "+1 (555) 123-4567",
  smsRideConfirmed: true,
  smsDriverArrives: true,
  smsTripEnds: true,
  smsTripCancelled: true,
  pushNotifications: false,
  ridePassReminders: true,
};

describe("TrustedDriversList", () => {
  it("renders driver names and ratings", () => {
    render(<TrustedDriversList drivers={mockDrivers} />);
    expect(screen.getByText("Maria S.")).toBeInTheDocument();
    expect(screen.getByText("Carlos R.")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
  });

  it("renders verification badges", () => {
    render(<TrustedDriversList drivers={mockDrivers} />);
    expect(screen.getByText("142 rides · Verified")).toBeInTheDocument();
    expect(screen.getByText("87 rides · Verified")).toBeInTheDocument();
  });

  it('renders "Add Trusted Driver" button', () => {
    render(<TrustedDriversList drivers={mockDrivers} />);
    expect(screen.getByText("Add Trusted Driver")).toBeInTheDocument();
  });

  it("renders PIN verification info text", () => {
    render(<TrustedDriversList drivers={mockDrivers} />);
    expect(
      screen.getByText(/PIN before starting a ride/),
    ).toBeInTheDocument();
  });
});

describe("SafetySettings", () => {
  it("renders emergency contact names and phones", () => {
    render(<SafetySettings contacts={mockContacts} sharing={mockSharing} />);
    expect(screen.getByText("Rosa M.")).toBeTruthy();
    expect(screen.getByText("+1 (555) 987-6543")).toBeInTheDocument();
    expect(screen.getByText("David M.")).toBeTruthy();
    expect(screen.getByText("+1 (555) 876-5432")).toBeInTheDocument();
  });

  it("renders auto-share toggles with correct initial state", () => {
    render(<SafetySettings contacts={mockContacts} sharing={mockSharing} />);
    const rosaToggle = screen.getByRole("switch", {
      name: "Auto-share with Rosa M.",
    });
    const davidToggle = screen.getByRole("switch", {
      name: "Auto-share with David M.",
    });
    expect(rosaToggle).toHaveAttribute("aria-checked", "true");
    expect(davidToggle).toHaveAttribute("aria-checked", "false");
  });

  it("renders trip sharing toggles", () => {
    render(<SafetySettings contacts={mockContacts} sharing={mockSharing} />);
    expect(
      screen.getByText("Auto-share all child rides"),
    ).toBeInTheDocument();
    expect(screen.getByText("Include live map link")).toBeInTheDocument();
    expect(screen.getByText("Notify on arrival")).toBeInTheDocument();
  });

  it("toggling a switch changes its aria-checked state", async () => {
    const user = userEvent.setup();
    render(<SafetySettings contacts={mockContacts} sharing={mockSharing} />);
    const davidToggle = screen.getByRole("switch", {
      name: "Auto-share with David M.",
    });
    expect(davidToggle).toHaveAttribute("aria-checked", "false");
    await user.click(davidToggle);
    expect(davidToggle).toHaveAttribute("aria-checked", "true");
  });
});

describe("NotificationSettings", () => {
  it("renders phone number", () => {
    render(<NotificationSettings preferences={mockPreferences} />);
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });

  it("renders all SMS event toggles", () => {
    render(<NotificationSettings preferences={mockPreferences} />);
    expect(
      screen.getByRole("switch", { name: "Ride confirmed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Driver arrives" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Trip ends" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Trip cancelled" }),
    ).toBeInTheDocument();
  });

  it("renders in-app notification section", () => {
    render(<NotificationSettings preferences={mockPreferences} />);
    expect(screen.getByText("In-App Notifications")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Push notifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Ride Pass reminders" }),
    ).toBeInTheDocument();
  });

  it("toggling SMS toggle changes aria-checked", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings preferences={mockPreferences} />);
    const pushToggle = screen.getByRole("switch", {
      name: "Push notifications",
    });
    expect(pushToggle).toHaveAttribute("aria-checked", "false");
    await user.click(pushToggle);
    expect(pushToggle).toHaveAttribute("aria-checked", "true");
  });
});
