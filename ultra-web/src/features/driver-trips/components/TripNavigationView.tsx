"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Check, MapPinned, Phone, Route } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ActiveDriverTrip } from "../types";

const RideMap = dynamic(
  () => import("@/features/maps/components/RideMap").then((mod) => mod.RideMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card text-xs text-muted">
        Loading map…
      </div>
    ),
  },
);

export function TripNavigationView({
  trip,
  rideStatus,
}: {
  trip: ActiveDriverTrip;
  rideStatus: string;
}) {
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const completedCount = completedChecks.length;

  function handleChecklistToggle(item: string) {
    setCompletedChecks((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }

  const isInProgress = rideStatus === "in_progress";
  const statusEyebrow = isInProgress ? "Driving to destination" : "En route to rider";
  const statusHeadline = isInProgress
    ? "Head to dropoff destination"
    : trip.routeProgressLabel;
  const statusDescription = isInProgress
    ? `Drive ${trip.riderName} to ${trip.dropoffLabel}.`
    : `${trip.pickupEtaMin} min to pickup for ${trip.riderName}`;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-primary-light p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              {statusEyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{statusHeadline}</h2>
            <p className="mt-1 text-sm text-muted">{statusDescription}</p>
          </div>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">
            {formatCurrency(trip.offeredFare)}
          </span>
        </div>

        {trip.pickupLat !== undefined &&
        trip.pickupLng !== undefined &&
        trip.dropoffLat !== undefined &&
        trip.dropoffLng !== undefined ? (
          <div className="mt-4 h-48">
            <RideMap
              pickup={{
                lat: trip.pickupLat,
                lng: trip.pickupLng,
                address: trip.pickupAddress,
              }}
              dropoff={{
                lat: trip.dropoffLat,
                lng: trip.dropoffLng,
                address: trip.dropoffAddress,
              }}
              driverLocation={
                trip.driverLat !== undefined && trip.driverLng !== undefined
                  ? { lat: trip.driverLat, lng: trip.driverLng }
                  : undefined
              }
              className="h-full w-full overflow-hidden rounded-xl border border-border"
            />
          </div>
        ) : (
          <div className="mt-4 flex h-48 items-center justify-center rounded-xl border border-border bg-card">
            <div className="text-center text-sm text-muted">
              <MapPinned aria-hidden="true" className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-medium text-foreground">Turn-by-turn map preview</p>
              <p className="text-xs">
                {trip.pickupLabel} to {trip.dropoffLabel}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted">Next turn</p>
            <p className="mt-1 text-sm font-semibold">{trip.nextTurn}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted">Destination ETA</p>
            <p className="mt-1 text-sm font-semibold">
              {trip.destinationEtaMin} min after pickup
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{trip.riderName}</p>
            <p className="text-xs text-muted">
              Rider rating {trip.riderRating} • {trip.mileageMi} mi total
            </p>
          </div>
          <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
            Pickup pin ready
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted">Pickup</p>
            <p className="mt-1 text-sm font-semibold">{trip.pickupLabel}</p>
            <p className="text-xs text-muted">{trip.pickupAddress}</p>
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted">Dropoff</p>
            <p className="mt-1 text-sm font-semibold">{trip.dropoffLabel}</p>
            <p className="text-xs text-muted">{trip.dropoffAddress}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted">Rider contact</p>
            </div>
            <p className="mt-1 text-sm font-semibold">{trip.riderPhone}</p>
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Route aria-hidden="true" className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted">Pickup PIN</p>
            </div>
            <p className="mt-1 text-sm font-semibold">{trip.pickupCode}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Before arrival
          </p>
          <p className="text-xs text-muted">
            {completedCount} of {trip.vehicleChecklist.length} arrival checks complete
          </p>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {trip.vehicleChecklist.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => handleChecklistToggle(item)}
                aria-pressed={completedChecks.includes(item)}
                className={`flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${
                  completedChecks.includes(item)
                    ? "border-success bg-success-light"
                    : "border-border"
                }`}
              >
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 text-success" />
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Accessibility notes</p>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {trip.accessibilityNotes.map((note) => (
            <li key={note} className="rounded-xl border border-border px-4 py-3">
              {note}
            </li>
          ))}
        </ul>
      </section>

      {rideStatus === "arrived" ? (
        <a
          href={`/trip/${trip.id}/pickup`}
          aria-label="Advance to pickup confirmation"
          className="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
        >
          Arrived at Pickup
        </a>
      ) : null}
    </div>
  );
}
