"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CircleUserRound } from "lucide-react";
import type { ActiveDriverTrip } from "../types";

export function PickupConfirmationCard({
  trip,
}: {
  trip: ActiveDriverTrip;
}) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isPickupConfirmed, setIsPickupConfirmed] = useState(false);
  const verificationSteps = [
    "Confirm the rider says the name on screen.",
    "Confirm curbside pickup matches the app pin.",
  ] as const;
  const canConfirmPickup = completedSteps.length === verificationSteps.length;

  function handleStepToggle(step: string) {
    setCompletedSteps((current) =>
      current.includes(step)
        ? current.filter((value) => value !== step)
        : [...current, step],
    );
  }

  function handleConfirmPickup() {
    if (!canConfirmPickup) {
      return;
    }

    setIsPickupConfirmed(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-success-light p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-success">
          At pickup pin
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Confirm passenger before start</h2>
        <p className="mt-2 text-sm text-muted">
          Ask for the rider name and match it before unlocking trip start.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-3xl">
          <CircleUserRound aria-hidden="true" className="h-10 w-10 text-primary" />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted">
          Passenger name
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{trip.riderName}</h3>
        <p className="mt-2 text-sm text-muted">
          Pickup at {trip.pickupLabel} • Destination {trip.dropoffLabel}
        </p>
        <p className="mt-2 text-sm font-semibold text-primary">
          Pickup PIN {trip.pickupCode}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Identity check steps</p>
        <div className="mt-3 space-y-3 text-sm text-foreground">
          {verificationSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => handleStepToggle(step)}
              aria-pressed={completedSteps.includes(step)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                completedSteps.includes(step)
                  ? "border-success bg-success-light"
                  : "border-border"
              }`}
            >
              {index + 1}. {step}
            </button>
          ))}
          <div className="rounded-xl border border-border px-4 py-3">
            3. Start the trip only after both checks are complete.
          </div>
        </div>
      </section>

      {isPickupConfirmed ? (
        <section
          aria-live="polite"
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-success">
            <BadgeCheck aria-hidden="true" className="h-5 w-5" />
            <p className="text-sm font-semibold">Pickup confirmed</p>
          </div>
          <p className="mt-2 text-sm text-muted">
            The rider check is complete. This stub keeps you in the driver flow
            while the trip start backend is still pending.
          </p>
          <Link
            href="/driver"
            className="mt-4 block w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
          >
            Return to Shift Board
          </Link>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Driver reminder</p>
        <p className="mt-1 text-sm text-muted">
          Accessibility note: {trip.accessibilityNotes[0]}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/trip/${trip.id}`}
          className="rounded-xl border border-border py-3 text-center text-sm font-semibold"
        >
          Back to Map
        </Link>
        <button
          type="button"
          onClick={handleConfirmPickup}
          disabled={!canConfirmPickup}
          className="rounded-xl bg-success py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          Confirm Pickup
        </button>
      </div>
    </div>
  );
}
