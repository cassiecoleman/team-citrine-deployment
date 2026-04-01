"use client";

import { Loader2, MapPin } from "lucide-react";
import type { RideDetail } from "../types";
import { formatCurrency } from "@/lib/utils";

export function MatchingScreen({ ride }: { ride: RideDetail }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="animate-pulse rounded-full bg-primary-light p-6">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
        <p className="font-semibold text-lg">Finding your driver...</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <MapPin className="text-primary mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-xs text-muted">Pickup</p>
            <p className="text-sm font-semibold">{ride.pickup.address}</p>
          </div>
        </div>
        <div className="ml-2.5 h-6 border-l border-dashed border-border" />
        <div className="flex items-start gap-3">
          <MapPin className="text-muted mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-xs text-muted">Destination</p>
            <p className="text-sm font-semibold">{ride.dropoff.address}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className="text-sm text-muted">Estimated Fare</p>
          <p className="font-bold">{formatCurrency(ride.estimatedFare)}</p>
        </div>
      </div>

      <button className="rounded-xl border border-border px-4 py-3 text-sm font-semibold">
        Cancel Request
      </button>
    </div>
  );
}
