import Link from "next/link";
import { CarFront } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DriverShiftSummary } from "../types";

export function DriverShiftBoard({
  summary,
}: {
  summary: DriverShiftSummary;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
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
            {summary.status}
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
          <Link
            href="/queue"
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Review Queue
          </Link>
          <Link
            href="/trip/trip-204"
            className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold"
          >
            Open Active Trip
          </Link>
        </div>
      </section>
    </div>
  );
}
