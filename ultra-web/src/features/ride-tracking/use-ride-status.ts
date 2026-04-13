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
    const channel = supabase
      .channel(`ride-status:${rideId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` }, (payload) => {
        setRide((previousRide) =>
          buildRideViewModel(previousRide, {
            status: (payload.new as { status?: string }).status,
          }),
        );
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [rideId, supabase]);

  return { ride };
}
