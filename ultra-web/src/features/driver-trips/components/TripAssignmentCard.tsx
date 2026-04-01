"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheckBig, Route } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TripAssignment } from "../types";

export function TripAssignmentCard({
  assignment,
}: {
  assignment: TripAssignment;
}) {
  const [isRejected, setIsRejected] = useState(false);

  function handleRejectTrip() {
    setIsRejected(true);
  }

  function handleReviewNextRequest() {
    setIsRejected(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Incoming assignment
            </p>
            <h2 className="mt-1 text-xl font-semibold">{assignment.riderName}</h2>
            <p className="mt-1 text-sm text-muted">{assignment.note}</p>
          </div>
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            Pickup in {assignment.pickupEtaMin} min
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-light px-3 py-3 text-sm text-foreground">
          <CircleCheckBig aria-hidden="true" className="h-4 w-4 text-success" />
          <span>{assignment.urgencyLabel}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-primary-light px-3 py-3">
            <p className="text-xs text-muted">Offered fare</p>
            <p className="mt-1 text-lg font-semibold text-primary">
              {formatCurrency(assignment.offeredFare)}
            </p>
          </div>
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="text-xs text-muted">Trip time</p>
            <p className="mt-1 text-lg font-semibold">
              {assignment.estimatedTripTimeMin} min
            </p>
          </div>
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="text-xs text-muted">Mileage</p>
            <p className="mt-1 text-lg font-semibold">{assignment.mileageMi} mi</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Route aria-hidden="true" className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Route</p>
        </div>
        <div className="mt-3 space-y-3">
          <div className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-success" />
            <div>
              <p className="text-sm font-semibold">{assignment.pickupLabel}</p>
              <p className="text-xs text-muted">{assignment.pickupAddress}</p>
            </div>
          </div>
          <div className="ml-[5px] h-8 w-px border-l border-dashed border-border" />
          <div className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold">{assignment.dropoffLabel}</p>
              <p className="text-xs text-muted">{assignment.dropoffAddress}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Accessibility notes</p>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {assignment.accessibilityNotes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 text-primary" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {isRejected ? (
        <section
          aria-live="polite"
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold">Assignment declined</p>
          <p className="mt-1 text-sm text-muted">
            This is a front-end stub, so the same assignment stays available for
            review until the next mock dispatch refresh.
          </p>
          <button
            type="button"
            onClick={handleReviewNextRequest}
            className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-semibold"
          >
            Review Next Request
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleRejectTrip}
            className="rounded-xl border border-border py-3 text-sm font-semibold text-muted"
          >
            Reject
          </button>
          <Link
            href={`/trip/${assignment.id}`}
            className="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
          >
            Accept Trip
          </Link>
        </div>
      )}
    </div>
  );
}
