import type { SplitRider } from "../types";
import { formatCurrency } from "@/lib/utils";

export function RiderConfirmation({ riders }: { riders: SplitRider[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {riders.map((rider) => (
        <div
          key={rider.user.id}
          className="rounded-xl border border-border p-3 text-center"
        >
          <div className="text-2xl mb-1">{"\uD83D\uDC64"}</div>
          <p className="text-sm font-medium">{rider.user.name}</p>
          <span
            className={`inline-block mt-1 text-xs font-semibold ${
              rider.status === "accepted" ? "text-success" : "text-muted"
            }`}
          >
            {rider.status === "accepted" ? "\u2713 Confirmed" : "Pending..."}
          </span>
          <p className="text-sm font-semibold mt-1">
            {formatCurrency(rider.fare)}
          </p>
        </div>
      ))}
    </div>
  );
}
