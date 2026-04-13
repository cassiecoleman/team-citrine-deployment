"use client";

import { Star, Phone, Shield } from "lucide-react";
import type { RideDetail } from "../types";
import { useDriverLocation } from "../use-driver-location";

export function DriverEnRouteCard({ ride }: { ride: RideDetail }) {
  const driver = ride.driver!;
  const { location } = useDriverLocation({
    driverId: driver.id,
  });
  const locationLabel = location
    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    : "Waiting for driver location...";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
          Driver En Route
        </span>
      </div>

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

      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-xs text-muted">Estimated Arrival</p>
        <p className="text-2xl font-bold">{ride.etaMin} min</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-muted">Route</p>
        <p className="text-sm font-semibold">{ride.pickup.address}</p>
        <p className="text-xs text-muted mt-1">to</p>
        <p className="text-sm font-semibold">{ride.dropoff.address}</p>
        <div className="mt-3">
          <p className="text-xs text-muted">Live location</p>
          <p className="text-sm font-semibold">{locationLabel}</p>
        </div>
      </div>

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
