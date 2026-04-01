"use client";

import { useState } from "react";
import Link from "next/link";
import { CarFront, PauseCircle, RadioTower } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DriverShiftSummary } from "../types";

export function DriverShiftBoard({
  summary,
}: {
  summary: DriverShiftSummary;
}) {
  const [isOnline, setIsOnline] = useState(summary.status === "online");
  const activeStatusLabel = isOnline
    ? "Available for the next assignment"
    : "Offline until the next dispatch window";

  function handleAvailabilityToggle() {
    setIsOnline((current) => !current);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-primary px-4 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">
              Driver shift
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{summary.driverName}</h2>
            <p className="mt-1 text-sm text-white/85">{summary.shiftWindow}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {isOnline ? "online" : "offline"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <p className="text-xs text-white/75">Trips today</p>
            <p className="mt-1 text-xl font-semibold">{summary.todayTrips}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <p className="text-xs text-white/75">Earnings</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.earningsToday)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white/10 px-3 py-3">
          <p className="text-xs text-white/75">Shift status</p>
          <p aria-live="polite" className="mt-1 text-sm font-semibold">
            {activeStatusLabel}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-xs text-muted">Acceptance</p>
          <p className="mt-1 text-lg font-semibold">{summary.acceptanceRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-xs text-muted">Completion</p>
          <p className="mt-1 text-lg font-semibold">{summary.completionRate}%</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex items-center gap-2 text-muted">
            <RadioTower aria-hidden="true" className="h-4 w-4" />
            <p className="text-xs">Queue waiting</p>
          </div>
          <p className="mt-1 text-lg font-semibold">{summary.pendingQueueCount}</p>
          <p className="mt-1 text-xs text-muted">Assignments ready to review</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex items-center gap-2 text-muted">
            <PauseCircle aria-hidden="true" className="h-4 w-4" />
            <p className="text-xs">Break plan</p>
          </div>
          <p className="mt-1 text-sm font-semibold">{summary.nextBreakLabel}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Ready for your next pickup</p>
            <p className="mt-1 text-xs text-muted">
              Keep queue review and passenger confirmation within thumb reach.
            </p>
          </div>
          <CarFront aria-hidden="true" className="h-6 w-6 text-primary" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAvailabilityToggle}
            aria-pressed={isOnline}
            className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-primary-light"
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
          <Link
            href="/queue"
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Review Queue
          </Link>
          <Link
            href="/trip/trip-204"
            aria-label="Open active trip details"
            className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold"
          >
            Open Active Trip
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Active trip handoff</p>
        <p className="mt-1 text-xs text-muted">
          Current trip ID {summary.activeTripId} stays one tap away while you
          review your shift.
        </p>
      </section>
    </div>
  );
}
