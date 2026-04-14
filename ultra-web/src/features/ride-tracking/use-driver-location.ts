"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

interface UseDriverLocationInput {
  driverId?: string | null;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number | null;
}

interface DriverLocationEventDetail {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number | null;
}

export function useDriverLocation({
  driverId,
}: UseDriverLocationInput): { location: DriverLocation | null } {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      return;
    }

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
        .channel(`driver-location:${driverId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "driver_locations",
            filter: `driver_id=eq.${driverId}`,
          },
          (payload) => {
            const next = payload.new as { lat?: number; lng?: number; heading?: number | null };
            if (typeof next.lat !== "number" || typeof next.lng !== "number") {
              return;
            }

            setLocation({
              lat: next.lat,
              lng: next.lng,
              heading: next.heading ?? null,
            });
          },
        )
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
  }, [driverId, supabase]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !driverId) {
      return;
    }

    const testWindow = window as Window & { __ultraDriverLocationListenerReady?: boolean };
    testWindow.__ultraDriverLocationListenerReady = true;

    const handleDebugLocationUpdate = (event: Event) => {
      const detail = (event as CustomEvent<DriverLocationEventDetail>).detail;
      if (!detail || detail.driverId !== driverId) {
        return;
      }

      setLocation({
        lat: detail.lat,
        lng: detail.lng,
        heading: detail.heading ?? null,
      });
    };

    window.addEventListener("ultra:driver-location-update", handleDebugLocationUpdate);
    return () => {
      testWindow.__ultraDriverLocationListenerReady = false;
      window.removeEventListener("ultra:driver-location-update", handleDebugLocationUpdate);
    };
  }, [driverId]);

  return { location };
}
