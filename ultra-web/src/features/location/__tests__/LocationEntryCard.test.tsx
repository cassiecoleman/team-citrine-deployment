// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const submitMyLocation = vi.fn();

vi.mock("../actions", () => ({
  submitMyLocation: (...args: unknown[]) => submitMyLocation(...args),
}));

import { LocationEntryCard } from "../components/LocationEntryCard";

describe("LocationEntryCard", () => {
  it("submits an address to submitMyLocation", async () => {
    submitMyLocation.mockResolvedValueOnce({
      success: true,
      error: null,
      lat: 35.1495,
      lng: -90.049,
      updatedAt: "2026-04-27T22:00:00Z",
    });

    render(<LocationEntryCard />);

    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "1150 West End Ave, Memphis, TN" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save location/i }));

    await waitFor(() => {
      expect(submitMyLocation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ address: "1150 West End Ave, Memphis, TN" }),
      );
    });

    expect(await screen.findByText(/35\.1495/)).toBeInTheDocument();
  });

  it("submits explicit lat/lng when no address is provided", async () => {
    submitMyLocation.mockResolvedValueOnce({
      success: true,
      error: null,
      lat: 35.15,
      lng: -90.05,
      updatedAt: "2026-04-27T22:00:00Z",
    });

    render(<LocationEntryCard />);

    fireEvent.click(screen.getByRole("button", { name: /lat \/ lng/i }));

    fireEvent.change(screen.getByLabelText(/latitude/i), {
      target: { value: "35.15" },
    });
    fireEvent.change(screen.getByLabelText(/longitude/i), {
      target: { value: "-90.05" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save location/i }));

    await waitFor(() => {
      expect(submitMyLocation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ lat: 35.15, lng: -90.05 }),
      );
    });
  });

  it("shows the error message when submitMyLocation fails", async () => {
    submitMyLocation.mockResolvedValueOnce({
      success: false,
      error: 'Could not find coordinates for "nowhereville xyz".',
    });

    render(<LocationEntryCard />);

    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "nowhereville xyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save location/i }));

    expect(
      await screen.findByText(/could not find coordinates/i),
    ).toBeInTheDocument();
  });
});
