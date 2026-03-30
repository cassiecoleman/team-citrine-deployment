import type { RideReceipt } from "../types";
import { formatCurrency } from "@/lib/utils";

export function ReceiptCard({ receipt }: { receipt: RideReceipt }) {
  return (
    <div className="space-y-4">
      {/* Receipt */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm">
          <p>
            {"\uD83C\uDFE0"} {receipt.ride.pickup.address} → {"\uD83C\uDFE5"}{" "}
            {receipt.ride.dropoff.address}
          </p>
          <p className="text-muted">
            Mon {receipt.rideTime.start}-{receipt.rideTime.end}
          </p>
        </div>
        <div className="px-4 py-3 border-b border-border">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Fare</span>
            <span>{formatCurrency(receipt.totalFare)}</span>
          </div>
        </div>
        {receipt.riders.map((rider) => (
          <div
            key={rider.user.id}
            className="px-4 py-2 border-b border-border last:border-b-0"
          >
            <div className="flex justify-between text-sm">
              <span>
                {"\uD83D\uDC64"} {rider.user.name}
              </span>
              <span className="font-medium">{formatCurrency(rider.charge)}</span>
            </div>
            <p className="text-xs text-muted">
              {"\uD83D\uDCB3"} {rider.paymentMethod.type === "visa" ? "Visa" : "MC"} ····
              {rider.paymentMethod.last4}
            </p>
          </div>
        ))}
        <div className="px-4 py-3 bg-success-light">
          <p className="text-sm font-semibold text-success text-center">
            {"\u2713"} You saved {formatCurrency(receipt.savings)}!
          </p>
        </div>
      </div>

      {/* Weekly projection */}
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-sm">
          {"\uD83D\uDCA1"} Save{" "}
          <span className="font-semibold">
            {formatCurrency(receipt.weeklySavingsProjection)}/week
          </span>
        </p>
        <p className="text-xs text-muted">by splitting daily!</p>
      </div>
    </div>
  );
}
