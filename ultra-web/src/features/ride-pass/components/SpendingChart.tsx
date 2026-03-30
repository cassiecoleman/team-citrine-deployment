import type { SpendingData, RidePassPlan } from "../types";
import { formatCurrency } from "@/lib/utils";

export function SpendingChart({
  spending,
  selectedPlan,
}: {
  spending: SpendingData;
  selectedPlan?: RidePassPlan;
}) {
  const passPrice = selectedPlan?.pricePerWeek ?? 75;
  const maxSpend = Math.max(spending.avgWeeklySpend, passPrice);

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">
        &#128202; Your Spending
      </h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">Avg now:</span>
            <span className="font-medium">{formatCurrency(spending.avgWeeklySpend)}/wk</span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-red-400"
              style={{ width: `${(spending.avgWeeklySpend / maxSpend) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">With pass:</span>
            <span className="font-medium text-success">{formatCurrency(passPrice)}/wk</span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${(passPrice / maxSpend) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
