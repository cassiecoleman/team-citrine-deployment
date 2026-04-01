import Link from "next/link";
import type { ActiveDriverTrip } from "../types";

export function PickupConfirmationCard({
  trip,
}: {
  trip: ActiveDriverTrip;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="rounded-2xl border border-border bg-success-light p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-success">
          At pickup pin
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Confirm passenger before start</h2>
        <p className="mt-2 text-sm text-muted">
          Ask for the rider name and match it before unlocking trip start.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-3xl">
          {"\uD83D\uDC64"}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted">
          Passenger name
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{trip.riderName}</h3>
        <p className="mt-2 text-sm text-muted">
          Pickup at {trip.pickupLabel} • Destination {trip.dropoffLabel}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Identity check steps</p>
        <div className="mt-3 space-y-3 text-sm text-foreground">
          <div className="rounded-xl border border-border px-4 py-3">
            1. Confirm the rider says the name on screen.
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            2. Confirm curbside pickup matches the app pin.
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            3. Start the trip only after both checks are complete.
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/trip/${trip.id}`}
          className="rounded-xl border border-border py-3 text-center text-sm font-semibold"
        >
          Back to Map
        </Link>
        <button className="rounded-xl bg-success py-3 text-sm font-semibold text-white">
          Confirm Pickup
        </button>
      </div>
    </div>
  );
}
