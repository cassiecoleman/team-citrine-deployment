"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockFareSplit, mockDriver, homeLocation, hospitalLocation } from "@/lib/mock-data";
import { RiderConfirmation } from "@/features/fare-split/components/RiderConfirmation";
import { formatCurrency } from "@/lib/utils";

export function SharedRideClient() {
  const router = useRouter();
  const [driverStatus, setDriverStatus] = useState<"matching" | "matched">("matching");
  const [booking, setBooking] = useState(false);

  // Simulate driver matching after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setDriverStatus("matched"), 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleConfirm() {
    setBooking(true);
    setTimeout(() => router.push("/receipt"), 1000);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Map placeholder */}
      <div className="rounded-xl bg-primary-light border border-border h-36 flex items-center justify-center">
        <div className="text-center text-sm text-muted">
          <p className="text-lg">
            {"\uD83D\uDCCD"}A &middot; &middot; &middot; {"\uD83D\uDCCD"}K &middot; &middot; → {"\uD83C\uDFE5"}
          </p>
          <p className="text-xs mt-1">Shared route</p>
        </div>
      </div>

      {/* Status */}
      <p className="text-center font-semibold text-sm">Ride Confirmed!</p>

      {/* Rider confirmation cards */}
      <RiderConfirmation riders={mockFareSplit.riders} />

      {/* Route & driver info */}
      <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
        <p>
          Route: {homeLocation.address.split("(")[0].trim()} → {hospitalLocation.address}
        </p>
        <p>ETA pickup: {mockDriver.etaMinutes} min</p>
        <p>
          Driver:{" "}
          {driverStatus === "matching" ? (
            <span className="text-muted">Matching...</span>
          ) : (
            <span className="text-success font-medium">
              {mockDriver.name} &middot; {mockDriver.rating}{"\u2B50"} &middot; {mockDriver.vehicle}
            </span>
          )}
        </p>
      </div>

      {/* Confirm & Book */}
      <button
        onClick={handleConfirm}
        disabled={booking}
        className="w-full rounded-xl bg-primary py-4 text-white font-semibold text-sm transition-opacity disabled:opacity-60 animate-pulse"
      >
        {booking ? "Booking..." : "Confirm & Book"}
      </button>
    </div>
  );
}
