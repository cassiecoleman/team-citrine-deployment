"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { buildRideViewModel } from "./ride-status-adapter";
import type { RideDetail } from "./types";

interface UseRideStatusInput {
  rideId: string;
  initialRide: RideDetail;
}

interface DebugRideStatusEventDetail {
  rideId: string;
  status: string;
}

const STATUS_POLL_INTERVAL_MS = 5000;

export function useRideStatus({ rideId, initialRide }: UseRideStatusInput): {
  ride: RideDetail;
} {
  const [ride, setRide] = useState<RideDetail>(initialRide);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let isActive = true;

    const scheduleReconnect = () => {
      if (!isActive || reconnectTimer) {
        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        void supabase.removeChannel(channel!);
        connect();
      }, 1000);
    };

    const connect = () => {
      channel = supabase
        .channel(`ride-status:${rideId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` }, (payload) => {
          setRide((previousRide) =>
            buildRideViewModel(previousRide, {
              status: (payload.new as { status?: string }).status,
            }),
          );
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            scheduleReconnect();
          }
        });
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [rideId, supabase]);

  useEffect(() => {
    let isActive = true;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const syncStatus = async () => {
      try {
        const response = await fetch(`/api/rides/${rideId}/status`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { status?: string };
        if (!isActive || !payload.status) {
          return;
        }
        setRide((previousRide) =>
          buildRideViewModel(previousRide, {
            status: payload.status,
          }),
        );
      } catch {
        // Ignore transient polling errors; realtime/debug updates still apply.
      }
    };

    void syncStatus();
    pollTimer = setInterval(() => {
      void syncStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [rideId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const testWindow = window as Window & { __ultraRideStatusListenerReady?: boolean };
    testWindow.__ultraRideStatusListenerReady = true;

    const handleDebugStatusUpdate = (event: Event) => {
      const detail = (event as CustomEvent<DebugRideStatusEventDetail>).detail;
      if (!detail || detail.rideId !== rideId) {
        return;
      }

      setRide((previousRide) =>
        buildRideViewModel(previousRide, {
          status: detail.status,
        }),
      );
    };

    window.addEventListener("ultra:ride-status-update", handleDebugStatusUpdate);
    return () => {
      testWindow.__ultraRideStatusListenerReady = false;
      window.removeEventListener("ultra:ride-status-update", handleDebugStatusUpdate);
    };
  }, [rideId]);

  return { ride };
}
