"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { buildRideViewModel } from "./ride-status-adapter";
import type { RideDetail } from "./types";

interface UseRideStatusInput {
  rideId: string;
  initialRide: RideDetail;
}

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

  return { ride };
}
