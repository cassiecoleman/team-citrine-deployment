"use client";

import { MapPin, Share2 } from "lucide-react";
import type { RideDetail } from "../types";

export function InProgressTracker({ ride }: { ride: RideDetail }) {
  const progressPercent = ride.progressPercent ?? 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
          Ride In Progress
        </span>
      </div>

      <div className="h-56 rounded-xl bg-border flex items-center justify-center">
        <MapPin className="text-muted" size={24} />
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-muted">Destination</p>
        <p className="text-sm font-semibold">{ride.dropoff.address}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">ETA</p>
            <p className="text-sm font-bold">{ride.etaMin} min</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Distance Remaining</p>
            <p className="text-sm font-bold">{ride.distanceRemainingMi} mi</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-success"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <button className="rounded-xl border border-border px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
        <Share2 size={16} />
        Share Trip
      </button>
    </div>
  );
}
