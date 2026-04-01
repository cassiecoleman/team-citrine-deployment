"use client";

import Link from "next/link";
import type { FareEstimate } from "@/features/fare-split/types";
import { formatCurrency } from "@/lib/utils";

export function BookingClient({ estimate }: { estimate: FareEstimate }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Map placeholder */}
      <div className="rounded-xl bg-primary-light border border-border h-40 flex items-center justify-center">
        <div className="text-center text-sm text-muted">
          <p className="text-2xl mb-1">
            {"\uD83D\uDCCD"} - - - - - {"\uD83C\uDFE5"}
          </p>
          <p className="text-xs">Route preview</p>
        </div>
      </div>

      {/* From / To */}
      <div className="space-y-2">
        <label className="text-xs text-muted">From:</label>
        <div className="rounded-lg border border-border px-4 py-2.5 text-sm">
          {"\uD83C\uDFE0"} 742 Elm St (Home)
        </div>
        <label className="text-xs text-muted">To:</label>
        <div className="rounded-lg border border-border px-4 py-2.5 text-sm">
          {"\uD83C\uDFE5"} Metro General Hospital
        </div>
      </div>

      {/* Fare estimate */}
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-xs text-muted mb-1">Estimated Fare</p>
        <p className="text-lg font-bold">
          {"\uD83D\uDCB3"} {formatCurrency(estimate.totalFare)}{" "}
          <span className="text-sm font-normal text-muted">solo</span>
        </p>
      </div>

      {/* Split Fare button */}
      <Link
        href="/book/split"
        className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary-light px-4 py-4"
      >
        <div>
          <p className="font-semibold text-sm">
            {"\uD83D\uDC64\uD83D\uDC64"} Split Fare
          </p>
          <p className="text-xs text-muted">Save up to 50%</p>
        </div>
        <span className="text-primary font-semibold text-sm">
          {formatCurrency(estimate.totalFare / 2)} each
        </span>
      </Link>
    </div>
  );
}
