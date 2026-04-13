import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RideDetail } from "../types";
import { useRideStatus } from "../use-ride-status";

const removeChannel = vi.fn();
let realtimePayloadHandler: ((payload: { new: { status?: string } }) => void) | undefined;
const subscribeStatusHandlers: Array<(status: string) => void> = [];
const channels: Array<{
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
}> = [];

const createChannel = () => {
  const channel = {
    on: vi.fn((_event: string, _filter: unknown, callback: (payload: { new: { status?: string } }) => void) => {
      realtimePayloadHandler = callback;
      return channel;
    }),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      if (callback) {
        subscribeStatusHandlers.push(callback);
      }
      return channel;
    }),
  };
  channels.push(channel);
  return channel;
};

const channelFactory = vi.fn(() => createChannel());


vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    channel: channelFactory,
    removeChannel,
  }),
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
    id: "driver-1",
    name: "Marcus W.",
    rating: 4.9,
    vehicle: "Toyota Camry",
    licensePlate: "ULT-2026",
    etaMinutes: 8,
  },
  progressPercent: 0,
  distanceRemainingMi: 5.1,
  etaMin: 8,
};

afterEach(() => {
  realtimePayloadHandler = undefined;
  removeChannel.mockClear();
  subscribeStatusHandlers.length = 0;
  channels.length = 0;
  channelFactory.mockClear();
});

describe("useRideStatus", () => {
  it("subscribes to ride updates and applies realtime status changes", () => {
    const { result, unmount } = renderHook(() =>
      useRideStatus({
        rideId: "ride-1",
        initialRide: baseRide,
      }),
    );

    expect(channelFactory).toHaveBeenCalledTimes(1);
    expect(channels[0]?.on).toHaveBeenCalledTimes(1);
    expect(channels[0]?.subscribe).toHaveBeenCalledTimes(1);

    act(() => {
      realtimePayloadHandler?.({ new: { status: "driver_en_route" } });
    });

    expect(result.current.ride.status).toBe("en_route");

    unmount();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });

  it("re-subscribes when the realtime channel reports an error", () => {
    vi.useFakeTimers();

    renderHook(() =>
      useRideStatus({
        rideId: "ride-1",
        initialRide: baseRide,
      }),
    );

    expect(channelFactory).toHaveBeenCalledTimes(1);

    act(() => {
      subscribeStatusHandlers[0]?.("CHANNEL_ERROR");
      vi.advanceTimersByTime(1000);
    });

    expect(channelFactory).toHaveBeenCalledTimes(2);
    expect(channels[1]?.subscribe).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
