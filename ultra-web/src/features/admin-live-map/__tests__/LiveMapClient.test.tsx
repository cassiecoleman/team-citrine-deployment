// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveLocationsResult } from "@/features/location/actions";

const channels: Array<{
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  handler?: (payload: unknown) => void;
  filter?: { table?: string };
}> = [];

const channelFactory = vi.fn(() => {
  const channel: (typeof channels)[number] = {
    on: vi.fn(
      (
        _event: string,
        filter: { table?: string },
        handler: (payload: unknown) => void,
      ) => {
        channel.handler = handler;
        channel.filter = filter;
        return channel;
      },
    ),
    subscribe: vi.fn(() => channel),
  };
  channels.push(channel);
  return channel;
});

const removeChannel = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    channel: channelFactory,
    removeChannel,
  }),
}));

vi.mock("react-leaflet", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    MapContainer: Pass,
    TileLayer: () => null,
    Polyline: () => <span data-testid="match-line" />,
    CircleMarker: ({
      center,
      pathOptions,
      children,
    }: {
      center: [number, number];
      pathOptions?: { color?: string };
      children?: React.ReactNode;
    }) => (
      <span
        data-testid="circle-marker"
        data-color={pathOptions?.color}
        data-lat={center[0]}
        data-lng={center[1]}
      >
        {children}
      </span>
    ),
    Popup: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  };
});

import { LiveMapClient } from "../components/LiveMapClient";

const initialLocations: LiveLocationsResult = {
  riders: [
    {
      id: "rider-1",
      name: "Aisha R.",
      lat: 35.16,
      lng: -90.06,
      updatedAt: "2026-04-27T22:00:00Z",
    },
  ],
  drivers: [
    {
      id: "driver-1",
      name: "Marcus W.",
      status: "available",
      lat: 35.14,
      lng: -90.05,
      updatedAt: "2026-04-27T22:00:00Z",
    },
  ],
  activeRides: [],
};

afterEach(() => {
  channels.length = 0;
  removeChannel.mockClear();
  channelFactory.mockClear();
});

describe("LiveMapClient", () => {
  it("renders rider and driver markers in distinct colors", () => {
    render(<LiveMapClient initialLocations={initialLocations} />);

    const markers = screen.getAllByTestId("circle-marker");
    const colors = markers.map((m) => m.getAttribute("data-color"));
    expect(colors).toContain("#2563eb"); // rider blue
    expect(colors).toContain("#f97316"); // driver orange
  });

  it("subscribes to riders and driver_locations channels", () => {
    render(<LiveMapClient initialLocations={initialLocations} />);

    expect(channelFactory).toHaveBeenCalledTimes(1);
    const channel = channels[0];
    expect(channel?.on).toHaveBeenCalled();
    expect(channel?.subscribe).toHaveBeenCalledTimes(1);
  });

  it("updates a rider marker position when a postgres_changes UPDATE arrives", () => {
    render(<LiveMapClient initialLocations={initialLocations} />);

    const channel = channels[0];

    act(() => {
      channel?.handler?.({
        eventType: "UPDATE",
        table: "riders",
        new: {
          id: "rider-1",
          name: "Aisha R.",
          current_lat: 35.18,
          current_lng: -90.07,
          current_location_updated_at: "2026-04-27T22:01:00Z",
        },
      });
    });

    const markers = screen.getAllByTestId("circle-marker");
    const riderMarker = markers.find((m) => m.getAttribute("data-color") === "#2563eb");
    expect(riderMarker?.getAttribute("data-lat")).toBe("35.18");
    expect(riderMarker?.getAttribute("data-lng")).toBe("-90.07");
  });
});
