import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilePage } from "../components/ProfilePage";
import type { ParentAccount, ChildProfile } from "../types";

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

const mockAccount: ParentAccount = {
  id: "u1",
  name: "Maria Johnson",
  email: "maria@email.com",
  phone: "+1 (555) 123-4567",
};

const mockChildren: ChildProfile[] = [
  { id: "cp-1", name: "Emma", age: 9, emergencyContactName: "Rosa M." },
  { id: "cp-2", name: "Lucas", age: 6, emergencyContactName: "Rosa M." },
];

describe("ProfilePage", () => {
  it("renders parent account info", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    expect(screen.getByText("Maria Johnson")).toBeInTheDocument();
    expect(screen.getByText("maria@email.com")).toBeInTheDocument();
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });

  it("renders child profile cards", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    expect(screen.getByText("Emma, 9")).toBeInTheDocument();
    expect(screen.getByText("Lucas, 6")).toBeInTheDocument();
  });

  it("renders emergency contact on each card", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    const emergencyTexts = screen.getAllByText(/Rosa M\./);
    expect(emergencyTexts).toHaveLength(2);
  });

  it("renders add rider profile button", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    expect(
      screen.getByText("Add Rider Profile").closest("button")
    ).toBeInTheDocument();
  });

  it("renders quick links", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    expect(screen.getByText("Safety Settings")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Payment Methods")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("safety settings link points to correct URL", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    const link = screen.getByText("Safety Settings").closest("a");
    expect(link).toHaveAttribute("href", "/profile/safety");
  });

  it("notifications link points to correct URL", () => {
    render(<ProfilePage account={mockAccount} children={mockChildren} />);
    const link = screen.getByText("Notifications").closest("a");
    expect(link).toHaveAttribute("href", "/profile/notifications");
  });
});
