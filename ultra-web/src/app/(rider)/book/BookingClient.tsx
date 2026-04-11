"use client";

import Link from "next/link";
import { MapPin, CreditCard, Users, Calendar } from "lucide-react";
import type { FareEstimate } from "@/features/fare-split/types";
import { formatCurrency } from "@/lib/utils";

interface BookingClientProps {
  estimate: FareEstimate;
  requestRideAction: (formData: FormData) => void | Promise<void>;
}

export function BookingClient({ estimate, requestRideAction }: BookingClientProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Map placeholder */}
      <div className="rounded-xl bg-primary-light border border-border h-40 flex items-center justify-center">
        <div className="text-center text-sm text-muted">
          <MapPin size={24} className="mx-auto mb-1 text-primary" />
          <p className="text-xs">Route preview</p>
        </div>
      </div>

      {/* From / To */}
      <div className="space-y-2">
        <label className="text-xs text-muted">From:</label>
        <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm">
          <MapPin size={16} className="text-success" />
          742 Elm St (Home)
        </div>
        <label className="text-xs text-muted">To:</label>
        <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm">
          <MapPin size={16} className="text-primary" />
          Metro General Hospital
        </div>
      </div>

      {/* Fare estimate */}
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-xs text-muted mb-1">Ride Estimate</p>
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-muted" />
          <span className="text-lg font-bold">{formatCurrency(estimate.totalFare)}</span>
          <span className="text-sm text-muted">solo</span>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted">
          <span>{estimate.distanceMi} mi</span>
          <span>~{estimate.durationMin} min</span>
        </div>
      </div>

      {/* Split Fare button */}
      <Link
        href="/book/split"
        className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary-light px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <div>
            <p className="font-semibold text-sm">Split Fare</p>
            <p className="text-xs text-muted">Save up to 50%</p>
          </div>
        </div>
        <span className="text-primary font-semibold text-sm">
          {formatCurrency(estimate.totalFare / 2)} each
        </span>
      </Link>

      {/* Schedule button */}
      <Link
        href="/book/schedule"
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-3"
      >
        <Calendar size={16} className="text-muted" />
        <div>
          <p className="font-semibold text-sm">Schedule</p>
          <p className="text-xs text-muted">Book for later</p>
        </div>
      </Link>

      {/* Request Ride CTA */}
      <form action={requestRideAction}>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-4 text-center text-white font-semibold"
        >
          Request Ride {formatCurrency(estimate.totalFare)}
        </button>
      </form>
    </div>
  );
}
