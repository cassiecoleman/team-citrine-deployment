"use client";

import { Star, Phone, Shield } from "lucide-react";
import type { RideDetail } from "../types";

export function DriverArrivedCard({ ride }: { ride: RideDetail }) {
  const driver = ride.driver!;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
          Driver Arrived
        </span>
      </div>

      <h2 className="text-center font-semibold text-lg">Your driver is here!</h2>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-base">{driver.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="fill-primary text-primary" size={16} />
              <span className="text-sm">{driver.rating}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{driver.vehicle}</p>
            <p className="text-xs text-muted">{driver.licensePlate}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted text-center">
        Look for a {driver.vehicle} with plate {driver.licensePlate}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-xl border border-border px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <Phone size={16} />
          Contact Driver
        </button>
        <button className="rounded-xl border border-border px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <Shield size={16} />
          Safety Share
        </button>
      </div>
    </div>
  );
}
