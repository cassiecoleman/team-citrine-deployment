"use client";

import Link from "next/link";
import type { RidePassPlan } from "../types";
import { formatCurrency } from "@/lib/utils";

export function PassCard({ plan }: { plan: RidePassPlan }) {
  return (
    <Link
      href={`/passes/review?plan=${plan.id}`}
      className={`block rounded-xl border p-4 transition-colors ${
        plan.recommended
          ? "border-primary bg-primary-light"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-base">
            {plan.tier === "weekly-5" ? "\u2726 Weekly Commute" : `${plan.ridesPerWeek} rides/week`}
          </p>
          <p className="text-sm text-muted mt-1">
            {plan.ridesPerWeek} rides/week
          </p>
        </div>
        {plan.recommended && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
            BEST
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{formatCurrency(plan.pricePerWeek)}</span>
        <span className="text-sm text-muted">/week</span>
      </div>
      <p className="text-sm text-muted mt-1">
        {formatCurrency(plan.pricePerRide)}/ride
      </p>
      <p className="text-sm text-success font-medium mt-2">
        Save {formatCurrency(plan.savingsPerWeek)}/wk &#10003;
      </p>
    </Link>
  );
}
