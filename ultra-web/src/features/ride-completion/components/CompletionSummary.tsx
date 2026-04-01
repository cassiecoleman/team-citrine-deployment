"use client";

import { CircleCheck } from "lucide-react";
import type { RideCompletionData } from "../types";
import { formatCurrency } from "@/lib/utils";

export function CompletionSummary({ data }: { data: RideCompletionData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 py-4">
        <CircleCheck className="text-success" size={40} />
        <h1 className="font-semibold text-xl">Ride Complete!</h1>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <p className="text-sm">Fare</p>
          <p className="font-bold">{formatCurrency(data.fare)}</p>
        </div>
        <div className="flex items-center justify-between p-4">
          <p className="text-sm">Service Fee</p>
          <p className="font-bold">{formatCurrency(data.serviceFee)}</p>
        </div>
        <div className="flex items-center justify-between p-4">
          <p className="text-sm font-semibold">Total</p>
          <p className="font-bold">{formatCurrency(data.total)}</p>
        </div>
        <div className="flex items-center justify-between p-4">
          <p className="text-sm">Payment</p>
          <p className="text-sm">
            {data.paymentMethod.type === "visa" ? "Visa" : "Mastercard"} ****{data.paymentMethod.last4}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">{data.ride.pickup.address}</p>
        <p className="text-xs text-muted mt-1">to</p>
        <p className="text-sm font-semibold">{data.ride.dropoff.address}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span>{data.ride.distanceMi} mi</span>
          <span>{data.ride.durationMin} min</span>
        </div>
      </div>
    </div>
  );
}
