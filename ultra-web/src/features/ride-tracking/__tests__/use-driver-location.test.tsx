import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDriverLocation } from "../use-driver-location";

const removeChannel = vi.fn();
let realtimePayloadHandler:
  | ((payload: { new: { lat?: number; lng?: number; heading?: number | null } }) => void)
  | undefined;
const subscribeStatusHandlers: Array<(status: string) => void> = [];
const channels: Array<{
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
}> = [];

const createChannel = () => {
  const channel = {
    on: vi.fn(
      (
        _event: string,
        _filter: unknown,
        callback: (payload: { new: { lat?: number; lng?: number; heading?: number | null } }) => void,
      ) => {
        realtimePayloadHandler = callback;
        return channel;
      },
    ),
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

afterEach(() => {
  realtimePayloadHandler = undefined;
  removeChannel.mockClear();
  subscribeStatusHandlers.length = 0;
  channels.length = 0;
  channelFactory.mockClear();
});

describe("useDriverLocation", () => {
  it("does not subscribe when driver id is missing", () => {
    const { result, unmount } = renderHook(() =>
      useDriverLocation({
        driverId: "",
      }),
    );

    expect(channelFactory).not.toHaveBeenCalled();
    expect(result.current.location).toBeNull();

    unmount();
    expect(removeChannel).not.toHaveBeenCalled();
  });

  it("subscribes to driver location updates and maps payload coordinates", () => {
    const { result, unmount } = renderHook(() =>
      useDriverLocation({
        driverId: "driver-1",
      }),
    );

    expect(channelFactory).toHaveBeenCalledTimes(1);
    expect(channels[0]?.on).toHaveBeenCalledTimes(1);

    act(() => {
      realtimePayloadHandler?.({ new: { lat: 35.15, lng: -90.05, heading: 180 } });
    });

    expect(result.current.location).toEqual({
      lat: 35.15,
      lng: -90.05,
      heading: 180,
    });

    unmount();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });
});
