import type { ActiveRidePass } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export function PassDashboard({ pass }: { pass: ActiveRidePass }) {
  return (
    <div className="space-y-4">
      {/* Active Pass Card */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-base">{"\u2726"} Weekly Commute</p>
            <span className="inline-block mt-1 rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-white">
              {"\u25CF"} Active
            </span>
          </div>
        </div>
        <div className="mt-3 text-sm space-y-1">
          <p>
            {"\uD83C\uDFE0"} {pass.route.from.address} → {"\uD83C\uDFE2"} {pass.route.to.address}
          </p>
          <p>{pass.plan.ridesPerWeek} rides &middot; {formatCurrency(pass.plan.pricePerWeek)}/wk</p>
          <p className="text-muted">Renews: {formatDate(pass.renewsOn)}</p>
        </div>
      </div>

      {/* Next Ride */}
      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">Next Ride</h3>
        <p className="text-sm">{"\uD83D\uDCC5"} Today &middot; 8:15 AM</p>
        <p className="text-sm">
          {"\uD83C\uDFE0"} Home → {"\uD83C\uDFE2"} Office
        </p>
        <p className="text-sm text-muted">
          {"\uD83C\uDFAB"} Pass ride ({pass.usedRides + 1} of {pass.plan.ridesPerWeek})
        </p>
        <Link
          href="/book"
          className="mt-3 block w-full rounded-xl bg-primary py-3 text-center text-white font-semibold text-sm"
        >
          {"\uD83D\uDE97"} Book First Ride
        </Link>
      </div>

      {/* Savings Tracker */}
      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">
          {"\uD83D\uDCB0"} Savings Tracker
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>This week:</span>
            <span>{formatCurrency(0)}/{formatCurrency(pass.plan.savingsPerWeek)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-success" style={{ width: "0%" }} />
          </div>
          <p className="text-sm text-muted">Monthly est: ~{formatCurrency(pass.plan.savingsPerWeek * 4)}</p>
        </div>
      </div>
    </div>
  );
}
